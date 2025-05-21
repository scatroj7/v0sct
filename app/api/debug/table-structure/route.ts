import { NextResponse } from "next/server"
import { getClient } from "@/app/lib/db-server"

export async function GET() {
  try {
    console.log("Debug: Tablo yapıları getiriliyor...")

    // SQL client'ı al
    const client = getClient()

    // Tabloları listele
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `
    const tables = await client.query(tablesQuery)
    const tableNames = tables.map((t: any) => t.table_name)

    console.log("Debug: Mevcut tablolar:", tableNames)

    // Her tablonun yapısını getir
    const tableStructures: Record<string, any> = {}

    for (const tableName of tableNames) {
      const structureQuery = `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = $1
        ORDER BY ordinal_position;
      `
      const structure = await client.query(structureQuery, [tableName])
      tableStructures[tableName] = structure
    }

    // Transactions tablosundan örnek veri getir
    let sampleTransactions = []
    if (tableNames.includes("transactions")) {
      const sampleQuery = `
        SELECT * FROM transactions 
        LIMIT 2;
      `
      sampleTransactions = await client.query(sampleQuery)
    }

    // Categories tablosundan örnek veri getir
    let sampleCategories = []
    if (tableNames.includes("categories")) {
      const sampleQuery = `
        SELECT * FROM categories 
        LIMIT 2;
      `
      sampleCategories = await client.query(sampleQuery)
    }

    return NextResponse.json({
      success: true,
      tables: tableNames,
      tableStructures,
      sampleData: {
        transactions: sampleTransactions,
        categories: sampleCategories,
      },
    })
  } catch (error: any) {
    console.error("Debug: Tablo yapıları getirilirken hata:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Tablo yapıları getirilirken bir hata oluştu",
        error: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}
