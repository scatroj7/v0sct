import { NextResponse } from "next/server"
import { sql } from "@/app/lib/db-server"

export async function GET() {
  try {
    console.log("Transactions tablosu yapısı kontrol ediliyor...")

    // Önce mevcut tablo yapısını kontrol et
    const tableInfo = await sql`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'transactions'
      ORDER BY ordinal_position;
    `

    console.log("Mevcut tablo yapısı:", tableInfo)

    // id sütununun SERIAL olup olmadığını kontrol et
    const idColumn = tableInfo.find((col: any) => col.column_name === "id")

    if (!idColumn) {
      console.log("id sütunu bulunamadı, tablo yapısını düzeltiyoruz...")

      // Tablo yapısını düzelt - id sütununu SERIAL olarak ekle
      await sql`
        ALTER TABLE transactions 
        ADD COLUMN IF NOT EXISTS id SERIAL PRIMARY KEY;
      `

      return NextResponse.json({
        success: true,
        message: "Transactions tablosu yapısı düzeltildi, id sütunu SERIAL olarak eklendi.",
        tableInfo,
      })
    }

    // id sütunu var ama SERIAL değilse
    if (!idColumn.column_default || !idColumn.column_default.includes("nextval")) {
      console.log("id sütunu SERIAL değil, düzeltiyoruz...")

      // Önce mevcut id sütununu kaldır
      await sql`
        ALTER TABLE transactions DROP COLUMN id;
      `

      // Sonra SERIAL olarak ekle
      await sql`
        ALTER TABLE transactions 
        ADD COLUMN id SERIAL PRIMARY KEY;
      `

      return NextResponse.json({
        success: true,
        message: "Transactions tablosu yapısı düzeltildi, id sütunu SERIAL olarak yeniden yapılandırıldı.",
        tableInfo,
      })
    }

    return NextResponse.json({
      success: true,
      message: "Transactions tablosu yapısı doğru, id sütunu SERIAL olarak tanımlanmış.",
      tableInfo,
    })
  } catch (error) {
    console.error("Tablo yapısı kontrol edilirken hata:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Tablo yapısı kontrol edilirken bir hata oluştu",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
