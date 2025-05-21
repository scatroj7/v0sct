import { NextResponse } from "next/server"
import { getSql } from "@/app/lib/db-server"

export async function POST() {
  try {
    console.log("Kategori tablosu oluşturuluyor...")

    // SQL fonksiyonunu al
    const sql = getSql()

    // Categories tablosunu oluştur
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS categories (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          type VARCHAR(50) NOT NULL,
          user_id VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `

      console.log("Categories tablosu başarıyla oluşturuldu")
    } catch (error) {
      console.error("Categories tablosu oluşturulurken hata:", error)
      return NextResponse.json(
        { success: false, message: "Categories tablosu oluşturulurken bir hata oluştu", error: String(error) },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Kategori tablosu başarıyla oluşturuldu",
    })
  } catch (error) {
    console.error("Kategori tablosu oluşturulurken beklenmeyen hata:", error)
    return NextResponse.json(
      { success: false, message: "Kategori tablosu oluşturulurken bir hata oluştu", error: String(error) },
      { status: 500 },
    )
  }
}
