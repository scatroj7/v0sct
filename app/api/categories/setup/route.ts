import { NextResponse } from "next/server"
import { getClient } from "@/app/lib/db-server"

export async function POST() {
  try {
    const client = getClient()

    // Check if categories table exists
    const tableCheckQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'categories'
      ) AS "table_exists"
    `
    const tableCheckResult = await client.query(tableCheckQuery)
    const tableExists = tableCheckResult[0]?.table_exists

    if (!tableExists) {
      // Create categories table
      const createTableQuery = `
        CREATE TABLE categories (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          icon TEXT,
          color TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `
      await client.query(createTableQuery)

      // Insert default categories
      const defaultCategories = [
        { name: "Maaş", type: "income", icon: "wallet", color: "#4ade80" },
        { name: "Yatırım Geliri", type: "income", icon: "trending-up", color: "#22c55e" },
        { name: "Hediye", type: "income", icon: "gift", color: "#16a34a" },
        { name: "Ek İş", type: "income", icon: "briefcase", color: "#15803d" },
        { name: "Diğer Gelir", type: "income", icon: "plus-circle", color: "#166534" },

        { name: "Kira", type: "expense", icon: "home", color: "#f87171" },
        { name: "Market", type: "expense", icon: "shopping-cart", color: "#ef4444" },
        { name: "Faturalar", type: "expense", icon: "file-text", color: "#dc2626" },
        { name: "Ulaşım", type: "expense", icon: "car", color: "#b91c1c" },
        { name: "Sağlık", type: "expense", icon: "activity", color: "#991b1b" },
        { name: "Eğlence", type: "expense", icon: "music", color: "#7f1d1d" },
        { name: "Giyim", type: "expense", icon: "shopping-bag", color: "#f97316" },
        { name: "Eğitim", type: "expense", icon: "book", color: "#ea580c" },
        { name: "Diğer Gider", type: "expense", icon: "minus-circle", color: "#c2410c" },
      ]

      for (const category of defaultCategories) {
        const insertQuery = `
          INSERT INTO categories (name, type, icon, color)
          VALUES ($1, $2, $3, $4)
        `
        await client.query(insertQuery, [category.name, category.type, category.icon, category.color])
      }

      return NextResponse.json({
        success: true,
        message: "Kategoriler tablosu oluşturuldu ve varsayılan kategoriler eklendi",
      })
    }

    return NextResponse.json({
      success: true,
      message: "Kategoriler tablosu zaten mevcut",
    })
  } catch (error) {
    console.error("Kategoriler tablosu oluşturulurken hata:", error)
    return NextResponse.json(
      {
        error: "Failed to setup categories table",
        message: "Kategoriler tablosu oluşturulurken bir hata oluştu",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
