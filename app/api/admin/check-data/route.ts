import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/app/lib/db-server"
import { isCurrentUserAdmin } from "@/app/lib/admin-auth"

export async function GET(request: NextRequest) {
  try {
    if (!isCurrentUserAdmin()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("🔍 Veritabanı verileri kontrol ediliyor...")

    // Tablo yapılarını kontrol et
    const tables = ["transactions", "investments", "todos", "users"]
    const tableInfo = {}

    for (const table of tables) {
      try {
        // Tablo var mı kontrol et
        const tableExists = await sql`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = ${table}
          )
        `

        if (tableExists[0].exists) {
          // Veri sayısını al
          const count = await sql`SELECT COUNT(*) as count FROM ${sql(table)}`

          // İlk 5 kaydı al
          const sample = await sql`SELECT * FROM ${sql(table)} LIMIT 5`

          tableInfo[table] = {
            exists: true,
            count: count[0].count,
            sample: sample,
          }
        } else {
          tableInfo[table] = {
            exists: false,
            count: 0,
            sample: [],
          }
        }
      } catch (error) {
        tableInfo[table] = {
          exists: false,
          error: error.message,
          count: 0,
          sample: [],
        }
      }
    }

    // Admin kullanıcısını kontrol et
    const adminUser = await sql`
      SELECT id, email, is_admin, created_at 
      FROM users 
      WHERE email = 'huseyin97273@gmail.com'
    `

    return NextResponse.json({
      success: true,
      tables: tableInfo,
      adminUser: adminUser[0] || null,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ Veri kontrol hatası:", error)
    return NextResponse.json(
      {
        error: "Veri kontrolü başarısız",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
