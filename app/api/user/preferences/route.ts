import { type NextRequest, NextResponse } from "next/server"
import { getSecureUserId } from "@/app/lib/auth-secure"
import { sql } from "@/app/lib/db-server"

export async function GET() {
  try {
    const userId = await getSecureUserId()
    if (!userId) {
      return NextResponse.json({ error: "Oturum bulunamadı" }, { status: 401 })
    }

    const result = await sql`
      SELECT storage_mode, auto_sync, encrypt_local, sync_interval, offline_mode
      FROM user_preferences 
      WHERE user_id = ${userId}
    `

    if (result.length === 0) {
      // Varsayılan tercihler
      return NextResponse.json({
        storageMode: "hybrid",
        autoSync: true,
        encryptLocal: true,
        syncInterval: 5,
        offlineMode: false,
      })
    }

    return NextResponse.json({
      storageMode: result[0].storage_mode,
      autoSync: result[0].auto_sync,
      encryptLocal: result[0].encrypt_local,
      syncInterval: result[0].sync_interval,
      offlineMode: result[0].offline_mode,
    })
  } catch (error) {
    console.error("Error getting preferences:", error)
    return NextResponse.json({ error: "Tercihler alınamadı" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getSecureUserId()
    if (!userId) {
      return NextResponse.json({ error: "Oturum bulunamadı" }, { status: 401 })
    }

    const { storageMode, autoSync, encryptLocal, syncInterval, offlineMode } = await request.json()

    await sql`
      INSERT INTO user_preferences (
        user_id, storage_mode, auto_sync, encrypt_local, sync_interval, offline_mode
      )
      VALUES (${userId}, ${storageMode}, ${autoSync}, ${encryptLocal}, ${syncInterval}, ${offlineMode})
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        storage_mode = EXCLUDED.storage_mode,
        auto_sync = EXCLUDED.auto_sync,
        encrypt_local = EXCLUDED.encrypt_local,
        sync_interval = EXCLUDED.sync_interval,
        offline_mode = EXCLUDED.offline_mode,
        updated_at = NOW()
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving preferences:", error)
    return NextResponse.json({ error: "Tercihler kaydedilemedi" }, { status: 500 })
  }
}
