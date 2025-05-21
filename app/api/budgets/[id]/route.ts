import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/app/lib/db-server"
import { getUserIdFromSession } from "@/app/lib/auth"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = getUserIdFromSession()

    if (!userId) {
      return NextResponse.json({ error: "Oturum bulunamadı" }, { status: 401 })
    }

    const id = params.id

    // Bütçeyi getir
    const budget = await sql`
      SELECT b.*, c.name as category_name, c.color as category_color 
      FROM budgets b
      LEFT JOIN categories c ON b.category_id = c.id
      WHERE b.id = ${id}::uuid AND b.user_id = ${userId}::uuid
    `

    if (budget.length === 0) {
      return NextResponse.json({ error: "Bütçe bulunamadı" }, { status: 404 })
    }

    return NextResponse.json(budget[0])
  } catch (error) {
    console.error("Bütçe getirilirken hata:", error)
    return NextResponse.json({ error: "Bütçe getirilirken bir hata oluştu" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = getUserIdFromSession()

    if (!userId) {
      return NextResponse.json({ error: "Oturum bulunamadı" }, { status: 401 })
    }

    const id = params.id
    const { name, amount, start_date, end_date, category_id } = await request.json()

    if (!name || !amount || !start_date || !end_date) {
      return NextResponse.json({ error: "Ad, tutar, başlangıç tarihi ve bitiş tarihi gereklidir" }, { status: 400 })
    }

    // Bütçeyi güncelle
    const result = await sql`
      UPDATE budgets 
      SET name = ${name}, 
          amount = ${amount}, 
          start_date = ${start_date}, 
          end_date = ${end_date}, 
          category_id = ${category_id ? category_id : null} 
      WHERE id = ${id}::uuid AND user_id = ${userId}::uuid 
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Bütçe bulunamadı veya güncellenemedi" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Bütçe güncellenirken hata:", error)
    return NextResponse.json({ error: "Bütçe güncellenirken bir hata oluştu" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = getUserIdFromSession()

    if (!userId) {
      return NextResponse.json({ error: "Oturum bulunamadı" }, { status: 401 })
    }

    const id = params.id

    // Bütçeyi sil
    const result = await sql`
      DELETE FROM budgets 
      WHERE id = ${id}::uuid AND user_id = ${userId}::uuid 
      RETURNING id
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Bütçe bulunamadı veya silinemedi" }, { status: 404 })
    }

    return NextResponse.json({ id: result[0].id })
  } catch (error) {
    console.error("Bütçe silinirken hata:", error)
    return NextResponse.json({ error: "Bütçe silinirken bir hata oluştu" }, { status: 500 })
  }
}
