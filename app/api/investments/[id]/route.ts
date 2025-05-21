import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/app/lib/db-server"
import { getUserIdFromSession } from "@/app/lib/auth"
import { fetchLatestPrice } from "@/app/lib/api-services/price-service"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = getUserIdFromSession()

    if (!userId) {
      return NextResponse.json({ error: "Oturum bulunamadı" }, { status: 401 })
    }

    const id = params.id

    const investment = await sql`
      SELECT * FROM investments
      WHERE id = ${id} AND user_id = ${userId}
    `

    if (investment.length === 0) {
      return NextResponse.json({ error: "Yatırım bulunamadı" }, { status: 404 })
    }

    // Güncel fiyatı çek
    try {
      // Kategori bazında sembol veya tür kullan
      let symbolToUse = investment[0].symbol || investment[0].name

      // Altın ve döviz için tür değerini kullan
      if (investment[0].category === "gold" || investment[0].category === "forex") {
        symbolToUse = investment[0].type
      }

      const latestPrice = await fetchLatestPrice(investment[0].category, symbolToUse)

      if (latestPrice && latestPrice.price) {
        // Veritabanını güncelle
        await sql`
          UPDATE investments 
          SET current_price = ${latestPrice.price}, last_updated = CURRENT_TIMESTAMP 
          WHERE id = ${id}
        `

        investment[0].current_price = latestPrice.price
        investment[0].last_updated = new Date().toISOString()
      }
    } catch (error) {
      console.error(`Fiyat güncellenirken hata:`, error)
    }

    // Kar/zarar hesapla
    if (investment[0].current_price && investment[0].purchase_price) {
      const totalInvestment = Number(investment[0].amount) * Number(investment[0].purchase_price)
      const currentValue = Number(investment[0].amount) * Number(investment[0].current_price)
      const profit = currentValue - totalInvestment
      const profitPercentage = (profit / totalInvestment) * 100

      investment[0].current_value = currentValue
      investment[0].profit = profit
      investment[0].profit_percentage = profitPercentage
    }

    return NextResponse.json(investment[0])
  } catch (error) {
    console.error("Yatırım getirilirken hata:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Yatırım getirilirken bir hata oluştu",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = getUserIdFromSession()

    if (!userId) {
      return NextResponse.json({ error: "Oturum bulunamadı" }, { status: 401 })
    }

    const id = params.id
    const { name, category, type, amount, purchase_price, symbol, purchase_date, notes } = await request.json()

    if (!name || !category || !type || !amount || !purchase_price) {
      return NextResponse.json({ error: "İsim, kategori, tür, miktar ve alış fiyatı gereklidir" }, { status: 400 })
    }

    // Kategori bazında sembol veya tür kullan
    let symbolToUse = symbol || name

    // Altın ve döviz için tür değerini kullan
    if (category === "gold" || category === "forex") {
      symbolToUse = type
    }

    // Güncel fiyatı çek
    let current_price = purchase_price
    try {
      const latestPrice = await fetchLatestPrice(category, symbolToUse)
      if (latestPrice && latestPrice.price) {
        current_price = latestPrice.price
      }
    } catch (error) {
      console.error(`${name} için fiyat çekilirken hata:`, error)
    }

    const result = await sql`
      UPDATE investments
      SET 
        name = ${name},
        category = ${category},
        type = ${type},
        amount = ${amount},
        purchase_price = ${purchase_price},
        current_price = ${current_price},
        symbol = ${symbolToUse || null},
        purchase_date = ${purchase_date || new Date().toISOString()},
        notes = ${notes || null},
        last_updated = CURRENT_TIMESTAMP
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Yatırım bulunamadı veya güncellenemedi" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Yatırım başarıyla güncellendi",
      investment: result[0],
    })
  } catch (error) {
    console.error("Yatırım güncellenirken hata:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Yatırım güncellenirken bir hata oluştu",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = getUserIdFromSession()

    if (!userId) {
      return NextResponse.json({ error: "Oturum bulunamadı" }, { status: 401 })
    }

    const id = params.id

    const result = await sql`
      DELETE FROM investments
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING id
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Yatırım bulunamadı veya silinemedi" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Yatırım başarıyla silindi",
      id: result[0].id,
    })
  } catch (error) {
    console.error("Yatırım silinirken hata:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Yatırım silinirken bir hata oluştu",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
