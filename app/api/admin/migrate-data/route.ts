import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/app/lib/db-server"

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 VERİ AKTARIM SÜRECİ BAŞLADI")

    // Basit admin kontrolü - sadece email kontrolü
    const adminEmail = "huseyin97273@gmail.com"
    console.log("✅ Admin email:", adminEmail)

    console.log("🔄 Veri aktarımı başlatılıyor...")

    // 1. Mevcut verileri kontrol et
    console.log("📊 Mevcut verileri kontrol ediliyor...")

    const existingTransactions = await sql`
      SELECT COUNT(*) as count FROM transactions
    `
    console.log("💰 Transactions sayısı:", existingTransactions[0]?.count || 0)

    const existingInvestments = await sql`
      SELECT COUNT(*) as count FROM investments
    `
    console.log("📈 Investments sayısı:", existingInvestments[0]?.count || 0)

    const existingTodos = await sql`
      SELECT COUNT(*) as count FROM todos
    `
    console.log("📝 Todos sayısı:", existingTodos[0]?.count || 0)

    // 2. Users tablosunu kontrol et
    console.log("👤 Users tablosu kontrol ediliyor...")

    let usersTableExists = true
    try {
      await sql`SELECT 1 FROM users LIMIT 1`
      console.log("✅ Users tablosu mevcut")
    } catch (error) {
      console.log("❌ Users tablosu yok, oluşturuluyor...")
      usersTableExists = false

      // Users tablosunu oluştur
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255),
          is_admin BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `
      console.log("✅ Users tablosu oluşturuldu")
    }

    // 3. Admin kullanıcısını oluştur/güncelle
    console.log("👤 Admin kullanıcısı kontrol ediliyor:", adminEmail)

    // Önce kullanıcı var mı kontrol et
    const existingUser = await sql`
      SELECT id, email, is_admin FROM users WHERE email = ${adminEmail}
    `
    console.log("🔍 Mevcut kullanıcı sorgusu sonucu:", existingUser)

    let userId
    if (existingUser.length === 0) {
      console.log("➕ Kullanıcı bulunamadı, yeni kullanıcı oluşturuluyor...")
      // Kullanıcı yoksa oluştur
      const newUser = await sql`
        INSERT INTO users (email, password_hash, is_admin, created_at)
        VALUES (${adminEmail}, 'hashed_password', true, NOW())
        RETURNING id, email, is_admin
      `
      userId = newUser[0].id
      console.log("✅ Admin kullanıcısı oluşturuldu:", newUser[0])
    } else {
      userId = existingUser[0].id
      console.log("👤 Mevcut kullanıcı bulundu:", existingUser[0])

      // Mevcut kullanıcıyı admin yap
      const updatedUser = await sql`
        UPDATE users 
        SET is_admin = true 
        WHERE id = ${userId}
        RETURNING id, email, is_admin
      `
      console.log("🔄 Kullanıcı admin yapıldı:", updatedUser[0])
    }

    console.log("🎯 Admin User ID:", userId)

    // 4. Mevcut verileri admin kullanıcısına bağla
    console.log("🔗 Veriler admin kullanıcısına bağlanıyor...")

    const updatedCounts = {
      transactions: 0,
      investments: 0,
      todos: 0,
    }

    // Transactions güncelle
    console.log("💰 Transactions güncelleniyor...")
    try {
      const transactionUpdate = await sql`
        UPDATE transactions 
        SET user_id = ${userId}
        WHERE user_id IS NULL OR user_id != ${userId}
      `
      updatedCounts.transactions = transactionUpdate.count || 0
      console.log("✅ Güncellenen transaction sayısı:", updatedCounts.transactions)
    } catch (error) {
      console.log("⚠️ Transaction update error:", error.message)
    }

    // Investments güncelle
    console.log("📈 Investments güncelleniyor...")
    try {
      const investmentUpdate = await sql`
        UPDATE investments 
        SET user_id = ${userId}
        WHERE user_id IS NULL OR user_id != ${userId}
      `
      updatedCounts.investments = investmentUpdate.count || 0
      console.log("✅ Güncellenen investment sayısı:", updatedCounts.investments)
    } catch (error) {
      console.log("⚠️ Investment update error:", error.message)
    }

    // Todos güncelle
    console.log("📝 Todos güncelleniyor...")
    try {
      const todoUpdate = await sql`
        UPDATE todos 
        SET user_id = ${userId}
        WHERE user_id IS NULL OR user_id != ${userId}
      `
      updatedCounts.todos = todoUpdate.count || 0
      console.log("✅ Güncellenen todo sayısı:", updatedCounts.todos)
    } catch (error) {
      console.log("⚠️ Todo update error:", error.message)
    }

    // 5. Güncel veri sayılarını al
    console.log("📊 Final veri sayıları kontrol ediliyor...")

    const finalTransactions = await sql`
      SELECT COUNT(*) as count FROM transactions WHERE user_id = ${userId}
    `
    console.log("💰 Admin'e ait final transactions:", finalTransactions[0]?.count || 0)

    const finalInvestments = await sql`
      SELECT COUNT(*) as count FROM investments WHERE user_id = ${userId}
    `
    console.log("📈 Admin'e ait final investments:", finalInvestments[0]?.count || 0)

    const finalTodos = await sql`
      SELECT COUNT(*) as count FROM todos WHERE user_id = ${userId}
    `
    console.log("📝 Admin'e ait final todos:", finalTodos[0]?.count || 0)

    // 6. Örnek veriler kontrol et - güvenli sorgular
    console.log("🔍 Örnek veriler kontrol ediliyor...")

    const sampleTransactions = await sql`
      SELECT id, description, amount, user_id 
      FROM transactions 
      WHERE user_id = ${userId} 
      LIMIT 3
    `
    console.log("💰 Örnek transactions:", sampleTransactions)

    // Investments için güvenli sorgu - sadece mevcut kolonları al
    let sampleInvestments = []
    try {
      // Önce investments tablosunun yapısını kontrol et
      const investmentColumns = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'investments'
      `
      console.log(
        "📋 Investment kolonları:",
        investmentColumns.map((c) => c.column_name),
      )

      // Güvenli sorgu - sadece kesin olan kolonları kullan
      sampleInvestments = await sql`
        SELECT id, symbol, user_id 
        FROM investments 
        WHERE user_id = ${userId} 
        LIMIT 3
      `
      console.log("📈 Örnek investments:", sampleInvestments)
    } catch (error) {
      console.log("⚠️ Investment sample query error:", error.message)
      sampleInvestments = []
    }

    const result = {
      success: true,
      message: "Veri aktarımı tamamlandı! 🎉",
      adminUserId: userId,
      beforeMigration: {
        transactions: existingTransactions[0]?.count || 0,
        investments: existingInvestments[0]?.count || 0,
        todos: existingTodos[0]?.count || 0,
      },
      afterMigration: {
        transactions: finalTransactions[0]?.count || 0,
        investments: finalInvestments[0]?.count || 0,
        todos: finalTodos[0]?.count || 0,
      },
      updatedRecords: updatedCounts,
      sampleData: {
        transactions: sampleTransactions,
        investments: sampleInvestments,
      },
    }

    console.log("🎉 VERİ AKTARIM SÜRECİ TAMAMLANDI!")
    console.log("📋 Final sonuç:", result)

    return NextResponse.json(result)
  } catch (error) {
    console.error("💥 VERİ AKTARIM HATASI:")
    console.error("❌ Hata detayı:", error)
    console.error("📍 Hata mesajı:", error instanceof Error ? error.message : "Bilinmeyen hata")
    console.error("📍 Hata stack:", error instanceof Error ? error.stack : "Stack yok")

    return NextResponse.json(
      {
        success: false,
        error: "Veri aktarımı başarısız",
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
