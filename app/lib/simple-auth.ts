// Basit local authentication - sadece kayıt olan kullanıcılar
export interface User {
  id: string
  name: string
  email: string
  createdAt: string
}

// Local storage'da kullanıcı bilgilerini sakla
export function saveUserToLocal(user: User): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("scatrack_user", JSON.stringify(user))
    localStorage.setItem("scatrack_logged_in", "true")
  }
}

// Local storage'dan kullanıcı bilgilerini al
export function getUserFromLocal(): User | null {
  if (typeof window !== "undefined") {
    const userStr = localStorage.getItem("scatrack_user")
    const isLoggedIn = localStorage.getItem("scatrack_logged_in")

    if (userStr && isLoggedIn === "true") {
      try {
        return JSON.parse(userStr)
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

// Kullanıcı çıkışı
export function logoutUser(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("scatrack_user")
    localStorage.removeItem("scatrack_logged_in")
  }
}

// Giriş kontrolü - sadece kayıtlı kullanıcılar
export function validateCredentials(email: string, password: string): User | null {
  const registeredUsers = getRegisteredUsers()
  const user = registeredUsers.find((u) => u.email === email && u.password === password)

  if (user) {
    const { password: _, ...userWithoutPassword } = user
    return userWithoutPassword
  }

  return null
}

// Yeni kullanıcı kayıt (local)
export function registerUser(name: string, email: string, password: string): User | null {
  // Email zaten kayıtlı mı kontrol et
  const existingUsers = getRegisteredUsers()
  const emailExists = existingUsers.some((u) => u.email === email)

  if (emailExists) {
    return null // Email zaten kullanımda
  }

  const newUser: User = {
    id: `user-${Date.now()}`,
    name,
    email,
    createdAt: new Date().toISOString(),
  }

  // Local storage'a kaydet
  existingUsers.push({ ...newUser, password })

  if (typeof window !== "undefined") {
    localStorage.setItem("scatrack_registered_users", JSON.stringify(existingUsers))
  }

  return newUser
}

// Önceden tanımlı admin hesapları ekle
const PREDEFINED_USERS = [
  {
    id: "admin-huseyin",
    name: "Hüseyin",
    email: "huseyin97273@gmail.com",
    password: "huseyin97273@gmail.com", // Kullanıcının istediği şifre
    createdAt: "2024-01-01T00:00:00.000Z",
    isAdmin: true,
  },
]

// Kayıtlı kullanıcıları al
function getRegisteredUsers(): Array<User & { password: string }> {
  if (typeof window !== "undefined") {
    const usersStr = localStorage.getItem("scatrack_registered_users")
    let localUsers = []

    if (usersStr) {
      try {
        localUsers = JSON.parse(usersStr)
      } catch (error) {
        console.error("Error parsing registered users:", error)
      }
    }

    // Önceden tanımlı kullanıcıları ekle (eğer yoksa)
    const allUsers = [...PREDEFINED_USERS]

    // Local kullanıcıları ekle (çakışma olmaması için email kontrolü)
    localUsers.forEach((localUser: any) => {
      const exists = allUsers.some((u) => u.email === localUser.email)
      if (!exists) {
        allUsers.push(localUser)
      }
    })

    return allUsers
  }
  return PREDEFINED_USERS
}

// Email kontrolü
export function isEmailRegistered(email: string): boolean {
  const users = getRegisteredUsers()
  return users.some((u) => u.email === email)
}
