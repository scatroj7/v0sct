import { NextResponse } from "next/server"
import { testConnection } from "@/app/lib/db-server"

export async function GET() {
  try {
    console.log("Veritabanı durumu kontrol ediliyor...")
    const result = await testConnection()

    if (result.success) {
      console.log("Veritabanı bağlantısı başarılı")
      return NextResponse.json({ success: true, message: "Veritabanı bağlantısı başarılı", result: result.result })
    } else {
      console.error("Veritabanı bağlantısı başarısız:", result.error)
      return NextResponse.json(
        { success: false, message: "Veritabanı bağlantısı başarısız", error: result.error },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Veritabanı durumu kontrol edilirken hata:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Veritabanı durumu kontrol edilirken bir hata oluştu",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
