import { neon, neonConfig } from "@neondatabase/serverless"
import { Client } from "@neondatabase/serverless"

// Neon yapılandırması
neonConfig.fetchConnectionCache = true
neonConfig.usePooling = true

// Veritabanı URL'sini al
const getDatabaseUrl = () => {
  // Tüm olası veritabanı URL'lerini kontrol et
  const dbUrl =
    process.env.POSTGRES_URL ||
    process.env.NEON_POSTGRES_URL ||
    process.env.NEON_DATABASE_URL ||
    process.env.NEON_DATABASE_URL ||
    process.env.NEON_NEON_DATABASE_URL ||
    process.env.NEON_POSTGRES_URL_NON_POOLING ||
    process.env.NEON_DATABASE_URL_UNPOOLED

  if (!dbUrl) {
    console.error("Veritabanı URL'si bulunamadı! Mevcut çevresel değişkenler:", {
      hasPgUrl: !!process.env.POSTGRES_URL,
      hasDBUrl: !!process.env.DATABASE_URL,
      hasNeonDbUrl: !!process.env.NEON_DATABASE_URL,
      hasNeonPgUrl: !!process.env.NEON_POSTGRES_URL,
      hasNeonPgUrlNonPooling: !!process.env.NEON_POSTGRES_URL_NON_POOLING,
      hasNeonDbUrlUnpooled: !!process.env.NEON_DATABASE_URL_UNPOOLED,
      // Tüm mevcut çevresel değişkenleri listele
      envKeys: Object.keys(process.env).filter(
        (key) => key.includes("NEON") || key.includes("DATABASE") || key.includes("POSTGRES"),
      ),
    })

    // Test modunda çalışmak için sabit bir URL döndür
    if (process.env.NODE_ENV !== "production") {
      console.log("Test modu için varsayılan veritabanı URL'si kullanılıyor")
      return "postgres://test:test@localhost:5432/test"
    }

    throw new Error("Veritabanı URL'si bulunamadı!")
  }

  console.log("Veritabanı URL'si bulundu:", dbUrl.substring(0, 20) + "...")
  return dbUrl
}

// SQL istemcisi oluştur
export const getClient = () => {
  const dbUrl = getDatabaseUrl()
  return new Client(dbUrl)
}

// SQL istemcisi oluştur
export const sql = neon(getDatabaseUrl())

// Bağlantıyı test et
export const testConnection = async () => {
  try {
    console.log("Veritabanı bağlantısı test ediliyor...")
    const result = await sql`SELECT NOW() as time`
    console.log("Veritabanı bağlantı testi başarılı:", result)
    return { success: true, result }
  } catch (error) {
    console.error("Veritabanı bağlantı testi başarısız:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

export async function getTableStructure(tableName: string) {
  try {
    console.log(`${tableName} tablosu yapısı getiriliyor...`)
    const result = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = ${tableName}
      ORDER BY ordinal_position;
    `
    console.log(`${tableName} tablosu yapısı başarıyla alındı`)
    return result
  } catch (error) {
    console.error(`${tableName} tablosu yapısı getirilirken hata:`, error)
    throw error
  }
}

export async function queryTable(tableName: string) {
  try {
    console.log(`${tableName} tablosu verileri getiriliyor...`)
    const result = await sql`SELECT * FROM ${sql(tableName)}`
    console.log(`${tableName} tablosu verileri başarıyla alındı, satır sayısı: ${result.length}`)
    return result
  } catch (error) {
    console.error(`${tableName} tablosu verileri getirilirken hata:`, error)
    throw error
  }
}

export const getSql = () => sql
