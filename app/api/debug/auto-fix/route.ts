import { NextResponse } from "next/server"
import { sql } from "@/app/lib/db-server"

export async function POST() {
  try {
    console.log("🔧 Otomatik veritabanı düzeltme başlatılıyor...")

    const fixResults = {
      applied: [] as string[],
      failed: [] as string[],
      skipped: [] as string[],
    }

    // 1. Eksik tabloları oluştur
    const missingTables = [
      {
        name: "users",
        sql: `
          CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            email_verified BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            last_login TIMESTAMP WITH TIME ZONE,
            failed_login_attempts INTEGER DEFAULT 0,
            locked_until TIMESTAMP WITH TIME ZONE
          );
        `,
      },
      {
        name: "user_preferences",
        sql: `
          CREATE TABLE IF NOT EXISTS user_preferences (
            user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
            storage_mode VARCHAR(20) DEFAULT 'hybrid',
            auto_sync BOOLEAN DEFAULT TRUE,
            encrypt_local BOOLEAN DEFAULT TRUE,
            sync_interval INTEGER DEFAULT 5,
            offline_mode BOOLEAN DEFAULT FALSE,
            metadata JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `,
      },
      {
        name: "user_data_backup",
        sql: `
          CREATE TABLE IF NOT EXISTS user_data_backup (
            user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
            data JSONB NOT NULL,
            metadata JSONB,
            data_size INTEGER,
            checksum VARCHAR(255),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `,
      },
      {
        name: "login_attempts",
        sql: `
          CREATE TABLE IF NOT EXISTS login_attempts (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) NOT NULL,
            user_id UUID REFERENCES users(id),
            ip_address INET,
            user_agent TEXT,
            success BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `,
      },
      {
        name: "sync_conflicts",
        sql: `
          CREATE TABLE IF NOT EXISTS sync_conflicts (
            id SERIAL PRIMARY KEY,
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            conflict_type VARCHAR(50) NOT NULL,
            local_data JSONB,
            cloud_data JSONB,
            resolution VARCHAR(20),
            resolved_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `,
      },
    ]

    for (const table of missingTables) {
      try {
        await sql.unsafe(table.sql)
        fixResults.applied.push(`✅ ${table.name} tablosu oluşturuldu/kontrol edildi`)
      } catch (error) {
        fixResults.failed.push(`❌ ${table.name} tablosu oluşturulamadı: ${error}`)
      }
    }

    // 2. Eksik indexleri oluştur
    const indexes = [
      {
        name: "idx_users_email",
        sql: "CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);",
      },
      {
        name: "idx_transactions_user_id",
        sql: "CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);",
      },
      {
        name: "idx_transactions_date",
        sql: "CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);",
      },
      {
        name: "idx_login_attempts_email",
        sql: "CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email);",
      },
      {
        name: "idx_login_attempts_created_at",
        sql: "CREATE INDEX IF NOT EXISTS idx_login_attempts_created_at ON login_attempts(created_at);",
      },
    ]

    for (const index of indexes) {
      try {
        await sql.unsafe(index.sql)
        fixResults.applied.push(`✅ ${index.name} indexi oluşturuldu`)
      } catch (error) {
        fixResults.failed.push(`❌ ${index.name} indexi oluşturulamadı: ${error}`)
      }
    }

    // 3. Transactions tablosunu users ile ilişkilendir
    try {
      // Önce mevcut constraint'i kaldır
      await sql`
        ALTER TABLE transactions 
        DROP CONSTRAINT IF EXISTS fk_transactions_user;
      `

      // Yeni constraint ekle (eğer users tablosu varsa)
      const usersExists = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'users'
        );
      `

      if (usersExists[0]?.exists) {
        await sql`
          ALTER TABLE transactions 
          ADD CONSTRAINT fk_transactions_user 
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        `
        fixResults.applied.push("✅ Transactions-Users ilişkisi kuruldu")
      } else {
        fixResults.skipped.push("⏭️ Users tablosu yok, ilişki kurulamadı")
      }
    } catch (error) {
      fixResults.failed.push(`❌ Transactions-Users ilişkisi kurulamadı: ${error}`)
    }

    // 4. Varsayılan kategorileri ekle
    try {
      const categoriesCount = await sql`SELECT COUNT(*) as count FROM categories`
      const count = Number.parseInt(categoriesCount[0]?.count || "0")

      if (count === 0) {
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
        fixResults.applied.push("✅ Varsayılan kategoriler eklendi")
      } else {
        fixResults.skipped.push("⏭️ Kategoriler zaten mevcut")
      }
    } catch (error) {
      fixResults.failed.push(`❌ Varsayılan kategoriler eklenemedi: ${error}`)
    }

    // 5. Orphaned data temizliği
    try {
      // Geçersiz user_id'li transactions'ları temizle
      const cleanupResult = await sql`
        DELETE FROM transactions 
        WHERE user_id IS NOT NULL 
        AND user_id NOT IN (SELECT id::text FROM users)
      `

      if (cleanupResult.count > 0) {
        fixResults.applied.push(`✅ ${cleanupResult.count} sahipsiz transaction temizlendi`)
      }
    } catch (error) {
      fixResults.failed.push(`❌ Orphaned data temizlenemedi: ${error}`)
    }

    console.log("🏁 Otomatik düzeltme tamamlandı")
    console.log(`✅ Başarılı: ${fixResults.applied.length}`)
    console.log(`❌ Başarısız: ${fixResults.failed.length}`)
    console.log(`⏭️ Atlanan: ${fixResults.skipped.length}`)

    return NextResponse.json({
      success: fixResults.failed.length === 0,
      results: fixResults,
      summary: {
        applied: fixResults.applied.length,
        failed: fixResults.failed.length,
        skipped: fixResults.skipped.length,
        fixedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("❌ Otomatik düzeltme başarısız:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Otomatik düzeltme başarısız",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
