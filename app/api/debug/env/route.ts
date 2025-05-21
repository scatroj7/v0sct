import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Güvenli bir şekilde çevresel değişkenleri göster
    const envVars = {
      NODE_ENV: process.env.NODE_ENV,
      // Veritabanı bağlantı bilgileri (hassas bilgileri maskeleyerek)
      hasNeonDatabaseUrl: !!process.env.NEON_NEON_DATABASE_URL,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasPostgresUrl: !!process.env.POSTGRES_URL,
      hasNeonPostgresUrl: !!process.env.NEON_POSTGRES_URL,
      // Diğer çevresel değişkenler
      VERCEL_ENV: process.env.VERCEL_ENV,
      VERCEL_URL: process.env.VERCEL_URL,
    }

    return NextResponse.json({
      success: true,
      environmentVariables: envVars,
    })
  } catch (error) {
    console.error("Çevresel değişkenler alınırken hata:", error)
    return NextResponse.json(
      { success: false, message: "Çevresel değişkenler alınırken bir hata oluştu", error: String(error) },
      { status: 500 },
    )
  }
}
