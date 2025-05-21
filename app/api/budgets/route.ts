import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/app/lib/db-server"
import { getUserIdFromSession } from "@/app/lib/auth"

export async function GET(request: NextRequest) {
  try {
    console.log("Bütçeler getiriliyor...")
    const userId = getUserIdFromSession()

    if (!userId) {
      return NextResponse.json({ error: "Oturum bulunamadı" }, { status: 401 })
    }

    const budgets = await sql`
      SELECT b.*, c.name as category_name, c.color as category_color
      FROM budgets b
      LEFT JOIN categories c ON b.category_id = c.id
      WHERE b.user_id = ${userId}::uuid
      ORDER BY b.month DESC, b.year DESC
    `

    console.log(`${budgets.length} bütçe bulundu`)

    return NextResponse.json({
      success: true,
      budgets: budgets,
    })
  } catch (error) {
    console.error("Bütçeler getirilirken hata:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Bütçeler getirilirken bir hata oluştu",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromSession()

    if (!userId) {
      return NextResponse.json({ error: "Oturum bulunamadı" }, { status: 401 })
    }

    const { amount, month, year, category_id } = await request.json()

    if (!amount || !month || !year || !category_id) {
      return NextResponse.json({ error: "Tutar, ay, yıl ve kategori gereklidir" }, { status: 400 })
    }

    // Yeni bütçe ekle
    const result = await sql`
      INSERT INTO budgets (amount, month, year, category_id, user_id) 
      VALUES (${amount}, ${month}, ${year}, ${category_id}, ${userId}::uuid) 
      RETURNING *
    `

    return NextResponse.json({
      success: true,
      message: "Bütçe başarıyla eklendi",
      budget: result[0],
    })
  } catch (error) {
    console.error("Bütçe eklenirken hata:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Bütçe eklenirken bir hata oluştu",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
