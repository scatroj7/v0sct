// Basit local storage tabanlı auth sistemi
// JWT kullanmıyor!

export interface User {
  id: string
  name: string
  email: string
  isAdmin: boolean
}

// Demo kullanıcılar
const DEMO_USERS = [
  {
    id: "1",
    name: "Admin User",
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
  localStorage.setItem("users", JSON.stringify(users))

  return newUser
}

export function isEmailRegistered(email: string): boolean {
  const users = getStoredUsers()
  return users.some((u) => u.email === email) || DEMO_USERS.some((u) => u.email === email)
}

export function saveUserToLocal(user: User): void {
  localStorage.setItem("currentUser", JSON.stringify(user))
}

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null

  const stored = localStorage.getItem("currentUser")
  return stored ? JSON.parse(stored) : null
}

export function logout(): void {
  localStorage.removeItem("currentUser")
}

function getStoredUsers(): any[] {
  if (typeof window === "undefined") return []

  const stored = localStorage.getItem("users")
  return stored ? JSON.parse(stored) : []
}
