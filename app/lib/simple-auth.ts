// Basit local storage tabanlı auth sistemi
// JWT kullanmıyor!

export interface User {
  id: string
  name: string
  email: string
  isAdmin?: boolean
}

// Demo kullanıcılar
const DEMO_USERS = [
  {
    id: "admin-huseyin",
    name: "Hüseyin",
    email: "huseyin97273@gmail.com",
    password: "huseyin97273@gmail.com",
    isAdmin: true,
  },
]

export function validateCredentials(email: string, password: string): User | null {
  // Önce demo kullanıcıları kontrol et
  const demoUser = DEMO_USERS.find((u) => u.email === email && u.password === password)
  if (demoUser) {
    return {
      id: demoUser.id,
      name: demoUser.name,
      email: demoUser.email,
      isAdmin: demoUser.isAdmin,
    }
  }

  // Sonra kayıtlı kullanıcıları kontrol et
  const registeredUsers = getStoredUsers()
  const user = registeredUsers.find((u) => u.email === email && u.password === password)
  if (user) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin || false,
    }
  }

  return null
}

export function loginUser(email: string, password: string): User | null {
  return validateCredentials(email, password)
}

export function registerUser(name: string, email: string, password: string): User | null {
  // Email zaten kayıtlı mı kontrol et
  if (isEmailRegistered(email)) {
    return null // Email zaten kullanımda
  }

  // Unique ID oluştur
  const uniqueId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const newUser: User = {
    id: uniqueId,
    name,
    email,
    isAdmin: false,
  }

  // Local storage'a kaydet
  const users = getStoredUsers()
  users.push({ ...newUser, password })

  if (typeof window !== "undefined") {
    localStorage.setItem("scatrack_registered_users", JSON.stringify(users))
    console.log("🆕 Yeni kullanıcı kaydedildi:", { id: uniqueId, name, email })
  }

  return newUser
}

export function isEmailRegistered(email: string): boolean {
  const users = getStoredUsers()
  const demoExists = DEMO_USERS.some((u) => u.email === email)
  const userExists = users.some((u) => u.email === email)
  return demoExists || userExists
}

// Local storage'a kullanıcı kaydet
export function saveUserToLocal(user: User): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("scatrack_current_user", JSON.stringify(user))
    localStorage.setItem("scatrack_logged_in", "true")
    console.log("💾 Kullanıcı local storage'a kaydedildi:", user)
  }
}

// Local storage'dan kullanıcı al
export function getUserFromLocal(): User | null {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("scatrack_current_user")
    const isLoggedIn = localStorage.getItem("scatrack_logged_in")

    if (stored && isLoggedIn === "true") {
      try {
        const user = JSON.parse(stored)
        console.log("📖 Local storage'dan kullanıcı alındı:", user)
        return user
      } catch (error) {
        console.error("Error parsing user data:", error)
        return null
      }
    }
  }
  return null
}

// Kullanıcı giriş yapmış mı kontrol et
export function isUserLoggedIn(): boolean {
  if (typeof window !== "undefined") {
    return localStorage.getItem("scatrack_logged_in") === "true"
  }
  return false
}

// Çıkış yap
export function logoutUser(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("scatrack_current_user")
    localStorage.removeItem("scatrack_logged_in")
    console.log("🚪 Kullanıcı çıkış yaptı")
  }
}

// Eski fonksiyon adı için alias
export function logout(): void {
  logoutUser()
}

// Eski fonksiyon adı için alias
export function getCurrentUser(): User | null {
  return getUserFromLocal()
}

function getStoredUsers(): Array<User & { password: string }> {
  if (typeof window === "undefined") return []

  const stored = localStorage.getItem("scatrack_registered_users")
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch (error) {
      console.error("Error parsing registered users:", error)
      return []
    }
  }
  return []
}

// Debug fonksiyonu - tüm kullanıcıları listele
export function debugListAllUsers(): void {
  if (typeof window !== "undefined") {
    console.log("🔍 DEMO KULLANICILAR:", DEMO_USERS)
    console.log("🔍 KAYITLI KULLANICILAR:", getStoredUsers())
    console.log("🔍 AKTİF KULLANICI:", getUserFromLocal())
  }
}
