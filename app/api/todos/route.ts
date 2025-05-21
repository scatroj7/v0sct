import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/app/lib/db-server"
import { getUserIdFromSession } from "@/app/lib/auth"

export async function GET(request: NextRequest) {
  try {
    console.log("Yapılacaklar getiriliyor...")
    const userId = getUserIdFromSession()

    if (!userId) {
      return NextResponse.json({ error: "Oturum bulunamadı" }, { status: 401 })
    }

    const todos = await sql`
      SELECT * FROM todos
      WHERE user_id = ${userId}::uuid
      ORDER BY due_date ASC, priority DESC
    `

    console.log(`${todos.length} yapılacak bulundu`)

    return NextResponse.json({
      success: true,
      todos: todos,
    })
  } catch (error) {
    console.error("Yapılacaklar getirilirken hata:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Yapılacaklar getirilirken bir hata oluştu",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromSession()

    if (!userId) {
      return NextResponse.json({ error: "Oturum bulunamadı" }, { status: 401 })
    }

    const { title, description, due_date, priority, is_completed } = await request.json()

    if (!title) {
      return NextResponse.json({ error: "Başlık gereklidir" }, { status: 400 })
    }

    // Yeni yapılacak ekle
    const result = await sql`
      INSERT INTO todos (title, description, due_date, priority, is_completed, user_id) 
      VALUES (${title}, ${description || ""}, ${due_date || null}, ${priority || 1}, ${is_completed || false}, ${userId}::uuid) 
      RETURNING *
    `

    return NextResponse.json({
      success: true,
      message: "Yapılacak başarıyla eklendi",
      todo: result[0],
    })
  } catch (error) {
    console.error("Yapılacak eklenirken hata:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Yapılacak eklenirken bir hata oluştu",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
