import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Hiçbir kontrol yok - sadece geçiş
  return NextResponse.next()
}

export const config = {
  matcher: [],
}
