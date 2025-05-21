import { NextResponse } from "next/server"

export async function GET(request: Request) {
  // Tüm çevresel değişkenleri logla (hassas bilgiler olmadan)
  const envVars = {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_URL: process.env.VERCEL_URL,
    VERCEL_ENV: process.env.VERCEL_ENV,
    VERCEL_REGION: process.env.VERCEL_REGION,
  }

  // Request bilgilerini al
  const url = new URL(request.url)
  const headers = Object.fromEntries(request.headers)

  // Güvenlik için bazı hassas başlıkları kaldır
  delete headers.authorization
  delete headers.cookie

  return NextResponse.json({
    success: true,
    message: "Routing testi başarılı",
    requestInfo: {
      url: url.toString(),
      path: url.pathname,
      host: url.host,
      origin: url.origin,
    },
    headers,
    envVars,
    timestamp: new Date().toISOString(),
  })
}
