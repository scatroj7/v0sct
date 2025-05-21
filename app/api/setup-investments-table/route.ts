import { NextResponse } from "next/server"
import { sql } from "@/app/lib/db-server"

export async function GET() {
  try {
    console.log("Yatırımlar tablosu oluşturuluyor...")

    // Önce tabloyu silmeyi dene (eğer UUID hatası varsa)
    try {
      await sql`DROP TABLE IF EXISTS investments;`
      console.log("Eski yatırımlar tablosu silindi")
    } catch (error) {
      console.error("Tablo silinirken hata:", error)
      // Hata olsa bile devam et
    }

    // Tablo yoksa oluştur
    await sql`
      CREATE TABLE IF NOT EXISTS investments (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        type TEXT NOT NULL,
        amount DECIMAL NOT NULL,
        purchase_price DECIMAL NOT NULL,
        current_price DECIMAL,
        symbol TEXT,
        purchase_date DATE NOT NULL,
        notes TEXT,
        last_updated TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `

    console.log("Yatırımlar tablosu başarıyla oluşturuldu")

    return NextResponse.json({
      success: true,
      message: "Yatırımlar tablosu başarıyla oluşturuldu",
    })
  } catch (error) {
    console.error("Yatırımlar tablosu oluşturulurken hata:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Yatırımlar tablosu oluşturulurken bir hata oluştu",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
