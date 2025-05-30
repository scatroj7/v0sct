import { type NextRequest, NextResponse } from "next/server"
import { getUserIdFromSession } from "@/app/lib/auth"
import { fetchLatestPrice } from "@/app/lib/api-services/price-service-real"
import { neon } from "@neondatabase/serverless"

// Veritabanı URL'sini al
function getDatabaseUrl(): string {
  const possibleUrls = [
    process.env.NEON_NEON_NEON_NEON_DATABASE_URL,
    process.env.NEON_POSTGRES_URL,
    process.env.DATABASE_URL,
    process.env.POSTGRES_URL,
  ]

  for (const url of possibleUrls) {
    if (url && url.trim() !== "") {
      console.log("✅ Veritabanı URL bulundu")
      return url
    }
  }

  console.error("❌ Hiçbir veritabanı URL'si bulunamadı")
  throw new Error("Veritabanı bağlantı dizesi bulunamadı")
}

export async function GET() {
  try {
    const dbUrl = getDatabaseUrl()
    const sql = neon(dbUrl)

    const userId = getUserIdFromSession()

    if (!userId) {
      return NextResponse.json({ error: "Oturum bulunamadı" }, { status: 401 })
    }

    const investments = await sql`
      SELECT * FROM investments
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `

    return NextResponse.json(investments)
  } catch (error) {
    console.error("❌ Yatırımlar getirilirken hata:", error)
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
    console.log("🚀 Yeni yatırım ekleme başladı")

    const dbUrl = getDatabaseUrl()
    const sql = neon(dbUrl)

    const userId = getUserIdFromSession()

    if (!userId) {
      console.log("❌ User ID bulunamadı")
      return NextResponse.json({ error: "Oturum bulunamadı" }, { status: 401 })
    }

    const { name, category, type, amount, purchase_price, symbol, purchase_date, notes, user_id } = await request.json()

    console.log("📋 Gelen veriler:", {
      name,
      category,
      type,
      amount,
      purchase_price,
      symbol,
      purchase_date,
      notes,
    })

    // Validation
    if (!name || !category || !type || !amount || !purchase_price) {
      console.log("❌ Eksik alanlar var")
      return NextResponse.json({ error: "İsim, kategori, tür, miktar ve alış fiyatı gereklidir" }, { status: 400 })
    }

    // Kategori bazında sembol veya tür kullan
    let symbolToUse = symbol || name

    // Altın ve döviz için tür değerini kullan
    if (category === "gold" || category === "forex") {
      symbolToUse = type
    }

    console.log(`🔍 Sembol belirlendi: ${symbolToUse}`)

    // Güncel fiyatı çek (alış fiyatından bağımsız)
    let current_price = null
    try {
      console.log(`💰 Güncel fiyat çekiliyor: ${category} - ${symbolToUse}`)
      const latestPrice = await fetchLatestPrice(category, symbolToUse)
      if (latestPrice && latestPrice.price && latestPrice.price > 0) {
        current_price = latestPrice.price
        console.log(`✅ Güncel fiyat bulundu: ${current_price} TL`)
      } else {
        console.log(`⚠️ Güncel fiyat çekilemedi, null olarak kaydedilecek`)
      }
    } catch (error) {
      console.error(`❌ ${name} için fiyat çekilirken hata:`, error)
      console.log(`⚠️ Hata nedeniyle güncel fiyat null olarak kaydedilecek`)
    }

    // Veritabanına kaydet
    console.log("💾 Veritabanına kaydediliyor...")
    console.log("📊 Kaydedilecek veriler:", {
      name,
      category,
      type,
      amount: Number(amount),
      purchase_price: Number(purchase_price),
      current_price: current_price,
      symbol: symbolToUse,
      purchase_date: purchase_date || new Date().toISOString(),
      notes: notes || null,
      user_id: userId,
    })

    const result = await sql`
      INSERT INTO investments (
        name, category, type, amount, purchase_price, current_price, 
        symbol, purchase_date, notes, user_id, created_at, updated_at
      )
      VALUES (
        ${name},
        ${category},
        ${type},
        ${Number(amount)},
        ${Number(purchase_price)},
        ${current_price},
        ${symbolToUse},
        ${purchase_date || new Date().toISOString()},
        ${notes || null},
        ${userId},
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      RETURNING *
    `

    console.log("✅ Yatırım başarıyla eklendi:", result[0])

    return NextResponse.json({
      success: true,
      message: "Yatırım başarıyla eklendi",
      investment: result[0],
    })
  } catch (error) {
    console.error("❌ Yatırım eklenirken detaylı hata:", {
      error: error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })

    return NextResponse.json(
      {
        success: false,
        message: "Yatırım eklenirken bir hata oluştu",
        error: error instanceof Error ? error.message : String(error),
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
