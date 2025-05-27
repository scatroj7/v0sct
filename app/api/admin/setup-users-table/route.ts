import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/app/lib/db-server"

export async function POST(request: NextRequest) {
  try {
    console.log("🔧 Users tablosu kurulumu başlatılıyor...")

    // 1. Önce users tablosu var mı kontrol et
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      )
    `

    if (!tableExists[0].exists) {
      // Users tablosunu oluştur
      await sql`
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          is_admin BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `
      console.log("✅ Users tablosu oluşturuldu")
    } else {
      console.log("ℹ️ Users tablosu zaten mevcut")
    }

    // 2. is_admin kolonu var mı kontrol et
    const columnExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'is_admin'
      )
    `

    if (!columnExists[0].exists) {
      // is_admin kolonunu ekle
      await sql`
        ALTER TABLE users 
        ADD COLUMN is_admin BOOLEAN DEFAULT FALSE
      `
      console.log("✅ is_admin kolonu eklendi")
    } else {
      console.log("ℹ️ is_admin kolonu zaten mevcut")
    }

    // 3. Admin kullanıcısını oluştur/güncelle
    const adminEmail = "huseyin97273@gmail.com"

    const existingUser = await sql`
      SELECT id, is_admin FROM users WHERE email = ${adminEmail}
    `

    if (existingUser.length === 0) {
      // Admin kullanıcısını oluştur
      const newUser = await sql`
        INSERT INTO users (email, password_hash, is_admin, created_at)
        VALUES (${adminEmail}, 'hashed_password', true, NOW())
        RETURNING id, email, is_admin
      `
      console.log("✅ Admin kullanıcısı oluşturuldu:", newUser[0])
    } else {
      // Mevcut kullanıcıyı admin yap
      const updatedUser = await sql`
        UPDATE users 
        SET is_admin = true 
        WHERE email = ${adminEmail}
        RETURNING id, email, is_admin
      `
      console.log("✅ Kullanıcı admin yapıldı:", updatedUser[0])
    }

    // 4. Tablo yapısını kontrol et
    const tableStructure = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `

    // 5. Kullanıcı sayısını al
    const userCount = await sql`
      SELECT COUNT(*) as count FROM users
    `

    return NextResponse.json({
      success: true,
      message: "Users tablosu başarıyla kuruldu",
      tableStructure,
      userCount: userCount[0].count,
      adminUserExists: true,
    })
  } catch (error) {
    console.error("❌ Users tablosu kurulum hatası:", error)
    return NextResponse.json(
      {
        error: "Users tablosu kurulumu başarısız",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
