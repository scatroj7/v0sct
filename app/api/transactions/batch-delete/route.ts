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

    // İşlemleri toplu olarak sil
    const placeholders = ids.map((_, i) => `$${i + 2}::uuid`).join(", ")
    const query = `
      DELETE FROM transactions 
      WHERE user_id = $1::uuid AND id IN (${placeholders}) 
      RETURNING id
    `

    const params = [userId, ...ids]

    const result = await sql.query(query, params)

    return NextResponse.json({
      deletedCount: result.rows.length,
      deletedIds: result.rows.map((row) => row.id),
    })
  } catch (error) {
    console.error("İşlemler toplu silinirken hata:", error)
    return NextResponse.json({ error: "İşlemler toplu silinirken bir hata oluştu" }, { status: 500 })
  }
}
