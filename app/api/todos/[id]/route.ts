import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/app/lib/db-server"
import { getUserIdFromSession } from "@/app/lib/auth"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = getUserIdFromSession()

    if (!userId) {
      return NextResponse.json({ error: "Oturum bulunamadı" }, { status: 401 })
    }

    const id = params.id

    // Yapılacağı getir
    const todo = await sql`
      SELECT * FROM todos 
      WHERE id = ${id} AND user_id = ${userId}
    `

    if (todo.length === 0) {
      return NextResponse.json({ error: "Yapılacak bulunamadı" }, { status: 404 })
    }

    return NextResponse.json(todo[0])
  } catch (error) {
    console.error("Yapılacak getirilirken hata:", error)
    return NextResponse.json({ error: "Yapılacak getirilirken bir hata oluştu" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = getUserIdFromSession()

    if (!userId) {
      return NextResponse.json({ error: "Oturum bulunamadı" }, { status: 401 })
    }

    const id = params.id
    const { title, description, due_date, priority, completed } = await request.json()

    if (!title) {
      return NextResponse.json({ error: "Başlık gereklidir" }, { status: 400 })
    }

    console.log("PUT /api/todos/[id] - Request body:", { title, description, due_date, priority, completed })
    console.log("PUT /api/todos/[id] - ID:", id, "Type:", typeof id)
    console.log("PUT /api/todos/[id] - User ID:", userId, "Type:", typeof userId)

    // Önce todos tablosunda priority sütununun olup olmadığını kontrol et
    let hasPriorityColumn = false
    try {
      const checkResult = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'todos' AND column_name = 'priority'
      `
      hasPriorityColumn = checkResult.length > 0
      console.log("PUT /api/todos/[id] - Has priority column:", hasPriorityColumn)
    } catch (error) {
      console.error("Priority sütunu kontrol edilirken hata:", error)
    }

    // Yapılacağı güncelle
    let result
    if (hasPriorityColumn) {
      result = await sql`
        UPDATE todos 
        SET title = ${title}, 
            description = ${description || ""}, 
            due_date = ${due_date || null}, 
            priority = ${priority || "normal"}, 
            completed = ${completed === true}
        WHERE id = ${id} AND user_id = ${userId}
        RETURNING *
      `
    } else {
      result = await sql`
        UPDATE todos 
        SET title = ${title}, 
            description = ${description || ""}, 
            due_date = ${due_date || null}, 
            completed = ${completed === true}
        WHERE id = ${id} AND user_id = ${userId}
        RETURNING *
      `
    }

    console.log("PUT /api/todos/[id] - Update result:", result)

    if (result.length === 0) {
      return NextResponse.json({ error: "Yapılacak bulunamadı veya güncellenemedi" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Yapılacak güncellenirken hata:", error)
    return NextResponse.json({ error: `Yapılacak güncellenirken bir hata oluştu: ${error}` }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = getUserIdFromSession()

    if (!userId) {
      return NextResponse.json({ error: "Oturum bulunamadı" }, { status: 401 })
    }

    const id = params.id

    console.log("DELETE /api/todos/[id] - ID:", id, "Type:", typeof id)
    console.log("DELETE /api/todos/[id] - User ID:", userId, "Type:", typeof userId)

    // Yapılacağı sil
    const result = await sql`
      DELETE FROM todos 
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING id
    `

    console.log("DELETE /api/todos/[id] - Delete result:", result)

    if (result.length === 0) {
      return NextResponse.json({ error: "Yapılacak bulunamadı veya silinemedi" }, { status: 404 })
    }

    return NextResponse.json({ id: result[0].id })
  } catch (error) {
    console.error("Yapılacak silinirken hata:", error)
    return NextResponse.json({ error: `Yapılacak silinirken bir hata oluştu: ${error}` }, { status: 500 })
  }
}
