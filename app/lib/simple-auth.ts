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
    id: "1",
    name: "Hüseyin",
    email: "huseyin97273@gmail.com",
    password: "huseyin97273@gmail.com",
    isAdmin: true,
  },
]

export function validateCredentials(email: string, password: string): User | null {
  const user = DEMO_USERS.find((u) => u.email === email && u.password === password)
  if (user) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
    }
  }
  return null
}

export function loginUser(email: string, password: string): User | null {
  return validateCredentials(email, password)
}

export function registerUser(name: string, email: string, password: string): User | null {
  // Basit kayıt sistemi
  const newUser: User = {
    id: Date.now().toString(),
    name,
    email,
    isAdmin: false,
  }

  // Local storage'a kaydet
  const users = getStoredUsers()
  users.push({ ...newUser, password })

  if (typeof window !== "undefined") {
    localStorage.setItem("users", JSON.stringify(users))
  }

  return newUser
}

export function isEmailRegistered(email: string): boolean {
  const users = getStoredUsers()
  return users.some((u) => u.email === email) || DEMO_USERS.some((u) => u.email === email)
}

// Local storage'a kullanıcı kaydet
export function saveUserToLocal(user: User): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("currentUser", JSON.stringify(user))
    localStorage.setItem("scatrack_logged_in", "true")
  }
}

// Local storage'dan kullanıcı al
export function getUserFromLocal(): User | null {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("currentUser")
    const isLoggedIn = localStorage.getItem("scatrack_logged_in")

    if (stored && isLoggedIn === "true") {
      try {
        return JSON.parse(stored)
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
    localStorage.removeItem("currentUser")
    localStorage.removeItem("scatrack_logged_in")
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

function getStoredUsers(): any[] {
  if (typeof window === "undefined") return []

  const stored = localStorage.getItem("users")
  return stored ? JSON.parse(stored) : []
}
