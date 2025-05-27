import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { cookies } from "next/headers"
import { sql } from "./db-server"

// JWT Secret kontrolü
const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required")
}

// Güvenli şifre hash'leme
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return await bcrypt.hash(password, saltRounds)
}

// Şifre doğrulama
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword)
}

// JWT token oluşturma
export function createJWTToken(userId: string): string {
  return jwt.sign(
    {
      userId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 saat
    },
    JWT_SECRET,
    { algorithm: "HS256" },
  )
}

// JWT token doğrulama
export function verifyJWTToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    return { userId: decoded.userId }
  } catch (error) {
    console.error("JWT verification failed:", error)
    return null
  }
}

// Güvenli kullanıcı ID alma
export async function getSecureUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session_token")

    if (!sessionToken) {
      return null
    }

    const decoded = verifyJWTToken(sessionToken.value)
    return decoded?.userId || null
  } catch (error) {
    console.error("Error getting secure user ID:", error)
    return null
  }
}

// Kullanıcı kayıt
export async function registerUserSecure(
  name: string,
  email: string,
  password: string,
): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    // Email format kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return { success: false, error: "Geçersiz email formatı" }
    }

    // Şifre güçlülük kontrolü
    if (password.length < 8) {
      return { success: false, error: "Şifre en az 8 karakter olmalıdır" }
    }

    // Şifre karmaşıklık kontrolü
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumbers = /\d/.test(password)

    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      return {
        success: false,
        error: "Şifre büyük harf, küçük harf ve rakam içermelidir",
      }
    }

    // Mevcut kullanıcı kontrolü
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email}
    `

    if (existingUser.length > 0) {
      return { success: false, error: "Bu email zaten kayıtlı" }
    }

    // Şifreyi hash'le
    const hashedPassword = await hashPassword(password)

    // Kullanıcıyı kaydet
    const result = await sql`
      INSERT INTO users (name, email, password_hash, created_at)
      VALUES (${name}, ${email}, ${hashedPassword}, NOW())
      RETURNING id
    `

    return { success: true, userId: result[0].id }
  } catch (error) {
    console.error("User registration error:", error)
    return { success: false, error: "Kayıt sırasında bir hata oluştu" }
  }
}

// Kullanıcı giriş
export async function loginUserSecure(
  email: string,
  password: string,
): Promise<{ success: boolean; token?: string; userId?: string; error?: string }> {
  try {
    // Rate limiting kontrolü
    const rateLimitResult = await checkRateLimit(email)
    if (!rateLimitResult.allowed) {
      return {
        success: false,
        error: `Çok fazla başarısız deneme. ${rateLimitResult.retryAfter} saniye sonra tekrar deneyin.`,
      }
    }

    // Kullanıcıyı bul
    const users = await sql`
      SELECT id, password_hash, failed_login_attempts, locked_until 
      FROM users 
      WHERE email = ${email}
    `

    if (users.length === 0) {
      await recordFailedLogin(email)
      return { success: false, error: "Email veya şifre hatalı" }
    }

    const user = users[0]

    // Hesap kilitli mi kontrol et
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      return {
        success: false,
        error: "Hesap geçici olarak kilitlendi. Lütfen daha sonra tekrar deneyin.",
      }
    }

    // Şifreyi doğrula
    const isValidPassword = await verifyPassword(password, user.password_hash)

    if (!isValidPassword) {
      await recordFailedLogin(email, user.id)
      return { success: false, error: "Email veya şifre hatalı" }
    }

    // Başarılı giriş - failed attempts'i sıfırla
    await sql`
      UPDATE users 
      SET failed_login_attempts = 0, locked_until = NULL, last_login = NOW()
      WHERE id = ${user.id}
    `

    // JWT token oluştur
    const token = createJWTToken(user.id)

    return { success: true, token, userId: user.id }
  } catch (error) {
    console.error("User login error:", error)
    return { success: false, error: "Giriş sırasında bir hata oluştu" }
  }
}

// Rate limiting
async function checkRateLimit(email: string): Promise<{ allowed: boolean; retryAfter?: number }> {
  try {
    const attempts = await sql`
      SELECT COUNT(*) as count 
      FROM login_attempts 
      WHERE email = ${email} 
      AND created_at > NOW() - INTERVAL '15 minutes'
    `

    const attemptCount = Number(attempts[0].count)

    if (attemptCount >= 5) {
      return { allowed: false, retryAfter: 900 } // 15 dakika
    }

    return { allowed: true }
  } catch (error) {
    console.error("Rate limit check error:", error)
    return { allowed: true } // Hata durumunda izin ver
  }
}

// Başarısız giriş kaydı
async function recordFailedLogin(email: string, userId?: string): Promise<void> {
  try {
    // Login attempts tablosuna kaydet
    await sql`
      INSERT INTO login_attempts (email, user_id, created_at)
      VALUES (${email}, ${userId || null}, NOW())
    `

    // Kullanıcı varsa failed_login_attempts'i artır
    if (userId) {
      const result = await sql`
        UPDATE users 
        SET failed_login_attempts = failed_login_attempts + 1
        WHERE id = ${userId}
        RETURNING failed_login_attempts
      `

      // 5 başarısız denemeden sonra hesabı kilitle
      if (result[0]?.failed_login_attempts >= 5) {
        await sql`
          UPDATE users 
          SET locked_until = NOW() + INTERVAL '30 minutes'
          WHERE id = ${userId}
        `
      }
    }
  } catch (error) {
    console.error("Failed login record error:", error)
  }
}

// Session temizleme
export async function logoutUser(): Promise<void> {
  try {
    const cookieStore = await cookies()
    cookieStore.delete("session_token")
  } catch (error) {
    console.error("Logout error:", error)
  }
}
