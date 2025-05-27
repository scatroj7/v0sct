import { NextResponse } from "next/server"
import { sql } from "@/app/lib/db-server"

export async function GET() {
  try {
    console.log("🔍 Veritabanı sağlık kontrolü başlatılıyor...")

    const healthReport = {
      connection: false,
      tables: {},
      relationships: {},
      data: {},
      security: {},
      issues: [] as string[],
      recommendations: [] as string[],
    }

    // 1. Bağlantı testi
    try {
      await sql`SELECT NOW() as current_time`
      healthReport.connection = true
      console.log("✅ Veritabanı bağlantısı başarılı")
    } catch (error) {
      healthReport.issues.push("❌ Veritabanı bağlantısı başarısız")
      return NextResponse.json(healthReport, { status: 500 })
    }

    // 2. Tablo varlık kontrolü
    const requiredTables = [
      "users",
      "transactions",
      "categories",
      "user_preferences",
      "user_data_backup",
      "login_attempts",
      "sync_conflicts",
    ]

    for (const tableName of requiredTables) {
      try {
        const tableExists = await sql`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = ${tableName}
          );
        `

        healthReport.tables[tableName] = {
          exists: tableExists[0]?.exists || false,
          rowCount: 0,
          structure: [],
        }

        if (tableExists[0]?.exists) {
          // Satır sayısını al
          const countResult = await sql`SELECT COUNT(*) as count FROM ${sql(tableName)}`
          healthReport.tables[tableName].rowCount = Number.parseInt(countResult[0]?.count || "0")

          // Tablo yapısını al
          const structure = await sql`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = ${tableName}
            ORDER BY ordinal_position;
          `
          healthReport.tables[tableName].structure = structure

          console.log(`✅ ${tableName} tablosu mevcut (${healthReport.tables[tableName].rowCount} satır)`)
        } else {
          healthReport.issues.push(`❌ ${tableName} tablosu bulunamadı`)
          console.log(`❌ ${tableName} tablosu bulunamadı`)
        }
      } catch (error) {
        healthReport.issues.push(`❌ ${tableName} tablosu kontrol edilemedi: ${error}`)
        console.error(`❌ ${tableName} tablosu kontrol hatası:`, error)
      }
    }

    // 3. İlişki kontrolü (Foreign Keys)
    try {
      const foreignKeys = await sql`
        SELECT
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name,
          tc.constraint_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public';
      `

      healthReport.relationships = {
        foreignKeys: foreignKeys,
        count: foreignKeys.length,
      }

      console.log(`✅ ${foreignKeys.length} foreign key ilişkisi bulundu`)
    } catch (error) {
      healthReport.issues.push(`❌ İlişki kontrolü başarısız: ${error}`)
    }

    // 4. Veri tutarlılığı kontrolü
    try {
      // Orphaned transactions kontrolü
      if (healthReport.tables.transactions?.exists && healthReport.tables.users?.exists) {
        const orphanedTransactions = await sql`
          SELECT COUNT(*) as count
          FROM transactions t
          LEFT JOIN users u ON t.user_id = u.id::text
          WHERE u.id IS NULL AND t.user_id IS NOT NULL
        `

        const orphanCount = Number.parseInt(orphanedTransactions[0]?.count || "0")
        if (orphanCount > 0) {
          healthReport.issues.push(`❌ ${orphanCount} adet sahipsiz transaction bulundu`)
        } else {
          console.log("✅ Tüm transactions geçerli user_id'ye sahip")
        }
      }

      // Invalid category_id kontrolü
      if (healthReport.tables.transactions?.exists && healthReport.tables.categories?.exists) {
        const invalidCategories = await sql`
          SELECT COUNT(*) as count
          FROM transactions t
          LEFT JOIN categories c ON t.category_id = c.id
          WHERE c.id IS NULL AND t.category_id IS NOT NULL
        `

        const invalidCount = Number.parseInt(invalidCategories[0]?.count || "0")
        if (invalidCount > 0) {
          healthReport.issues.push(`❌ ${invalidCount} adet geçersiz category_id bulundu`)
        } else {
          console.log("✅ Tüm transactions geçerli category_id'ye sahip")
        }
      }
    } catch (error) {
      healthReport.issues.push(`❌ Veri tutarlılığı kontrolü başarısız: ${error}`)
    }

    // 5. Güvenlik kontrolü
    try {
      // Password hash kontrolü
      if (healthReport.tables.users?.exists) {
        const weakPasswords = await sql`
          SELECT COUNT(*) as count
          FROM users 
          WHERE password_hash IS NULL 
          OR LENGTH(password_hash) < 10
        `

        const weakCount = Number.parseInt(weakPasswords[0]?.count || "0")
        if (weakCount > 0) {
          healthReport.issues.push(`❌ ${weakCount} adet zayıf/eksik şifre bulundu`)
        }
      }

      // Email validation kontrolü
      if (healthReport.tables.users?.exists) {
        const invalidEmails = await sql`
          SELECT COUNT(*) as count
          FROM users 
          WHERE email IS NULL 
          OR email NOT LIKE '%@%'
          OR email NOT LIKE '%.%'
        `

        const invalidEmailCount = Number.parseInt(invalidEmails[0]?.count || "0")
        if (invalidEmailCount > 0) {
          healthReport.issues.push(`❌ ${invalidEmailCount} adet geçersiz email bulundu`)
        }
      }
    } catch (error) {
      healthReport.issues.push(`❌ Güvenlik kontrolü başarısız: ${error}`)
    }

    // 6. Performans kontrolü
    try {
      // Index kontrolü
      const indexes = await sql`
        SELECT 
          schemaname,
          tablename,
          indexname,
          indexdef
        FROM pg_indexes 
        WHERE schemaname = 'public'
        ORDER BY tablename, indexname;
      `

      healthReport.data.indexes = indexes
      console.log(`✅ ${indexes.length} index bulundu`)

      // Önerilen indexler
      const recommendedIndexes = [
        "idx_users_email",
        "idx_transactions_user_id",
        "idx_transactions_date",
        "idx_login_attempts_email",
      ]

      const existingIndexNames = indexes.map((idx) => idx.indexname)
      recommendedIndexes.forEach((recIndex) => {
        if (!existingIndexNames.includes(recIndex)) {
          healthReport.recommendations.push(`📈 ${recIndex} indexi eklenmeli`)
        }
      })
    } catch (error) {
      healthReport.issues.push(`❌ Performans kontrolü başarısız: ${error}`)
    }

    // 7. Genel öneriler
    if (healthReport.issues.length === 0) {
      healthReport.recommendations.push("🎉 Veritabanı sağlıklı görünüyor!")
    }

    if (healthReport.tables.users?.rowCount === 0) {
      healthReport.recommendations.push("👤 Test kullanıcısı oluşturulabilir")
    }

    if (healthReport.tables.categories?.rowCount === 0) {
      healthReport.recommendations.push("📂 Varsayılan kategoriler eklenebilir")
    }

    // Sonuç
    const isHealthy = healthReport.issues.length === 0
    const status = isHealthy ? 200 : 422

    console.log(`🏁 Veritabanı kontrolü tamamlandı. Durum: ${isHealthy ? "SAĞLIKLI" : "SORUNLU"}`)
    console.log(`📊 Sorun sayısı: ${healthReport.issues.length}`)
    console.log(`💡 Öneri sayısı: ${healthReport.recommendations.length}`)

    return NextResponse.json(
      {
        ...healthReport,
        summary: {
          healthy: isHealthy,
          totalIssues: healthReport.issues.length,
          totalRecommendations: healthReport.recommendations.length,
          checkedAt: new Date().toISOString(),
        },
      },
      { status },
    )
  } catch (error) {
    console.error("❌ Veritabanı sağlık kontrolü başarısız:", error)
    return NextResponse.json(
      {
        connection: false,
        error: "Veritabanı sağlık kontrolü başarısız",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
