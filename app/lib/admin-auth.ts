export function isCurrentUserAdmin(): boolean {
  if (typeof window === "undefined") {
    return false
  }

  try {
    const userStr = localStorage.getItem("scatrack_user")
    if (!userStr) {
      return false
    }

    const user = JSON.parse(userStr)
    return user.email === "huseyin97273@gmail.com"
  } catch (error) {
    console.error("Admin kontrol hatası:", error)
    return false
  }
}

// Alias export for compatibility
export const isAdmin = isCurrentUserAdmin
