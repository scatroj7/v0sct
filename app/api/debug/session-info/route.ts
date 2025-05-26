import { NextResponse } from "next/server"
import { getUserIdFromSession } from "@/app/lib/auth"
import { cookies } from "next/headers"

export async function GET() {
  try {
    const cookieStore = cookies()
    const allCookies = cookieStore.getAll()

    const userId = getUserIdFromSession()

    return NextResponse.json({
      success: true,
      userId: userId,
      allCookies: allCookies,
      sessionCookie: cookieStore.get("session"),
    })
  } catch (error) {
    console.error("Session info alınırken hata:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
