import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/app/lib/db-server"
import { getUserIdFromSession } from "@/app/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromSession()

    if (!userId) {
      return NextResponse.json({ error: "Oturum bulunamadı" }, { status: 401 })
    }

    const { ids } = await request.json()

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "Silinecek işlem ID'leri gereklidir" }, { status: 400 })
    }

    // UUID tipindeki değerleri doğru şekilde ele almak için sorguyu düzeltiyoruz
    const placeholders = ids.map((_, i) => `$${i + 2}`).join(", ")
    const query = `
      DELETE FROM transactions 
      WHERE user_id = $1 AND id IN (${placeholders}) 
      RETURNING id
    `

    const params = [userId, ...ids]

    console.log("Batch delete query:", query)
    console.log("Batch delete params:", params)

    const result = await sql.query(query, params)

    console.log("Query result:", result)

    // Sonuç yapısını kontrol et ve güvenli bir şekilde işle
    const rows = result?.rows || []
    const deletedIds = rows.map((row) => row?.id || "").filter(Boolean)

    return NextResponse.json({
      success: true,
      deletedCount: rows.length,
      deletedIds: deletedIds,
    })
  } catch (error) {
    console.error("İşlemler toplu silinirken hata:", error)
    return NextResponse.json(
      {
        success: false,
        error: `İşlemler toplu silinirken bir hata oluştu: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 },
    )
  }
}
