import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/app/lib/db-server"
import { getUserIdFromSession } from "@/app/lib/auth"
import { v4 as uuidv4 } from "uuid"

export async function GET(request: NextRequest) {
  try {
    console.log("Yapılacaklar getiriliyor...")
    const userId = getUserIdFromSession()

    if (!userId) {
      return NextResponse.json({ error: "Oturum bulunamadı" }, { status: 401 })
    }

    console.log("User ID:", userId, "Type:", typeof userId)

    // Todos tablosunun yapısını kontrol et
    const tableInfo = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'todos'
    `
    console.log(
      "Todos tablosu sütunları:",
      tableInfo.map((col) => col.column_name),
    )

    // Priority sütunu var mı kontrol et
    const hasPriority = tableInfo.some((col) => col.column_name === "priority")
    // is_completed sütunu var mı kontrol et
    const hasIsCompleted = tableInfo.some((col) => col.column_name === "is_completed")
    // completed sütunu var mı kontrol et
    const hasCompleted = tableInfo.some((col) => col.column_name === "completed")

    // Priority ve is_completed sütunlarına göre sorguyu ayarla
    const todos = await sql`
      SELECT * FROM todos
      WHERE user_id = ${userId}
      ORDER BY due_date ASC
      ${hasPriority ? sql`, priority DESC` : sql``}
    `

    console.log(`${todos.length} yapılacak bulundu`)

    // is_completed veya completed sütunu yoksa, varsayılan olarak false ekle
    const processedTodos = todos.map((todo) => {
      if (!hasIsCompleted && !hasCompleted) {
        return { ...todo, completed: false }
      } else if (!hasIsCompleted && hasCompleted) {
        return { ...todo, is_completed: todo.completed }
      } else if (hasIsCompleted && !hasCompleted) {
        return { ...todo, completed: todo.is_completed }
      }
      return todo
    })

    return NextResponse.json({
      success: true,
      todos: processedTodos,
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

    const { title, description, due_date } = await request.json()

    if (!title) {
      return NextResponse.json({ error: "Başlık gereklidir" }, { status: 400 })
    }

    console.log("Yeni yapılacak ekleniyor:", { title, userId, type: typeof userId })

    // Todos tablosunun yapısını kontrol et
    const tableInfo = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'todos'
    `
    console.log("Todos tablosu sütunları:", tableInfo)

    // id sütununun tipini kontrol et
    const idColumn = tableInfo.find((col) => col.column_name === "id")
    console.log("ID sütunu:", idColumn)

    // UUID oluştur
    const todoId = uuidv4()
    console.log("Oluşturulan UUID:", todoId)

    // Priority sütunu var mı kontrol et
    const hasPriority = tableInfo.some((col) => col.column_name === "priority")
    // is_completed sütunu var mı kontrol et
    const hasIsCompleted = tableInfo.some((col) => col.column_name === "is_completed")
    // completed sütunu var mı kontrol et
    const hasCompleted = tableInfo.some((col) => col.column_name === "completed")

    // Dinamik sorgu oluştur
    let query = `
      INSERT INTO todos (id, title, description, due_date, user_id
    `

    // Opsiyonel sütunları ekle
    if (hasPriority) query += `, priority`
    if (hasIsCompleted) query += `, is_completed`
    if (hasCompleted) query += `, completed`

    query += `) VALUES ($1, $2, $3, $4, $5`

    // Opsiyonel değerleri ekle
    let paramIndex = 6
    if (hasPriority) query += `, $${paramIndex++}`
    if (hasIsCompleted) query += `, $${paramIndex++}`
    if (hasCompleted) query += `, $${paramIndex++}`

    query += `) RETURNING *`

    // Parametreleri hazırla
    const params = [todoId, title, description || "", due_date || null, userId]

    // Opsiyonel parametreleri ekle
    if (hasPriority) params.push(1) // Varsayılan öncelik
    if (hasIsCompleted) params.push(false) // Varsayılan tamamlanma durumu
    if (hasCompleted) params.push(false) // Varsayılan tamamlanma durumu

    console.log("SQL Query:", query)
    console.log("Params:", params)

    // Sorguyu çalıştır
    const result = await sql.query(query, params)

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
