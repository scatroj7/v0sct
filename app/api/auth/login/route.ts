import { type NextRequest, NextResponse } from "next/server"
import { loginUserSecure } from "@/app/lib/auth-secure"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ success: false, error: "Email ve şifre gereklidir" }, { status: 400 })
    }

    const result = await loginUserSecure(email, password)

    if (result.success) {
      // Cookie'yi server-side set et
      const response = NextResponse.json({
        success: true,
        message: "Giriş başarılı",
        userId: result.userId,
      })

      response.cookies.set("session_token", result.token!, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 24 * 60 * 60, // 24 saat
        path: "/",
      })

      return response
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 401 })
    }
  } catch (error) {
    console.error("Login API error:", error)
    return NextResponse.json({ success: false, error: "Sunucu hatası" }, { status: 500 })
  }
}
