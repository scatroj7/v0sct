import { sql } from "./db-server"

export type StorageMode = "local" | "cloud" | "hybrid"

export interface UserPreferences {
  storageMode: StorageMode
  autoSync: boolean
  encryptLocal: boolean
}

// Kullanıcı tercihlerini al
export async function getUserPreferences(userId: string): Promise<UserPreferences> {
  try {
    const result = await sql`
      SELECT storage_mode, auto_sync, encrypt_local 
      FROM user_preferences 
      WHERE user_id = ${userId}
    `

    if (result.length === 0) {
      // Varsayılan tercihler
      return {
        storageMode: "hybrid",
        autoSync: true,
        encryptLocal: true,
      }
    }

    return {
      storageMode: result[0].storage_mode as StorageMode,
      autoSync: result[0].auto_sync,
      encryptLocal: result[0].encrypt_local,
    }
  } catch (error) {
    console.error("Error getting user preferences:", error)
    return {
      storageMode: "hybrid",
      autoSync: true,
      encryptLocal: true,
    }
  }
}

// Kullanıcı tercihlerini güncelle
export async function updateUserPreferences(userId: string, preferences: UserPreferences): Promise<boolean> {
  try {
    await sql`
      INSERT INTO user_preferences (user_id, storage_mode, auto_sync, encrypt_local)
      VALUES (${userId}, ${preferences.storageMode}, ${preferences.autoSync}, ${preferences.encryptLocal})
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        storage_mode = EXCLUDED.storage_mode,
        auto_sync = EXCLUDED.auto_sync,
        encrypt_local = EXCLUDED.encrypt_local,
        updated_at = NOW()
    `
    return true
  } catch (error) {
    console.error("Error updating user preferences:", error)
    return false
  }
}

// Local storage yönetimi (mobil için)
export class LocalDataManager {
  private static instance: LocalDataManager
  private storageKey = "scatrack_data"

  static getInstance(): LocalDataManager {
    if (!LocalDataManager.instance) {
      LocalDataManager.instance = new LocalDataManager()
    }
    return LocalDataManager.instance
  }

  // Local'e veri kaydet
  async saveToLocal(data: any): Promise<boolean> {
    try {
      if (typeof window === "undefined") return false

      const encryptedData = this.encryptData(JSON.stringify(data))
      localStorage.setItem(this.storageKey, encryptedData)
      return true
    } catch (error) {
      console.error("Error saving to local storage:", error)
      return false
    }
  }

  // Local'den veri oku
  async loadFromLocal(): Promise<any | null> {
    try {
      if (typeof window === "undefined") return null

      const encryptedData = localStorage.getItem(this.storageKey)
      if (!encryptedData) return null

      const decryptedData = this.decryptData(encryptedData)
      return JSON.parse(decryptedData)
    } catch (error) {
      console.error("Error loading from local storage:", error)
      return null
    }
  }

  // Local veriyi temizle
  async clearLocal(): Promise<void> {
    try {
      if (typeof window === "undefined") return
      localStorage.removeItem(this.storageKey)
    } catch (error) {
      console.error("Error clearing local storage:", error)
    }
  }

  // Basit şifreleme (mobil için daha güçlü olacak)
  private encryptData(data: string): string {
    // Basit XOR şifreleme (production'da daha güçlü olacak)
    const key = "scatrack_secret_key"
    let encrypted = ""

    for (let i = 0; i < data.length; i++) {
      encrypted += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length))
    }

    return btoa(encrypted)
  }

  private decryptData(encryptedData: string): string {
    const key = "scatrack_secret_key"
    const data = atob(encryptedData)
    let decrypted = ""

    for (let i = 0; i < data.length; i++) {
      decrypted += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length))
    }

    return decrypted
  }
}

// Cloud sync yönetimi
export class CloudSyncManager {
  // Cloud'a veri senkronize et
  async syncToCloud(userId: string, data: any): Promise<boolean> {
    try {
      await sql`
        INSERT INTO user_data_backup (user_id, data, created_at)
        VALUES (${userId}, ${JSON.stringify(data)}, NOW())
        ON CONFLICT (user_id)
        DO UPDATE SET 
          data = EXCLUDED.data,
          updated_at = NOW()
      `
      return true
    } catch (error) {
      console.error("Error syncing to cloud:", error)
      return false
    }
  }

  // Cloud'dan veri al
  async loadFromCloud(userId: string): Promise<any | null> {
    try {
      const result = await sql`
        SELECT data FROM user_data_backup 
        WHERE user_id = ${userId}
      `

      if (result.length === 0) return null

      return JSON.parse(result[0].data)
    } catch (error) {
      console.error("Error loading from cloud:", error)
      return null
    }
  }

  // Otomatik senkronizasyon
  async autoSync(userId: string): Promise<void> {
    try {
      const preferences = await getUserPreferences(userId)

      if (!preferences.autoSync) return

      // Local ve cloud verilerini karşılaştır
      const localManager = LocalDataManager.getInstance()
      const localData = await localManager.loadFromLocal()
      const cloudData = await this.loadFromCloud(userId)

      // Conflict resolution logic burada olacak
      // Şimdilik en son güncellenen veriyi kullan
    } catch (error) {
      console.error("Auto sync error:", error)
    }
  }
}
