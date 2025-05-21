import { NextResponse } from "next/server"
import { getUserIdFromSession } from "@/app/lib/auth"
import { getClient } from "@/app/lib/db-server"

export async function POST(request: Request) {
  try {
    console.log("Debug: İşlem güncelleme testi başlatılıyor...")
    const userId = getUserIdFromSession()
    if (!userId) {
      return NextResponse.json({ success: false, message: "Oturum bulunamadı" }, { status: 401 })
    }

    // İstek gövdesini al
    let requestData
    try {
      requestData = await request.json()
      console.log("Debug: Gelen veriler:", requestData)
    } catch (parseError) {
      console.error("Debug: İstek gövdesi parse edilirken hata:", parseError)
      return NextResponse.json({ success: false, message: "Geçersiz istek formatı" }, { status: 400 })
    }

    const { transactionId, type, categoryId, amount, date, description } = requestData

    if (!transactionId) {
      return NextResponse.json({ success: false, message: "İşlem ID'si gereklidir" }, { status: 400 })
    }

    // SQL client'ı al
    const client = getClient()

    // Veritabanı tablolarının yapısını kontrol et
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `
    const tables = await client.query(tablesQuery)
    const tableNames = tables.map((t: any) => t.table_name)

    // Transactions tablosunun yapısını kontrol et
    const transactionsStructureQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'transactions'
      ORDER BY ordinal_position;
    `
    const transactionsStructure = await client.query(transactionsStructureQuery)

    // Categories tablosunun yapısını kontrol et
    const categoriesStructureQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'categories'
      ORDER BY ordinal_position;
    `
    const categoriesStructure = await client.query(categoriesStructureQuery)

    // İşlemi kontrol et
    const checkQuery = `
      SELECT * FROM transactions 
      WHERE id = $1
    `
    const checkResult = await client.query(checkQuery, [transactionId])

    if (checkResult.length === 0) {
      return NextResponse.json({ success: false, message: "İşlem bulunamadı" }, { status: 404 })
    }

    const transaction = checkResult[0]
    console.log("Debug: Mevcut işlem:", transaction)

    // Kategoriyi kontrol et
    const categoryQuery = `
      SELECT * FROM categories 
      WHERE id = $1
    `
    const categoryResult = await client.query(categoryQuery, [categoryId])
    const category = categoryResult.length > 0 ? categoryResult[0] : null
    console.log("Debug: Seçilen kategori:", category)

    // Güncelleme işlemini test et - kategori ID'sini hariç tut
    try {
      console.log("Debug: Temel alanları güncelleme testi...")
      const updateBasicQuery = `
        UPDATE transactions 
        SET 
          type = $1, 
          amount = $2, 
          date = $3, 
          description = $4,
          updated_at = NOW()
        WHERE id = $5
        RETURNING id, type, amount, date, description
      `
      const basicResult = await client.query(updateBasicQuery, [type, amount, date, description, transactionId])
      console.log("Debug: Temel alanlar güncellendi:", basicResult[0])
    } catch (basicError) {
      console.error("Debug: Temel alanları güncellerken hata:", basicError)
      return NextResponse.json(
        {
          success: false,
          message: "Temel alanları güncellerken hata oluştu",
          error: basicError instanceof Error ? basicError.message : String(basicError),
          tables: tableNames,
          transactionsStructure,
          categoriesStructure,
          transaction,
          category,
        },
        { status: 500 },
      )
    }

    // Kategori ID'sini güncelleme testi - farklı yöntemler dene
    const updateResults = []

    // 1. Yöntem: Doğrudan güncelleme
    try {
      console.log("Debug: Yöntem 1 - Doğrudan güncelleme testi...")
      const updateQuery1 = `
        UPDATE transactions 
        SET category_id = $1
        WHERE id = $2
        RETURNING id, category_id
      `
      const result1 = await client.query(updateQuery1, [categoryId, transactionId])
      updateResults.push({ method: "direct", success: true, result: result1[0] })
    } catch (error1) {
      console.error("Debug: Yöntem 1 hatası:", error1)
      updateResults.push({
        method: "direct",
        success: false,
        error: error1 instanceof Error ? error1.message : String(error1),
      })
    }

    // 2. Yöntem: NULL olarak ayarla, sonra güncelle
    try {
      console.log("Debug: Yöntem 2 - NULL olarak ayarla, sonra güncelle testi...")
      // Önce NULL olarak ayarla
      await client.query(`UPDATE transactions SET category_id = NULL WHERE id = $1`, [transactionId])

      // Sonra güncelle
      const updateQuery2 = `
        UPDATE transactions 
        SET category_id = $1
        WHERE id = $2
        RETURNING id, category_id
      `
      const result2 = await client.query(updateQuery2, [categoryId, transactionId])
      updateResults.push({ method: "null-then-update", success: true, result: result2[0] })
    } catch (error2) {
      console.error("Debug: Yöntem 2 hatası:", error2)
      updateResults.push({
        method: "null-then-update",
        success: false,
        error: error2 instanceof Error ? error2.message : String(error2),
      })
    }

    // 3. Yöntem: Raw SQL
    try {
      console.log("Debug: Yöntem 3 - Raw SQL testi...")
      const rawQuery = `
        UPDATE transactions 
        SET category_id = '${categoryId}'
        WHERE id = '${transactionId}'
        RETURNING id, category_id
      `
      const result3 = await client.query(rawQuery)
      updateResults.push({ method: "raw-sql", success: true, result: result3[0] })
    } catch (error3) {
      console.error("Debug: Yöntem 3 hatası:", error3)
      updateResults.push({
        method: "raw-sql",
        success: false,
        error: error3 instanceof Error ? error3.message : String(error3),
      })
    }

    // 4. Yöntem: TEXT olarak dönüştür
    try {
      console.log("Debug: Yöntem 4 - TEXT olarak dönüştür testi...")
      const updateQuery4 = `
        UPDATE transactions 
        SET category_id = $1::TEXT
        WHERE id = $2
        RETURNING id, category_id
      `
      const result4 = await client.query(updateQuery4, [categoryId, transactionId])
      updateResults.push({ method: "text-cast", success: true, result: result4[0] })
    } catch (error4) {
      console.error("Debug: Yöntem 4 hatası:", error4)
      updateResults.push({
        method: "text-cast",
        success: false,
        error: error4 instanceof Error ? error4.message : String(error4),
      })
    }

    // Güncellenmiş işlemi getir
    const getUpdatedQuery = `
      SELECT * FROM transactions WHERE id = $1
    `
    const updatedTransaction = await client.query(getUpdatedQuery, [transactionId])

    return NextResponse.json({
      success: true,
      message: "İşlem güncelleme testi tamamlandı",
      tables: tableNames,
      transactionsStructure,
      categoriesStructure,
      originalTransaction: transaction,
      category,
      updateResults,
      updatedTransaction: updatedTransaction[0],
    })
  } catch (error: any) {
    console.error("Debug: İşlem güncelleme testi sırasında genel hata:", error)
    return NextResponse.json(
      {
        success: false,
        message: "İşlem güncelleme testi sırasında bir hata oluştu",
        error: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}
