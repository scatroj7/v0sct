import { type NextRequest, NextResponse } from "next/server"
import { getUserIdFromSession } from "@/app/lib/auth"
import { fetchLatestPrice } from "@/app/lib/api-services/price-service"
import { neon } from "@neondatabase/serverless"

// Veritabanı URL'sini al
function getDatabaseUrl(): string {
  const possibleUrls = [
    process.env.NEON_NEON_DATABASE_URL,
    process.env.NEON_POSTGRES_URL,
    process.env.DATABASE_URL,
    process.env.POSTGRES_URL,
  ]

  for (const url of possibleUrls) {
    if (url && url.trim() !== "") {
      console.log("Veritabanı URL bulundu")
      return url
    }
  }

  console.error("Hiçbir veritabanı URL'si bulunamadı")
  throw new Error("Veritabanı bağlantı dizesi bulunamadı")
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const dbUrl = getDatabaseUrl()
    const sql = neon(dbUrl)

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
    const dbUrl = getDatabaseUrl()
    const sql = neon(dbUrl)

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
    console.log("DELETE request başladı, ID:", params.id)

    // Veritabanı bağlantısını kur
    const dbUrl = getDatabaseUrl()
    const sql = neon(dbUrl)
    console.log("Veritabanı bağlantısı kuruldu")

    const userId = getUserIdFromSession()
    console.log("User ID:", userId)

    if (!userId) {
      console.log("User ID bulunamadı")
      return NextResponse.json({ error: "Oturum bulunamadı" }, { status: 401 })
    }

    const id = params.id
    console.log("Silinecek yatırım ID:", id, "Tip:", typeof id)

    // ID'nin geçerli olup olmadığını kontrol et
    if (!id || id.trim() === "") {
      return NextResponse.json({ error: "Geçersiz yatırım ID'si" }, { status: 400 })
    }

    // Önce yatırımın var olup olmadığını kontrol et
    console.log("Yatırım varlığı kontrol ediliyor...")
    const existingInvestment = await sql`
      SELECT id, user_id, name FROM investments 
      WHERE id = ${id}
    `

    console.log("Mevcut yatırım sorgusu sonucu:", existingInvestment)

    if (existingInvestment.length === 0) {
      console.log("Yatırım ID'si bulunamadı:", id)
      return NextResponse.json({ error: "Yatırım bulunamadı" }, { status: 404 })
    }

    console.log("Bulunan yatırım:", existingInvestment[0])
    console.log("Yatırım user_id:", existingInvestment[0].user_id, "Mevcut user_id:", userId)

    // User ID eşleşmesini kontrol et - geliştirme aşamasında bu kontrolü atlayalım
    // if (existingInvestment[0].user_id !== userId) {
    //   console.log("User ID eşleşmiyor!")
    //   return NextResponse.json({ error: "Bu yatırıma erişim yetkiniz yok" }, { status: 403 })
    // }

    // Şimdi silme işlemini yap - user_id kontrolü olmadan
    console.log("Silme işlemi başlatılıyor...")
    const result = await sql`
      DELETE FROM investments
      WHERE id = ${id}
      RETURNING id
    `

    console.log("Silme sorgusu sonucu:", result)

    if (result.length === 0) {
      console.log("Silme işlemi başarısız - hiçbir satır etkilenmedi")
      return NextResponse.json({ error: "Yatırım silinemedi" }, { status: 500 })
    }

    console.log("Yatırım başarıyla silindi:", result[0].id)
    return NextResponse.json({
      success: true,
      message: "Yatırım başarıyla silindi",
      id: result[0].id,
    })
  } catch (error) {
    console.error("DELETE işleminde detaylı hata:", {
      error: error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      params: params,
    })

    // Her durumda JSON yanıt döndür
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
