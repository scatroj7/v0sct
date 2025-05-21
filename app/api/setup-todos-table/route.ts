import { NextResponse } from "next/server"
import { sql } from "@/app/lib/db-server"

export async function GET() {
  try {
    console.log("Yapılacaklar tablosu oluşturuluyor...")

    // Yapılacaklar tablosunu oluştur
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS todos (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          is_completed BOOLEAN DEFAULT FALSE,
          due_date DATE,
          priority TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `
      console.log("Yapılacaklar tablosu oluşturuldu veya zaten mevcut")
    } catch (error) {
      console.error("Yapılacaklar tablosu oluşturulurken hata:", error)
      return NextResponse.json(
        {
          success: false,
          message: "Yapılacaklar tablosu oluşturulurken bir hata oluştu",
          error: error instanceof Error ? error.message : String(error),
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Yapılacaklar tablosu başarıyla oluşturuldu",
    })
  } catch (error) {
    console.error("Yapılacaklar tablosu oluşturulurken hata:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Yapılacaklar tablosu oluşturulurken bir hata oluştu",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
