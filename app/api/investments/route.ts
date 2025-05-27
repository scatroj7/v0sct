import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/app/lib/db-server"

export async function GET(request: NextRequest) {
  try {
    console.log("🔄 Investments API çağrıldı")

    const url = new URL(request.url)
    const isAdmin = url.searchParams.get("admin") === "true"

    let investments
    if (isAdmin) {
      console.log("👑 Admin kullanıcısı - tüm investments alınıyor")
      investments = await sql`
        SELECT 
          id,
          symbol,
          name,
          amount,
          purchase_price,
          current_price,
          user_id,
          created_at,
          updated_at
        FROM investments 
        ORDER BY created_at DESC
      `
    } else {
      investments = await sql`
        SELECT 
          id,
          symbol,
          name,
          amount,
          purchase_price,
          current_price,
          user_id,
          created_at,
          updated_at
        FROM investments 
        ORDER BY created_at DESC
      `
    }

    console.log("✅ Investments alındı:", investments.length)
    return NextResponse.json(investments)
  } catch (error) {
    console.error("❌ Investments API error:", error)
    return NextResponse.json({ error: "Failed to fetch investments", details: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("➕ Yeni investment ekleniyor:", body)

    const { symbol, name, amount, purchase_price, current_price, user_id } = body

    const result = await sql`
      INSERT INTO investments (symbol, name, amount, purchase_price, current_price, user_id, created_at, updated_at)
      VALUES (${symbol}, ${name}, ${amount}, ${purchase_price}, ${current_price}, ${user_id}, NOW(), NOW())
      RETURNING *
    `

    console.log("✅ Investment eklendi:", result[0])
    return NextResponse.json(result[0])
  } catch (error) {
    console.error("❌ Investment add error:", error)
    return NextResponse.json({ error: "Failed to add investment", details: error.message }, { status: 500 })
  }
}
