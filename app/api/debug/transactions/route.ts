import { NextResponse } from "next/server"
import { getUserIdFromSession } from "@/app/lib/auth"
import { getClient } from "@/app/lib/db-server"

export async function GET() {
  try {
    const userId = getUserIdFromSession()
    if (!userId) {
      return NextResponse.json({ success: false, message: "Oturum bulunamadı" }, { status: 401 })
    }

    console.log("Debug: İşlemler getiriliyor, kullanıcı ID:", userId)

    // SQL client'ı al
    const client = getClient()

    // 1. Veritabanı bağlantı bilgilerini kontrol et
    const dbInfo = {
      hasPostgresUrl: !!process.env.POSTGRES_URL,
      hasNeonDatabaseUrl: !!process.env.NEON_NEON_NEON_NEON_NEON_NEON_DATABASE_URL,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasNeonPostgresUrl: !!process.env.NEON_POSTGRES_URL,
      region: process.env.VERCEL_REGION || "unknown",
    }

    // 2. Önce tabloların varlığını kontrol et
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_name IN ('transactions', 'categories')
    `
    const tables = await client.query(tablesQuery)
    const tableNames = tables.map((t: any) => t.table_name)

    console.log("Debug: Mevcut tablolar:", tableNames)

    // Tablolar yoksa uyarı ver
    if (!tableNames.includes("transactions")) {
      return NextResponse.json(
        {
          success: false,
          message: "Transactions tablosu bulunamadı",
          dbInfo,
          tables: tableNames,
        },
        { status: 404 },
      )
    }

    // 3. Tablo yapısını kontrol et
    const tableStructureQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'transactions'
      ORDER BY ordinal_position;
    `
    const tableStructure = await client.query(tableStructureQuery)
    console.log("Debug: Transactions tablosu yapısı:", tableStructure)

    // 4. Ham veritabanı sorgusu - Tüm işlemleri getir - userId'yi TEXT olarak dönüştür
    const rawQuery = `
      SELECT * FROM transactions 
      WHERE user_id = $1::TEXT
      ORDER BY date DESC
    `

    const rawTransactions = await client.query(rawQuery, [userId])
    console.log(`Debug: ${rawTransactions.length} ham işlem bulundu`)

    // 5. Kategorileri getir
    let categories = []
    if (tableNames.includes("categories")) {
      const categoriesQuery = `SELECT * FROM categories`
      categories = await client.query(categoriesQuery)
      console.log(`Debug: ${categories.length} kategori bulundu`)
    }

    // 6. JavaScript'te işlemleri ve kategorileri birleştir
    const transactionsWithCategories = rawTransactions.map((transaction) => {
      // İşlemin kategori ID'sine göre kategoriyi bul
      const category = categories.find((c) => c.id === transaction.category_id)

      return {
        ...transaction,
        category_name: category ? category.name : "Bilinmeyen",
        category_type: category ? category.type : transaction.type,
      }
    })

    // 7. Uygulama tarafından kullanılan formata dönüştür
    const formattedTransactions = transactionsWithCategories.map((transaction) => ({
      id: transaction.id,
      user_id: transaction.user_id,
      description: transaction.description || "",
      amount: Number(transaction.amount),
      type: transaction.type,
      category: transaction.category_id, // Kategori ID'si
      categoryName: transaction.category_name, // Kategori adı
      date: transaction.date,
      installment_group: transaction.installment_group,
      installment_number: transaction.installment_number,
      total_installments: transaction.total_installments,
      frequency: transaction.frequency || "once",
      created_at: transaction.created_at,
      updated_at: transaction.updated_at,
      parent_transaction_id: transaction.parent_transaction_id,
    }))

    return NextResponse.json({
      success: true,
      dbInfo,
      tables: tableNames,
      tableStructure,
      rawTransactions,
      categories,
      transactionsWithCategories,
      formattedTransactions,
    })
  } catch (error: any) {
    console.error("Debug: İşlemler getirilirken hata:", error)
    return NextResponse.json(
      {
        success: false,
        message: "İşlemler getirilirken bir hata oluştu",
        error: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}
