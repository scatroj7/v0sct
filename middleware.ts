import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Panel sayfasına erişim kontrolü
  if (request.nextUrl.pathname.startsWith("/panel")) {
    // Client-side'da kontrol edilecek, middleware'da sadece yönlendirme
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/panel/:path*"],
}
