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

    // Yatırımı getir
    const investment = await sql`
      SELECT * FROM investments 
      WHERE id = ${id}::uuid AND user_id = ${userId}::uuid
    `

    if (investment.length === 0) {
      return NextResponse.json({ error: "Yatırım bulunamadı" }, { status: 404 })
    }

    return NextResponse.json(investment[0])
  } catch (error) {
    console.error("Yatırım getirilirken hata:", error)
    return NextResponse.json({ error: "Yatırım getirilirken bir hata oluştu" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = getUserIdFromSession()

    if (!userId) {
      return NextResponse.json({ error: "Oturum bulunamadı" }, { status: 401 })
    }

    const id = params.id
    const { name, type, amount, purchase_price, current_price, purchase_date, notes } = await request.json()

    if (!name || !type || !amount || !purchase_price || !purchase_date) {
      return NextResponse.json({ error: "Ad, tür, miktar, alış fiyatı ve alış tarihi gereklidir" }, { status: 400 })
    }

    // Yatırımı güncelle
    const result = await sql`
      UPDATE investments 
      SET name = ${name}, 
          type = ${type}, 
          amount = ${amount}, 
          purchase_price = ${purchase_price}, 
          current_price = ${current_price || purchase_price}, 
          purchase_date = ${purchase_date}, 
          notes = ${notes || ""} 
      WHERE id = ${id}::uuid AND user_id = ${userId}::uuid 
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Yatırım bulunamadı veya güncellenemedi" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Yatırım güncellenirken hata:", error)
    return NextResponse.json({ error: "Yatırım güncellenirken bir hata oluştu" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = getUserIdFromSession()

    if (!userId) {
      return NextResponse.json({ error: "Oturum bulunamadı" }, { status: 401 })
    }

    const id = params.id

    // Yatırımı sil
    const result = await sql`
      DELETE FROM investments 
      WHERE id = ${id}::uuid AND user_id = ${userId}::uuid 
      RETURNING id
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Yatırım bulunamadı veya silinemedi" }, { status: 404 })
    }

    return NextResponse.json({ id: result[0].id })
  } catch (error) {
    console.error("Yatırım silinirken hata:", error)
    return NextResponse.json({ error: "Yatırım silinirken bir hata oluştu" }, { status: 500 })
  }
}
