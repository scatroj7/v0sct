import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

// Veritabanı URL'sini al
const getDatabaseUrl = () => {
  const dbUrl =
    process.env.POSTGRES_URL ||
    process.env.NEON_NEON_NEON_NEON_DATABASE_URL ||
    process.env.DATABASE_URL ||
    process.env.NEON_POSTGRES_URL ||
    process.env.NEON_DATABASE_URL

  if (!dbUrl) {
    if (process.env.NODE_ENV !== "production") {
      return "postgres://test:test@localhost:5432/test"
    }
    throw new Error("Veritabanı URL'si bulunamadı!")
  }
  return dbUrl
}

const sql = neon(getDatabaseUrl())

export async function GET() {
  try {
    console.log("Yatırımlar tablosu oluşturuluyor...")

    // Önce mevcut tabloyu kontrol et
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'investments'
      )
    `

    if (tableExists[0]?.exists) {
      console.log("Yatırımlar tablosu zaten mevcut, yapısı kontrol ediliyor...")

      // Tablo yapısını kontrol et
      const columns = await sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'investments'
        ORDER BY ordinal_position
      `

      console.log("Mevcut tablo yapısı:", columns)

      // ID sütununun doğru olup olmadığını kontrol et
      const idColumn = columns.find((col) => col.column_name === "id")

      if (!idColumn || !idColumn.column_default?.includes("nextval")) {
        console.log("ID sütunu düzeltiliyor...")

        // Tabloyu sil
        await sql`DROP TABLE IF EXISTS investments CASCADE`

        // Yeni tabloyu oluştur
        await sql`
          CREATE TABLE investments (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            category VARCHAR(50) NOT NULL,
            type VARCHAR(100) NOT NULL,
            amount DECIMAL(20, 8) NOT NULL,
            purchase_price DECIMAL(20, 8) NOT NULL,
            current_price DECIMAL(20, 8),
            symbol VARCHAR(20),
            purchase_date DATE NOT NULL,
            notes TEXT,
            user_id VARCHAR(255) NOT NULL,
            last_updated TIMESTAMP DEFAULT NOW(),
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          )
        `

        console.log("Yatırımlar tablosu yeniden oluşturuldu")
      } else {
        console.log("Yatırımlar tablosu yapısı doğru")
      }
    } else {
      // Tabloyu oluştur
      await sql`
        CREATE TABLE investments (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          category VARCHAR(50) NOT NULL,
          type VARCHAR(100) NOT NULL,
          amount DECIMAL(20, 8) NOT NULL,
          purchase_price DECIMAL(20, 8) NOT NULL,
          current_price DECIMAL(20, 8),
          symbol VARCHAR(20),
          purchase_date DATE NOT NULL,
          notes TEXT,
          user_id VARCHAR(255) NOT NULL,
          last_updated TIMESTAMP DEFAULT NOW(),
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `

      console.log("Yatırımlar tablosu başarıyla oluşturuldu")
    }

    // İndeksleri ayrı ayrı oluştur
    try {
      await sql`CREATE INDEX IF NOT EXISTS idx_investments_user_id ON investments(user_id)`
      console.log("User ID indeksi oluşturuldu")
    } catch (error) {
      console.log("User ID indeksi zaten mevcut")
    }

    try {
      await sql`CREATE INDEX IF NOT EXISTS idx_investments_category ON investments(category)`
      console.log("Category indeksi oluşturuldu")
    } catch (error) {
      console.log("Category indeksi zaten mevcut")
    }

    try {
      await sql`CREATE INDEX IF NOT EXISTS idx_investments_symbol ON investments(symbol)`
      console.log("Symbol indeksi oluşturuldu")
    } catch (error) {
      console.log("Symbol indeksi zaten mevcut")
    }

    // Trigger fonksiyonunu oluştur
    try {
      await sql`
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ language 'plpgsql'
      `
      console.log("Update trigger fonksiyonu oluşturuldu")
    } catch (error) {
      console.log("Update trigger fonksiyonu oluşturulurken hata:", error)
    }

    // Trigger'ı oluştur
    try {
      await sql`DROP TRIGGER IF EXISTS update_investments_updated_at ON investments`
      await sql`
        CREATE TRIGGER update_investments_updated_at
          BEFORE UPDATE ON investments
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column()
      `
      console.log("Update trigger oluşturuldu")
    } catch (error) {
      console.log("Update trigger oluşturulurken hata:", error)
    }

    return NextResponse.json({
      success: true,
      message: "Yatırımlar tablosu başarıyla hazırlandı",
    })
  } catch (error) {
    console.error("Yatırımlar tablosu oluşturulurken hata:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Yatırımlar tablosu oluşturulurken bir hata oluştu",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
