import { NextResponse } from "next/server"
import { sql } from "@/app/lib/db-server"

export async function GET() {
  try {
    console.log("Yatırımlar tablosu oluşturuluyor...")

    // Yatırımlar tablosunu oluştur
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS investments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id TEXT NOT NULL,
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          amount DECIMAL(10, 2) NOT NULL,
          current_value DECIMAL(10, 2),
          purchase_date DATE NOT NULL,
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `
      console.log("Yatırımlar tablosu oluşturuldu veya zaten mevcut")
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
