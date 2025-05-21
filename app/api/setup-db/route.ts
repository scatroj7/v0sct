import { NextResponse } from "next/server"
import { getSql } from "@/app/lib/db-server"

export async function POST() {
  try {
    console.log("Veritabanı tabloları oluşturuluyor...")

    // SQL fonksiyonunu al
    const sql = getSql()

    // Transactions tablosunu oluştur
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS transactions (
          id SERIAL PRIMARY KEY,
          user_id VARCHAR(255),
          amount DECIMAL(10, 2) NOT NULL,
          description TEXT,
          date DATE NOT NULL,
          category_id INTEGER,
          is_recurring BOOLEAN DEFAULT FALSE,
          recurring_interval VARCHAR(50),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `

      console.log("Transactions tablosu başarıyla oluşturuldu")
    } catch (error) {
      console.error("Transactions tablosu oluşturulurken hata:", error)
      return NextResponse.json(
        { success: false, message: "Transactions tablosu oluşturulurken bir hata oluştu", error: String(error) },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Veritabanı tabloları başarıyla oluşturuldu",
    })
  } catch (error) {
    console.error("Veritabanı tabloları oluşturulurken beklenmeyen hata:", error)
    return NextResponse.json(
      { success: false, message: "Veritabanı tabloları oluşturulurken bir hata oluştu", error: String(error) },
      { status: 500 },
    )
  }
}
