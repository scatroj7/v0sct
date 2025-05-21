import { NextResponse } from "next/server"
import { getUserIdFromSession } from "@/app/lib/auth"
import { getClient } from "@/app/lib/db-server"
import { v4 as uuidv4 } from "uuid"

export async function GET() {
  try {
    const userId = getUserIdFromSession()
    if (!userId) {
      return NextResponse.json({ success: false, message: "Oturum bulunamadı" }, { status: 401 })
    }

    console.log("Debug: Test işlemi ekleniyor, kullanıcı ID:", userId)

    // SQL client'ı al
    const client = getClient()

    // Önce kategorileri kontrol et
    const categoriesQuery = `SELECT COUNT(*) FROM categories`
    const categoriesCount = await client.query(categoriesQuery)

    if (Number(categoriesCount[0]?.count || 0) === 0) {
      // Kategoriler yoksa ekle
      const insertCategoriesQuery = `
        INSERT INTO categories (id, name, type) VALUES
        ('cat-1', 'Gıda', 'expense'),
        ('cat-9', 'Maaş', 'income')
        ON CONFLICT (id) DO NOTHING
        RETURNING id, name, type;
      `
      await client.query(insertCategoriesQuery)
    }

    // Test işlemi ekle - gelir
    const incomeId = uuidv4()
    const incomeQuery = `
      INSERT INTO transactions (
        id, user_id, category_id, amount, date, description, type, 
        installment_group, installment_number, total_installments, 
        frequency, created_at, updated_at
      ) VALUES (
        $1, $2, 'cat-9', 5000, CURRENT_DATE, 'Test Maaş', 'income',
        NULL, 1, 1, 'once', NOW(), NOW()
      )
      RETURNING id, amount, type, date, description;
    `
    const incomeResult = await client.query(incomeQuery, [incomeId, userId])

    // Test işlemi ekle - gider
    const expenseId = uuidv4()
    const expenseQuery = `
      INSERT INTO transactions (
        id, user_id, category_id, amount, date, description, type, 
        installment_group, installment_number, total_installments, 
        frequency, created_at, updated_at
      ) VALUES (
        $1, $2, 'cat-1', 150, CURRENT_DATE, 'Test Market Alışverişi', 'expense',
        NULL, 1, 1, 'once', NOW(), NOW()
      )
      RETURNING id, amount, type, date, description;
    `
    const expenseResult = await client.query(expenseQuery, [expenseId, userId])

    return NextResponse.json({
      success: true,
      message: "Test işlemleri başarıyla eklendi",
      income: incomeResult[0],
      expense: expenseResult[0],
    })
  } catch (error: any) {
    console.error("Debug: Test işlemi eklenirken hata:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Test işlemi eklenirken bir hata oluştu",
        error: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}
