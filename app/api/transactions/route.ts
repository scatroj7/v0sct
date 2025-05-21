import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/app/lib/db-server"
import { getUserIdFromSession } from "@/app/lib/auth"
import { v4 as uuidv4 } from "uuid"

export async function GET(request: NextRequest) {
  try {
    console.log("İşlemler getiriliyor...")
    const userId = getUserIdFromSession()

    if (!userId) {
      console.log("Oturum bulunamadı, userId:", userId)
      return NextResponse.json({ success: false, message: "Oturum bulunamadı" }, { status: 401 })
    }

    console.log("Kullanıcı ID:", userId)

    // URL parametrelerini al
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const categoryId = searchParams.get("categoryId")
    const type = searchParams.get("type")
    const limit = searchParams.get("limit") ? Number.parseInt(searchParams.get("limit") as string) : 100

    console.log("Filtreler:", { startDate, endDate, categoryId, type, limit })

    // Farklı filtre kombinasyonları için ayrı sorgular
    let transactions

    try {
      // Hiçbir filtre yoksa
      transactions = await sql`
        SELECT t.*, c.name as category_name, c.color as category_color
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE t.user_id = ${userId}
        ORDER BY t.date DESC
        LIMIT ${limit}
      `
      console.log(`${transactions.length} işlem bulundu`)
    } catch (dbError) {
      console.error("Veritabanı sorgusu çalıştırılırken hata:", dbError)
      return NextResponse.json(
        {
          success: false,
          message: "Veritabanı sorgusu çalıştırılırken bir hata oluştu",
          error: dbError instanceof Error ? dbError.message : String(dbError),
        },
        { status: 500 },
      )
    }

    // Yanıt formatını summary-tab bileşeninin beklediği şekilde düzenle
    return NextResponse.json({
      success: true,
      transactions: transactions,
    })
  } catch (error) {
    console.error("İşlemler getirilirken hata:", error)
    return NextResponse.json(
      {
        success: false,
        message: "İşlemler getirilirken bir hata oluştu",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("Yeni işlem ekleniyor...")
    const userId = getUserIdFromSession()

    if (!userId) {
      console.log("Oturum bulunamadı, userId:", userId)
      return NextResponse.json({ success: false, message: "Oturum bulunamadı" }, { status: 401 })
    }

    // İstek gövdesini al
    const body = await request.json()
    console.log("İstek gövdesi:", body)

    // Gerekli alanları kontrol et
    if (!body.amount || !body.date || !body.type) {
      console.log("Eksik alanlar:", { amount: body.amount, date: body.date, type: body.type })
      return NextResponse.json({ success: false, message: "Tutar, tarih ve tür alanları zorunludur" }, { status: 400 })
    }

    // Sayısal değer kontrolü
    const amount = Number.parseFloat(body.amount)
    if (isNaN(amount)) {
      console.log("Geçersiz tutar:", body.amount)
      return NextResponse.json({ success: false, message: "Tutar geçerli bir sayı olmalıdır" }, { status: 400 })
    }

    try {
      // UUID oluştur
      const transactionId = uuidv4()
      console.log("Oluşturulan UUID:", transactionId)

      // Yeni işlem ekle - UUID ile
      console.log("SQL sorgusu çalıştırılıyor...")
      const result = await sql`
        INSERT INTO transactions (
          id,
          user_id, 
          amount, 
          date, 
          description, 
          category_id, 
          type
        ) 
        VALUES (
          ${transactionId},
          ${userId}, 
          ${amount}, 
          ${body.date}, 
          ${body.description || null}, 
          ${body.category_id || null}, 
          ${body.type}
        )
        RETURNING *
      `

      console.log("İşlem başarıyla eklendi:", result[0])

      // Kategori bilgisini getir
      let categoryName = null
      let categoryColor = null

      if (body.category_id) {
        const categoryResult = await sql`
          SELECT name, color FROM categories WHERE id = ${body.category_id}
        `
        if (categoryResult.length > 0) {
          categoryName = categoryResult[0].name
          categoryColor = categoryResult[0].color
        }
      }

      return NextResponse.json({
        success: true,
        message: "İşlem başarıyla eklendi",
        transaction: {
          ...result[0],
          category_name: categoryName,
          category_color: categoryColor,
        },
      })
    } catch (dbError) {
      console.error("Veritabanı sorgusu çalıştırılırken hata:", dbError)
      return NextResponse.json(
        {
          success: false,
          message: "Veritabanı sorgusu çalıştırılırken bir hata oluştu",
          error: dbError instanceof Error ? dbError.message : String(dbError),
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("İşlem eklenirken hata:", error)
    return NextResponse.json(
      {
        success: false,
        message: "İşlem eklenirken bir hata oluştu",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
