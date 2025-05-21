import { NextResponse } from "next/server"
import { getClient } from "@/app/lib/db-server"

export async function GET() {
  try {
    console.log("Veritabanı şeması kontrol ediliyor ve düzeltiliyor...")

    // SQL client'ı al
    const client = getClient()

    // Transactions tablosunun yapısını kontrol et
    const tableStructureQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'transactions';
    `
    const tableStructure = await client.query(tableStructureQuery)
    console.log("Transactions tablosu yapısı:", tableStructure)

    // Kategori ID'sinin tipini kontrol et
    const categoryIdColumn = tableStructure.find((col: any) => col.column_name === "category_id")
    console.log("category_id sütun tipi:", categoryIdColumn?.data_type)

    // Eğer category_id sütunu UUID tipindeyse, TEXT tipine dönüştür
    if (categoryIdColumn?.data_type === "uuid") {
      console.log("category_id sütunu UUID tipinde, TEXT tipine dönüştürülüyor...")

      try {
        // Önce mevcut verileri yedekle
        const backupQuery = `
          CREATE TEMPORARY TABLE transactions_backup AS
          SELECT * FROM transactions;
        `
        await client.query(backupQuery)
        console.log("Mevcut veriler yedeklendi")

        // Sütun tipini değiştir
        const alterQuery = `
          ALTER TABLE transactions 
          ALTER COLUMN category_id TYPE TEXT;
        `
        await client.query(alterQuery)
        console.log("category_id sütunu başarıyla TEXT tipine dönüştürüldü")
      } catch (alterError) {
        console.error("Sütun tipi değiştirilirken hata:", alterError)
        return NextResponse.json(
          {
            success: false,
            message: "Sütun tipi değiştirilirken hata oluştu",
            error: alterError instanceof Error ? alterError.message : String(alterError),
          },
          { status: 500 },
        )
      }
    } else {
      console.log("category_id sütunu zaten TEXT tipinde veya başka bir tipte")
    }

    // Mevcut kategorileri kontrol et
    const categoriesQuery = `SELECT id, name, type FROM categories LIMIT 10;`
    const categories = await client.query(categoriesQuery)

    // Mevcut işlemleri kontrol et
    const transactionsQuery = `SELECT id, category_id FROM transactions LIMIT 10;`
    const transactions = await client.query(transactionsQuery)

    return NextResponse.json({
      success: true,
      message: "Veritabanı şeması kontrol edildi ve düzeltildi",
      tableStructure: tableStructure.map((col: any) => ({
        column_name: col.column_name,
        data_type: col.data_type,
      })),
      categoryIdType: categoryIdColumn?.data_type,
      categories: categories,
      transactions: transactions,
    })
  } catch (error: any) {
    console.error("Veritabanı şeması kontrol edilirken hata:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Veritabanı şeması kontrol edilirken bir hata oluştu",
        error: error.message,
      },
      { status: 500 },
    )
  }
}
