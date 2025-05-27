import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/app/lib/db-server"

export async function GET(request: NextRequest) {
  try {
    console.log("🔄 Transactions API çağrıldı")

    // Admin kontrolü - eğer admin ise tüm verileri göster
    const url = new URL(request.url)
    const isAdmin = url.searchParams.get("admin") === "true"

    let transactions
    if (isAdmin) {
      console.log("👑 Admin kullanıcısı - tüm transactions alınıyor")
      transactions = await sql`
        SELECT 
          t.id,
          t.description,
          t.amount,
          t.category_id,
          c.name as category_name,
          c.color as category_color,
          t.date,
          t.type,
          t.user_id,
          t.created_at
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        ORDER BY t.date DESC, t.created_at DESC
      `
    } else {
      console.log("👤 Normal kullanıcı - user_id filtrelemesi yapılıyor")
      transactions = await sql`
        SELECT 
          t.id,
          t.description,
          t.amount,
          t.category_id,
          c.name as category_name,
          c.color as category_color,
          t.date,
          t.type,
          t.user_id,
          t.created_at
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        ORDER BY t.date DESC, t.created_at DESC
      `
    }

    console.log("✅ Transactions alındı:", transactions.length)
    console.log("📋 İlk 3 transaction:", transactions.slice(0, 3))

    // Summary-tab bileşeninin beklediği format
    return NextResponse.json({
      success: true,
      transactions: transactions,
    })
  } catch (error) {
    console.error("❌ Transactions API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch transactions",
        message: error.message,
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("➕ Yeni transaction ekleniyor:", body)

    const { description, amount, category_id, date, type, user_id } = body

    const result = await sql`
      INSERT INTO transactions (description, amount, category_id, date, type, user_id, created_at)
      VALUES (${description}, ${amount}, ${category_id}, ${date}, ${type}, ${user_id}, NOW())
      RETURNING *
    `

    console.log("✅ Transaction eklendi:", result[0])
    return NextResponse.json({
      success: true,
      transaction: result[0],
    })
  } catch (error) {
    console.error("❌ Transaction add error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to add transaction",
        message: error.message,
      },
      { status: 500 },
    )
  }
}
