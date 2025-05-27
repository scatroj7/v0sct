export function isCurrentUserAdmin(): boolean {
  try {
    // Server-side check
    if (typeof window === "undefined") {
      console.log("🌐 Server-side: Admin kontrolü yapılamıyor")
      return false
    }

    const userStr = localStorage.getItem("scatrack_user")
    if (!userStr) {
      console.log("👤 Kullanıcı bilgisi bulunamadı")
      return false
    }

    const user = JSON.parse(userStr)
    const isAdmin = user.email === "huseyin97273@gmail.com"

    console.log("👤 Admin kontrolü:", {
      email: user.email,
      isAdmin: isAdmin,
    })

    return isAdmin
  } catch (error) {
    console.error("❌ Admin auth error:", error)
    return false
  }
}

// Alias for easier import
export const isAdmin = isCurrentUserAdmin

export function getCurrentUserEmail(): string {
  try {
    if (typeof window === "undefined") return ""

    const userStr = localStorage.getItem("scatrack_user")
    if (!userStr) return ""

    const user = JSON.parse(userStr)
    return user.email || ""
  } catch (error) {
    console.error("❌ Get user email error:", error)
    return ""
  }
}
