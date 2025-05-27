import { type NextRequest, NextResponse } from "next/server"
import { registerUserSecure } from "@/app/lib/auth-secure"

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json({ success: false, error: "Tüm alanlar gereklidir" }, { status: 400 })
    }

    const result = await registerUserSecure(name, email, password)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Kayıt başarılı",
        userId: result.userId,
      })
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }
  } catch (error) {
    console.error("Register API error:", error)
    return NextResponse.json({ success: false, error: "Sunucu hatası" }, { status: 500 })
  }
}
