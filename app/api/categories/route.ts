import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/app/lib/db-server"
import { getUserIdFromSession } from "@/app/lib/auth"

export async function GET(request: NextRequest) {
  try {
    console.log("Kategoriler getiriliyor...")
    const userId = getUserIdFromSession()

    if (!userId) {
      return NextResponse.json({ success: false, message: "Oturum bulunamadı" }, { status: 401 })
    }

    // Tüm kategorileri getir (user_id kontrolü olmadan)
    const categories = await sql`
      SELECT * FROM categories 
      ORDER BY name
    `

    console.log(`${categories.length} kategori bulundu`)

    return NextResponse.json({
      success: true,
      categories: categories,
    })
  } catch (error) {
    console.error("Kategoriler getirilirken hata:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Kategoriler getirilirken bir hata oluştu",
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
      return NextResponse.json({ success: false, message: "Oturum bulunamadı" }, { status: 401 })
    }

    const { name, type, color } = await request.json()

    if (!name || !type) {
      return NextResponse.json({ success: false, message: "İsim ve tür gereklidir" }, { status: 400 })
    }

    // Yeni kategori ekle (user_id olmadan)
    const result = await sql`
      INSERT INTO categories (name, type, color) 
      VALUES (${name}, ${type}, ${color || "#808080"}) 
      RETURNING *
    `

    return NextResponse.json({
      success: true,
      message: "Kategori başarıyla eklendi",
      category: result[0],
    })
  } catch (error) {
    console.error("Kategori eklenirken hata:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Kategori eklenirken bir hata oluştu",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
