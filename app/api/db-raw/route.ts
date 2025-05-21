import { NextResponse } from "next/server"
import { sql, getTableStructure, queryTable } from "@/app/lib/db-server"

export async function GET() {
  try {
    console.log("Ham veritabanı verilerini getirme isteği alındı")

    // Tüm tabloları kontrol et
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `

    const result: Record<string, any> = {
      tables: tables.map((t: any) => t.table_name),
      data: {},
      timestamp: new Date().toISOString(),
    }

    // Her tablonun yapısını getir
    for (const table of tables) {
      const tableName = table.table_name
      try {
        // Tablo yapısını getir
        const tableStructure = await getTableStructure(tableName)

        // Tablo verilerini getir
        const tableData = await queryTable(tableName)

        result.data[tableName] = {
          structure: tableStructure,
          rows: tableData,
          count: tableData.length,
        }
      } catch (error) {
        console.error(`${tableName} tablosu verileri getirilirken hata:`, error)
        result.data[tableName] = {
          error: error instanceof Error ? error.message : String(error),
          errorType: error instanceof Error ? error.constructor.name : typeof error,
          stack: error instanceof Error ? error.stack : undefined,
        }
      }
    }

    // Veritabanı bağlantı bilgilerini ekle
    result.connection = {
      hasNeonNeonNeonNeonNeonNeonNeonDatabaseUrl: !!process.env.NEON_NEON_NEON_NEON_NEON_NEON_NEON_NEON_DATABASE_URL,
      hasNeonNeonNeonNeonNeonNeonDatabaseUrl: !!process.env.NEON_NEON_NEON_NEON_NEON_NEON_DATABASE_URL,
      hasNeonNeonNeonDatabaseUrl: !!process.env.NEON_NEON_NEON_DATABASE_URL,
      hasNeonDatabaseUrl: !!process.env.NEON_DATABASE_URL,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasPostgresUrl: !!process.env.POSTGRES_URL,
      hasNeonPostgresUrl: !!process.env.NEON_POSTGRES_URL,
      region: process.env.VERCEL_REGION || "unknown",
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Ham veritabanı verileri getirilirken hata:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Ham veritabanı verileri getirilirken bir hata oluştu",
        error: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}
