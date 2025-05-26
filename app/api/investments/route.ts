import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { fetchLatestPrice } from "@/app/lib/api-services/price-service-v2"

// Veritabanı URL'sini al
const getDatabaseUrl = () => {
  const dbUrl =
    process.env.POSTGRES_URL ||
    process.env.NEON_NEON_NEON_DATABASE_URL ||
    process.env.DATABASE_URL ||
    process.env.NEON_POSTGRES_URL ||
    process.env.NEON_DATABASE_URL

  if (!dbUrl) {
    if (process.env.NODE_ENV !== "production") {
      return "postgres://test:test@localhost:5432/test"
    }
    throw new Error("Veritabanı URL'si bulunamadı!")
  }
  return dbUrl
}

// Veritabanı bağlantısı
const sql = neon(getDatabaseUrl())

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
          if (currentPrice !== null) {
            await sql`
              UPDATE investments
              SET 
                current_price = ${currentPrice},
                last_updated = NOW()
              WHERE id = ${investment.id}
            `
          }

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

    // Veri doğrulama
    if (!name || !category || !type || !amount || !purchase_price || !purchase_date) {
      return NextResponse.json({ error: "Gerekli alanlar eksik" }, { status: 400 })
    }

    // Kullanıcı ID'sini al (gerçek uygulamada oturum yönetiminden gelecek)
    const userId = "user123" // Örnek kullanıcı ID'si

    // Güncel fiyatı çek
    let currentPrice = null
    try {
      const priceData = await fetchLatestPrice(category, symbol || type)
      currentPrice = priceData?.price || null
    } catch (error) {
      console.warn("Güncel fiyat alınamadı:", error)
    }

    // Yeni yatırımı veritabanına ekle (id'yi belirtmiyoruz, SERIAL otomatik oluşturacak)
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
        ${Number(amount)}, 
        ${Number(purchase_price)}, 
        ${currentPrice},
        ${symbol || null}, 
        ${purchase_date}, 
        ${notes || null}, 
        ${userId},
        NOW()
      )
      RETURNING *
    `

    if (result.length === 0) {
      throw new Error("Yatırım eklenemedi")
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Yatırım eklenirken hata:", error)
    return NextResponse.json(
      {
        error: "Yatırım eklenirken bir hata oluştu",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
