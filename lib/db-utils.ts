import { sql } from "@/lib/db-server"

// Veritabanı tabloları ve yapısını kontrol et
export async function checkDatabaseStructure() {
  try {
    console.log("Veritabanı yapısı kontrol ediliyor...")

    // Transactions tablosunu kontrol et
    const transactionsTable = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'transactions'
      );
    `

    // Categories tablosunu kontrol et
    const categoriesTable = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'categories'
      );
    `

    const result = {
      hasTransactionsTable: transactionsTable[0]?.exists || false,
      hasCategoriesTable: categoriesTable[0]?.exists || false,
    }

    console.log("Veritabanı yapısı:", result)

    // Eğer tablolar yoksa, oluştur
    if (!result.hasTransactionsTable) {
      console.log("Transactions tablosu bulunamadı, oluşturuluyor...")
      await createTransactionsTable()
    }

    if (!result.hasCategoriesTable) {
      console.log("Categories tablosu bulunamadı, oluşturuluyor...")
      await createCategoriesTable()
    }

    return result
  } catch (error) {
    console.error("Veritabanı yapısı kontrol edilirken hata:", error)
    throw error
  }
}

// Transactions tablosunu oluştur
async function createTransactionsTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS transactions (
        id UUID PRIMARY KEY,
        user_id TEXT NOT NULL,
        category_id TEXT,
        amount DECIMAL(15, 2) NOT NULL,
        date DATE NOT NULL,
        description TEXT,
        type TEXT NOT NULL,
        installment_group UUID,
        installment_number INTEGER DEFAULT 1,
        total_installments INTEGER DEFAULT 1,
        frequency TEXT DEFAULT 'once',
        parent_transaction_id UUID,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
    console.log("Transactions tablosu başarıyla oluşturuldu")
    return true
  } catch (error) {
    console.error("Transactions tablosu oluşturulurken hata:", error)
    throw error
  }
}

// Categories tablosunu oluştur
async function createCategoriesTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    // Varsayılan kategorileri ekle
    await sql`
      INSERT INTO categories (id, name, type) VALUES
      ('cat-1', 'Gıda', 'expense'),
      ('cat-2', 'Barınma', 'expense'),
      ('cat-3', 'Ulaşım', 'expense'),
      ('cat-4', 'Eğlence', 'expense'),
      ('cat-5', 'Sağlık', 'expense'),
      ('cat-6', 'Giyim', 'expense'),
      ('cat-7', 'Eğitim', 'expense'),
      ('cat-8', 'Diğer Gider', 'expense'),
      ('cat-9', 'Maaş', 'income'),
      ('cat-10', 'Ek Gelir', 'income'),
      ('cat-11', 'Yatırım', 'income'),
      ('cat-12', 'Diğer Gelir', 'income')
      ON CONFLICT (id) DO NOTHING;
    `

    console.log("Categories tablosu ve varsayılan kategoriler başarıyla oluşturuldu")
    return true
  } catch (error) {
    console.error("Categories tablosu oluşturulurken hata:", error)
    throw error
  }
}

// Veritabanı verilerini sıfırla (test için)
export async function resetDatabase() {
  try {
    console.log("Veritabanı sıfırlanıyor...")

    // Transactions tablosunu temizle
    await sql`TRUNCATE TABLE transactions;`

    console.log("Veritabanı başarıyla sıfırlandı")
    return true
  } catch (error) {
    console.error("Veritabanı sıfırlanırken hata:", error)
    throw error
  }
}

// Veritabanı durumunu kontrol et
export async function getDatabaseStatus() {
  try {
    // Tablo sayılarını al
    const transactionCount = await sql`SELECT COUNT(*) FROM transactions;`
    const categoryCount = await sql`SELECT COUNT(*) FROM categories;`

    return {
      transactionCount: Number.parseInt(transactionCount[0]?.count || "0"),
      categoryCount: Number.parseInt(categoryCount[0]?.count || "0"),
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error("Veritabanı durumu kontrol edilirken hata:", error)
    return {
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    }
  }
}
