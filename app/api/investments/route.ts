import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { fetchLatestPrice } from "@/app/lib/api-services/price-service-v2"

// Veritabanı bağlantısı
const sql = neon(process.env.NEON_NEON_DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    // Kullanıcı ID'sini al (gerçek uygulamada oturum yönetiminden gelecek)
    const userId = "user123" // Örnek kullanıcı ID'si

    // Yatırımları veritabanından çek
    const investments = await sql`
      SELECT * FROM investments
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `

    // Her yatırım için güncel fiyatları çek
    const investmentsWithPrices = await Promise.all(
      investments.map(async (investment) => {
        try {
          // Güncel fiyatı çek
          const priceData = await fetchLatestPrice(investment.category, investment.symbol || investment.type)
          const currentPrice = priceData?.price || null

          // Güncel değer ve kar/zarar hesapla
          let currentValue = null
          let profit = null
          let profitPercentage = null

          if (currentPrice !== null) {
            currentValue = investment.amount * currentPrice
            const investmentValue = investment.amount * investment.purchase_price
            profit = currentValue - investmentValue
            profitPercentage = investmentValue > 0 ? (profit / investmentValue) * 100 : 0
          }

          // Güncel fiyat bilgisini veritabanında güncelle
          await sql`
            UPDATE investments
            SET 
              current_price = ${currentPrice},
              last_updated = NOW()
            WHERE id = ${investment.id}
          `

          return {
            ...investment,
            current_price: currentPrice,
            current_value: currentValue,
            profit,
            profit_percentage: profitPercentage,
          }
        } catch (error) {
          console.error(`Yatırım fiyatı güncellenirken hata: ${error}`)
          return investment
        }
      }),
    )

    return NextResponse.json(investmentsWithPrices)
  } catch (error) {
    console.error("Yatırımlar yüklenirken hata:", error)
    return NextResponse.json({ error: "Yatırımlar yüklenirken bir hata oluştu" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, category, type, amount, purchase_price, symbol, purchase_date, notes } = body

    // Kullanıcı ID'sini al (gerçek uygulamada oturum yönetiminden gelecek)
    const userId = "user123" // Örnek kullanıcı ID'si

    // Güncel fiyatı çek
    const priceData = await fetchLatestPrice(category, symbol || type)
    const currentPrice = priceData?.price || null

    // Yeni yatırımı veritabanına ekle
    const result = await sql`
      INSERT INTO investments (
        name, 
        category, 
        type, 
        amount, 
        purchase_price, 
        current_price,
        symbol, 
        purchase_date, 
        notes, 
        user_id,
        last_updated
      )
      VALUES (
        ${name}, 
        ${category}, 
        ${type}, 
        ${amount}, 
        ${purchase_price}, 
        ${currentPrice},
        ${symbol || null}, 
        ${purchase_date}, 
        ${notes}, 
        ${userId},
        NOW()
      )
      RETURNING *
    `

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Yatırım eklenirken hata:", error)
    return NextResponse.json({ error: "Yatırım eklenirken bir hata oluştu" }, { status: 500 })
  }
}
