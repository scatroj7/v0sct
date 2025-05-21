import { NextResponse } from "next/server"
import { sql } from "@/app/lib/db-server"

export async function GET() {
  try {
    console.log("Todos tablosuna priority sütunu ekleniyor...")

    // Önce sütunun var olup olmadığını kontrol et
    const checkColumn = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'todos' AND column_name = 'priority'
      );
    `

    const columnExists = checkColumn[0]?.exists

    if (columnExists) {
      console.log("Priority sütunu zaten mevcut")
      return NextResponse.json({
        success: true,
        message: "Priority sütunu zaten mevcut",
      })
    }

    // Sütunu ekle
    await sql`
      ALTER TABLE todos
      ADD COLUMN priority INTEGER DEFAULT 1;
    `

    console.log("Priority sütunu başarıyla eklendi")

    return NextResponse.json({
      success: true,
      message: "Priority sütunu başarıyla eklendi",
    })
  } catch (error) {
    console.error("Priority sütunu eklenirken hata:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Priority sütunu eklenirken bir hata oluştu",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
