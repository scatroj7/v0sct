import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  console.log("Middleware çalıştı:", request.nextUrl.pathname)

  // Panel sayfasına erişim kontrolü
  if (request.nextUrl.pathname.startsWith("/panel")) {
    console.log("Panel sayfası erişimi kontrol ediliyor")

    // Session cookie'sini kontrol et
    const sessionCookie = request.cookies.get("session")
    console.log("Session cookie:", sessionCookie ? "Var" : "Yok")

    // Oturum yoksa login sayfasına yönlendir
    if (!sessionCookie) {
      console.log("Middleware: Oturum yok, login sayfasına yönlendiriliyor")
      return NextResponse.redirect(new URL("/login", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/panel/:path*"],
}
