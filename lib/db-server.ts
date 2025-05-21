import { neon, neonConfig } from "@neondatabase/serverless"

// Neon yapılandırması
neonConfig.fetchConnectionCache = true
neonConfig.usePooling = true

// Veritabanı URL'sini al
const getDatabaseUrl = () => {
  // Tüm olası veritabanı URL'lerini kontrol et
  const dbUrl =
    process.env.POSTGRES_URL ||
    process.env.NEON_NEON_NEON_DATABASE_URL ||
    process.env.DATABASE_URL ||
    process.env.NEON_POSTGRES_URL

  if (!dbUrl) {
    console.error("Veritabanı URL'si bulunamadı! Mevcut çevresel değişkenler:", {
      hasPgUrl: !!process.env.POSTGRES_URL,
      hasDBUrl: !!process.env.DATABASE_URL,
      hasNeonDbUrl: !!process.env.NEON_DATABASE_URL,
      hasNeonPgUrl: !!process.env.NEON_POSTGRES_URL,
    })

    // Test modunda çalışmak için sabit bir URL döndür
    if (process.env.NODE_ENV !== "production") {
      return "postgres://test:test@localhost:5432/test"
    }

    throw new Error("Veritabanı URL'si bulunamadı!")
  }

  return dbUrl
}

// SQL istemcisi
let sqlClient: any = null

// SQL istemcisini oluştur
export const getClient = () => {
  if (!sqlClient) {
    try {
      const dbUrl = getDatabaseUrl()
      console.log("Veritabanı URL'si:", dbUrl.substring(0, 20) + "...") // URL'nin bir kısmını logla
      sqlClient = neon(dbUrl)
      console.log("SQL istemcisi başarıyla oluşturuldu")
    } catch (error) {
      console.error("SQL istemcisi oluşturulurken hata:", error)
      throw error
    }
  }
  return sqlClient
}

// SQL sorgusu çalıştır
export const sql = async (strings: any, ...values: any[]) => {
  try {
    const client = getClient()
    console.log("SQL sorgusu çalıştırılıyor:", strings.join("?"), "Değerler:", JSON.stringify(values))
    const result = await client(strings, ...values)
    console.log("SQL sorgusu başarıyla çalıştırıldı, sonuç sayısı:", result?.length || 0)
    return result
  } catch (error) {
    console.error("SQL sorgusu çalıştırılırken hata:", error)
    throw error // Hatayı yukarı fırlat, böylece çağıran fonksiyon uygun şekilde işleyebilir
  }
}

// Bağlantıyı test et
export const testConnection = async () => {
  try {
    console.log("Veritabanı bağlantısı test ediliyor...")

    // Veritabanı URL'sini kontrol et
    try {
      const dbUrl = getDatabaseUrl()
      console.log("Veritabanı URL'si bulundu:", dbUrl.substring(0, 20) + "...")
    } catch (urlError) {
      console.error("Veritabanı URL'si alınırken hata:", urlError)
      return { success: false, error: "Veritabanı URL'si bulunamadı" }
    }

    try {
      // Test sorgusu çalıştır
      const result = await sql`SELECT NOW() as time`
      console.log("Veritabanı bağlantı testi başarılı:", result)
      return { success: true, result }
    } catch (queryError) {
      console.error("Veritabanı sorgusu başarısız:", queryError)
      return {
        success: false,
        error: queryError instanceof Error ? queryError.message : String(queryError),
        fallbackAvailable: true,
      }
    }
  } catch (error) {
    console.error("Veritabanı bağlantı testi başarısız:", error)

    // Test kullanıcısı ile devam et
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      fallbackAvailable: true,
    }
  }
}
