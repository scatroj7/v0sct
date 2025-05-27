import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyJWTToken } from "./app/lib/auth-secure"

export function middleware(request: NextRequest) {
  console.log("Secure middleware çalıştı:", request.nextUrl.pathname)

  // Panel sayfasına erişim kontrolü
  if (request.nextUrl.pathname.startsWith("/panel")) {
    console.log("Panel sayfası erişimi kontrol ediliyor")

    // Session token'ını kontrol et
    const sessionToken = request.cookies.get("session_token")

    if (!sessionToken) {
      console.log("Middleware: Session token yok, login sayfasına yönlendiriliyor")
      return NextResponse.redirect(new URL("/login", request.url))
    }

    // Token'ı doğrula
    const decoded = verifyJWTToken(sessionToken.value)

    if (!decoded) {
      console.log("Middleware: Geçersiz token, login sayfasına yönlendiriliyor")
      // Geçersiz token'ı temizle
      const response = NextResponse.redirect(new URL("/login", request.url))
      response.cookies.delete("session_token")
      return response
    }

    console.log("Middleware: Geçerli session, erişim izni verildi")
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/panel/:path*"],
}
