import { NextResponse } from "next/server"
import { testConnection } from "@/lib/db-server"

export async function GET() {
  try {
    console.log("Veritabanı bağlantısı test ediliyor...")

    // Bağlantıyı test et
    const connectionTest = await testConnection()

    // Tüm çevresel değişkenleri logla (hassas bilgiler olmadan)
    const envVars = {
      NODE_ENV: process.env.NODE_ENV,
      hasPostgresUrl: !!process.env.POSTGRES_URL,
      hasNeonDatabaseUrl: !!process.env.NEON_NEON_DATABASE_URL,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasNeonPostgresUrl: !!process.env.NEON_POSTGRES_URL,
    }

    console.log("Çevresel değişkenler:", envVars)

    return NextResponse.json({
      success: connectionTest.success,
      message: connectionTest.success ? "Veritabanı bağlantısı başarılı" : "Veritabanı bağlantısı başarısız",
      error: connectionTest.error,
      envVars,
    })
  } catch (error: any) {
    console.error("Test API hatası:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Veritabanı bağlantısı test edilirken bir hata oluştu",
        error: error.message,
      },
      { status: 500 },
    )
  }
}
