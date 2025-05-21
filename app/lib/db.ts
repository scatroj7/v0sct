import { getClient } from "@/app/lib/db-server"

/**
 * Veritabanı tabloları ve yapısını kontrol eder
 * @returns Veritabanı yapısı bilgileri
 */
export async function checkDatabaseStructure() {
  try {
    console.log("Veritabanı yapısı kontrol ediliyor...")

    const client = getClient()

    // Transactions tablosunu kontrol et
    const transactionsTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'transactions'
      );
    `
    const transactionsTable = await client.query(transactionsTableQuery)

    // Categories tablosunu kontrol et
    const categoriesTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'categories'
      );
    `
    const categoriesTable = await client.query(categoriesTableQuery)

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

    // Tabloların oluşturulduğunu doğrula
    const verifyTransactionsTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'transactions'
      );
    `
    const verifyTransactionsTable = await client.query(verifyTransactionsTableQuery)

    const verifyCategoriesTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'categories'
      );
    `
    const verifyCategoriesTable = await client.query(verifyCategoriesTableQuery)

    const verifyResult = {
      hasTransactionsTable: verifyTransactionsTable[0]?.exists || false,
      hasCategoriesTable: verifyCategoriesTable[0]?.exists || false,
    }

    console.log("Veritabanı yapısı doğrulama:", verifyResult)

    if (!verifyResult.hasTransactionsTable || !verifyResult.hasCategoriesTable) {
      throw new Error("Tablolar oluşturulamadı veya doğrulanamadı")
    }

    return verifyResult
  } catch (error) {
    console.error("Veritabanı yapısı kontrol edilirken hata:", error)
    throw error
  }
}

/**
 * Transactions tablosunu oluşturur
 */
async function createTransactionsTable() {
  try {
    const client = getClient()
    const query = `
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
    await client.query(query)
    console.log("Transactions tablosu başarıyla oluşturuldu")
    return true
  } catch (error) {
    console.error("Transactions tablosu oluşturulurken hata:", error)
    throw error
  }
}

/**
 * Categories tablosunu oluşturur
 */
async function createCategoriesTable() {
  try {
    const client = getClient()

    // Tabloyu oluştur
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
    await client.query(createTableQuery)

    // Varsayılan kategorileri ekle
    const insertCategoriesQuery = `
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
    await client.query(insertCategoriesQuery)

    console.log("Categories tablosu ve varsayılan kategoriler başarıyla oluşturuldu")
    return true
  } catch (error) {
    console.error("Categories tablosu oluşturulurken hata:", error)
    throw error
  }
}

/**
 * Veritabanı durumunu kontrol eder
 * @returns Veritabanı durumu bilgileri
 */
export async function getDatabaseStatus() {
  try {
    const client = getClient()

    // Transactions tablosunu kontrol et
    let transactionCount
    try {
      const transactionResult = await client.query(`SELECT COUNT(*) FROM transactions;`)
      transactionCount = Number.parseInt(transactionResult[0]?.count || "0")
    } catch (error) {
      console.error("Transactions tablosu sayımı sırasında hata:", error)
      transactionCount = 0
    }

    // Categories tablosunu kontrol et
    let categoryCount
    try {
      const categoryResult = await client.query(`SELECT COUNT(*) FROM categories;`)
      categoryCount = Number.parseInt(categoryResult[0]?.count || "0")
    } catch (error) {
      console.error("Categories tablosu sayımı sırasında hata:", error)
      categoryCount = 0
    }

    // Tablo yapılarını kontrol et
    let transactionsStructure
    try {
      const transactionsStructureQuery = `
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'transactions' 
        ORDER BY ordinal_position;
      `
      transactionsStructure = await client.query(transactionsStructureQuery)
    } catch (error) {
      console.error("Transactions yapısı alınırken hata:", error)
      transactionsStructure = []
    }

    let categoriesStructure
    try {
      const categoriesStructureQuery = `
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'categories' 
        ORDER BY ordinal_position;
      `
      categoriesStructure = await client.query(categoriesStructureQuery)
    } catch (error) {
      console.error("Categories yapısı alınırken hata:", error)
      categoriesStructure = []
    }

    return {
      transactionCount,
      categoryCount,
      transactionsStructure,
      categoriesStructure,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error("Veritabanı durumu kontrol edilirken hata:", error)
    return {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    }
  }
}

/**
 * Veritabanı verilerini sıfırlar (test için)
 */
export async function resetDatabase() {
  try {
    console.log("Veritabanı sıfırlanıyor...")

    const client = getClient()
    await client.query("TRUNCATE TABLE transactions;")

    console.log("Veritabanı başarıyla sıfırlandı")
    return true
  } catch (error) {
    console.error("Veritabanı sıfırlanırken hata:", error)
    throw error
  }
}
