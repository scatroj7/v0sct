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

    // İşlemi getir
    const transaction = await sql`
      SELECT t.*, c.name as category_name, c.color as category_color 
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.id = ${id}::uuid AND t.user_id = ${userId}::uuid
    `

    if (transaction.length === 0) {
      return NextResponse.json({ error: "İşlem bulunamadı" }, { status: 404 })
    }

    return NextResponse.json(transaction[0])
  } catch (error) {
    console.error("İşlem getirilirken hata:", error)
    return NextResponse.json({ error: "İşlem getirilirken bir hata oluştu" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = getUserIdFromSession()

    if (!userId) {
      return NextResponse.json({ error: "Oturum bulunamadı" }, { status: 401 })
    }

    const id = params.id
    const { amount, date, description, type, category_id } = await request.json()

    if (!amount || !date || !type) {
      return NextResponse.json({ error: "Tutar, tarih ve tür gereklidir" }, { status: 400 })
    }

    // İşlemi güncelle
    const result = await sql`
      UPDATE transactions 
      SET amount = ${amount}, 
          date = ${date}, 
          description = ${description || ""}, 
          type = ${type}, 
          category_id = ${category_id ? category_id : null} 
      WHERE id = ${id}::uuid AND user_id = ${userId}::uuid 
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "İşlem bulunamadı veya güncellenemedi" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("İşlem güncellenirken hata:", error)
    return NextResponse.json({ error: "İşlem güncellenirken bir hata oluştu" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = getUserIdFromSession()

    if (!userId) {
      return NextResponse.json({ error: "Oturum bulunamadı" }, { status: 401 })
    }

    const id = params.id

    // İşlemi sil
    const result = await sql`
      DELETE FROM transactions 
      WHERE id = ${id}::uuid AND user_id = ${userId}::uuid 
      RETURNING id
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "İşlem bulunamadı veya silinemedi" }, { status: 404 })
    }

    return NextResponse.json({ id: result[0].id })
  } catch (error) {
    console.error("İşlem silinirken hata:", error)
    return NextResponse.json({ error: "İşlem silinirken bir hata oluştu" }, { status: 500 })
  }
}
