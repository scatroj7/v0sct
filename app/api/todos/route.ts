import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/app/lib/db-server"

export async function GET(request: NextRequest) {
  try {
    console.log("🔄 Todos API çağrıldı")

    const url = new URL(request.url)
    const isAdmin = url.searchParams.get("admin") === "true"

    let todos
    if (isAdmin) {
      console.log("👑 Admin kullanıcısı - tüm todos alınıyor")
      todos = await sql`
        SELECT 
          id,
          title,
          description,
          completed,
          priority,
          due_date,
          user_id,
          created_at,
          updated_at
        FROM todos 
        ORDER BY created_at DESC
      `
    } else {
      todos = await sql`
        SELECT 
          id,
          title,
          description,
          completed,
          priority,
          due_date,
          user_id,
          created_at,
          updated_at
        FROM todos 
        ORDER BY created_at DESC
      `
    }

    console.log("✅ Todos alındı:", todos.length)
    return NextResponse.json(todos)
  } catch (error) {
    console.error("❌ Todos API error:", error)
    return NextResponse.json({ error: "Failed to fetch todos", details: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("➕ Yeni todo ekleniyor:", body)

    const { title, description, completed, priority, due_date, user_id } = body

    const result = await sql`
      INSERT INTO todos (title, description, completed, priority, due_date, user_id, created_at, updated_at)
      VALUES (${title}, ${description}, ${completed || false}, ${priority || "medium"}, ${due_date}, ${user_id}, NOW(), NOW())
      RETURNING *
    `

    console.log("✅ Todo eklendi:", result[0])
    return NextResponse.json(result[0])
  } catch (error) {
    console.error("❌ Todo add error:", error)
    return NextResponse.json({ error: "Failed to add todo", details: error.message }, { status: 500 })
  }
}
