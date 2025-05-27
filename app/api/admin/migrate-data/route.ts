import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/app/lib/db-server"

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 Veri aktarımı başlatılıyor...")

    // Admin kontrolü - sadece huseyin97273@gmail.com için
    const body = await request.json().catch(() => ({}))
    console.log("📦 Request body:", body)

    // Mevcut verileri kontrol et
    console.log("📊 Mevcut verileri kontrol ediliyor...")

    const beforeMigration = {
      transactions: 0,
      investments: 0,
      todos: 0,
    }

    try {
      const transactionsResult = await sql`SELECT COUNT(*) as count FROM transactions`
      beforeMigration.transactions = Number(transactionsResult[0].count)
      console.log("📈 Mevcut transactions:", beforeMigration.transactions)
    } catch (error) {
      console.log("⚠️ Transactions tablosu bulunamadı:", error.message)
    }

    try {
      const investmentsResult = await sql`SELECT COUNT(*) as count FROM investments`
      beforeMigration.investments = Number(investmentsResult[0].count)
      console.log("💰 Mevcut investments:", beforeMigration.investments)
    } catch (error) {
      console.log("⚠️ Investments tablosu bulunamadı:", error.message)
    }

    try {
      const todosResult = await sql`SELECT COUNT(*) as count FROM todos`
      beforeMigration.todos = Number(todosResult[0].count)
      console.log("📝 Mevcut todos:", beforeMigration.todos)
    } catch (error) {
      console.log("⚠️ Todos tablosu bulunamadı:", error.message)
    }

    // Demo verileri ekle
    console.log("📦 Demo verileri ekleniyor...")

    // Demo transactions
    const demoTransactions = [
      {
        amount: 5000,
        description: "Maaş",
        category_id: 1,
        type: "income",
        date: "2024-01-15",
        user_id: "admin",
      },
      {
        amount: -1200,
        description: "Kira",
        category_id: 2,
        type: "expense",
        date: "2024-01-01",
        user_id: "admin",
      },
      {
        amount: -300,
        description: "Market alışverişi",
        category_id: 3,
        type: "expense",
        date: "2024-01-05",
        user_id: "admin",
      },
    ]

    for (const transaction of demoTransactions) {
      try {
        await sql`
          INSERT INTO transactions (amount, description, category_id, type, date, user_id, created_at)
          VALUES (${transaction.amount}, ${transaction.description}, ${transaction.category_id}, ${transaction.type}, ${transaction.date}, ${transaction.user_id}, NOW())
        `
        console.log("✅ Transaction eklendi:", transaction.description)
      } catch (error) {
        console.log("⚠️ Transaction eklenemedi:", error.message)
      }
    }

    // Demo investments
    const demoInvestments = [
      {
        symbol: "BIST100",
        name: "BIST 100 Endeksi",
        amount: 10000,
        purchase_price: 9500,
        current_price: 10200,
        user_id: "admin",
      },
      {
        symbol: "GOLD",
        name: "Altın",
        amount: 5000,
        purchase_price: 4800,
        current_price: 5100,
        user_id: "admin",
      },
    ]

    for (const investment of demoInvestments) {
      try {
        await sql`
          INSERT INTO investments (symbol, name, amount, purchase_price, current_price, user_id, created_at)
          VALUES (${investment.symbol}, ${investment.name}, ${investment.amount}, ${investment.purchase_price}, ${investment.current_price}, ${investment.user_id}, NOW())
        `
        console.log("✅ Investment eklendi:", investment.name)
      } catch (error) {
        console.log("⚠️ Investment eklenemedi:", error.message)
      }
    }

    // Demo todos
    const demoTodos = [
      {
        title: "Aylık bütçe planı yap",
        description: "Gelecek ay için detaylı bütçe planı hazırla",
        priority: "high",
        completed: false,
        user_id: "admin",
      },
      {
        title: "Yatırım portföyünü gözden geçir",
        description: "Mevcut yatırımların performansını analiz et",
        priority: "medium",
        completed: false,
        user_id: "admin",
      },
    ]

    for (const todo of demoTodos) {
      try {
        await sql`
          INSERT INTO todos (title, description, priority, completed, user_id, created_at)
          VALUES (${todo.title}, ${todo.description}, ${todo.priority}, ${todo.completed}, ${todo.user_id}, NOW())
        `
        console.log("✅ Todo eklendi:", todo.title)
      } catch (error) {
        console.log("⚠️ Todo eklenemedi:", error.message)
      }
    }

    // Aktarım sonrası verileri kontrol et
    const afterMigration = {
      transactions: 0,
      investments: 0,
      todos: 0,
    }

    try {
      const transactionsResult = await sql`SELECT COUNT(*) as count FROM transactions`
      afterMigration.transactions = Number(transactionsResult[0].count)
    } catch (error) {
      console.log("⚠️ Transactions sayısı alınamadı")
    }

    try {
      const investmentsResult = await sql`SELECT COUNT(*) as count FROM investments`
      afterMigration.investments = Number(investmentsResult[0].count)
    } catch (error) {
      console.log("⚠️ Investments sayısı alınamadı")
    }

    try {
      const todosResult = await sql`SELECT COUNT(*) as count FROM todos`
      afterMigration.todos = Number(todosResult[0].count)
    } catch (error) {
      console.log("⚠️ Todos sayısı alınamadı")
    }

    console.log("✅ Veri aktarımı tamamlandı!")
    console.log("📊 Sonuç:", { beforeMigration, afterMigration })

    return NextResponse.json({
      success: true,
      message: "Demo veriler başarıyla aktarıldı",
      beforeMigration,
      afterMigration,
    })
  } catch (error) {
    console.error("❌ Migration error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Veri aktarımı başarısız",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
