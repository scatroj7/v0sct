import { NextResponse } from "next/server"
import { sql } from "@/app/lib/db-server"

export async function GET() {
  try {
    console.log("Bütçe tablosu oluşturuluyor...")

    // Bütçe tablosunu oluştur
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS budgets (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id TEXT NOT NULL,
          category_id UUID,
          amount DECIMAL(10, 2) NOT NULL,
          start_date DATE NOT NULL,
          end_date DATE NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `
      console.log("Bütçe tablosu oluşturuldu veya zaten mevcut")
    } catch (error) {
      console.error("Bütçe tablosu oluşturulurken hata:", error)
      return NextResponse.json(
        {
          success: false,
          message: "Bütçe tablosu oluşturulurken bir hata oluştu",
          error: error instanceof Error ? error.message : String(error),
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Bütçe tablosu başarıyla oluşturuldu",
    })
  } catch (error) {
    console.error("Bütçe tablosu oluşturulurken hata:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Bütçe tablosu oluşturulurken bir hata oluştu",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
