import { NextResponse } from "next/server"
import { testConnection } from "@/app/lib/db-server"

export async function GET() {
  try {
    console.log("Veritabanı bağlantısı test ediliyor...")
    const result = await testConnection()
    console.log("Veritabanı bağlantı testi sonucu:", result)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Veritabanı bağlantı testi başarısız:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
