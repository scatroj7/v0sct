import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/app/lib/db-server"
import { getUserIdFromSession } from "@/app/lib/auth"

export async function GET(request: NextRequest) {
  try {
    console.log("Yatırımlar getiriliyor...")
    const userId = getUserIdFromSession()

    if (!userId) {
      return NextResponse.json({ error: "Oturum bulunamadı" }, { status: 401 })
    }

    const investments = await sql`
      SELECT * FROM investments
      WHERE user_id = ${userId}::uuid
      ORDER BY purchase_date DESC
    `

    console.log(`${investments.length} yatırım bulundu`)

    return NextResponse.json({
      success: true,
      investments: investments,
    })
  } catch (error) {
    console.error("Yatırımlar getirilirken hata:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Yatırımlar getirilirken bir hata oluştu",
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

    const { name, type, amount, purchase_price, current_price, purchase_date, notes } = await request.json()

    if (!name || !type || !amount || !purchase_price) {
      return NextResponse.json({ error: "İsim, tür, miktar ve alış fiyatı gereklidir" }, { status: 400 })
    }

    // Yeni yatırım ekle
    const result = await sql`
      INSERT INTO investments (name, type, amount, purchase_price, current_price, purchase_date, notes, user_id) 
      VALUES (${name}, ${type}, ${amount}, ${purchase_price}, ${current_price || purchase_price}, ${purchase_date || new Date().toISOString()}, ${notes || ""}, ${userId}::uuid) 
      RETURNING *
    `

    return NextResponse.json({
      success: true,
      message: "Yatırım başarıyla eklendi",
      investment: result[0],
    })
  } catch (error) {
    console.error("Yatırım eklenirken hata:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Yatırım eklenirken bir hata oluştu",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
