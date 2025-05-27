import { sql } from "./db-server"
import { getSecureUserId } from "./auth-secure"

export type StorageMode = "local" | "cloud" | "hybrid"

export interface DataSyncStatus {
  lastLocalUpdate: Date | null
  lastCloudUpdate: Date | null
  pendingSync: boolean
  conflictResolution: "local" | "cloud" | "manual"
}

export interface UserPreferences {
  storageMode: StorageMode
  autoSync: boolean
  encryptLocal: boolean
  syncInterval: number // dakika
  offlineMode: boolean
}

// Ana hibrit veri yöneticisi
export class HybridDataManager {
  private static instance: HybridDataManager
  private localManager: LocalDataManager
  private cloudManager: CloudDataManager
  private syncManager: SyncManager

  constructor() {
    this.localManager = new LocalDataManager()
    this.cloudManager = new CloudDataManager()
    this.syncManager = new SyncManager(this.localManager, this.cloudManager)
  }

  static getInstance(): HybridDataManager {
    if (!HybridDataManager.instance) {
      HybridDataManager.instance = new HybridDataManager()
    }
    return HybridDataManager.instance
  }

  // Kullanıcı tercihlerini al
  async getUserPreferences(userId?: string): Promise<UserPreferences> {
    try {
      const currentUserId = userId || (await getSecureUserId())
      if (!currentUserId) {
        return this.getDefaultPreferences()
      }

      const result = await sql`
        SELECT storage_mode, auto_sync, encrypt_local, sync_interval, offline_mode
        FROM user_preferences 
        WHERE user_id = ${currentUserId}
      `

      if (result.length === 0) {
        return this.getDefaultPreferences()
      }

      return {
        storageMode: result[0].storage_mode as StorageMode,
        autoSync: result[0].auto_sync,
        encryptLocal: result[0].encrypt_local,
        syncInterval: result[0].sync_interval || 5,
        offlineMode: result[0].offline_mode || false,
      }
    } catch (error) {
      console.error("Error getting user preferences:", error)
      return this.getDefaultPreferences()
    }
  }

  private getDefaultPreferences(): UserPreferences {
    return {
      storageMode: "hybrid",
      autoSync: true,
      encryptLocal: true,
      syncInterval: 5,
      offlineMode: false,
    }
  }

  // Veri kaydetme (hibrit)
  async saveData(data: any, userId?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const preferences = await this.getUserPreferences(userId)
      const results = { local: false, cloud: false }

      // Storage mode'a göre kaydetme
      switch (preferences.storageMode) {
        case "local":
          results.local = await this.localManager.saveData(data)
          break

        case "cloud":
          if (userId) {
            results.cloud = await this.cloudManager.saveData(data, userId)
          } else {
            return { success: false, error: "Cloud storage için kullanıcı girişi gerekli" }
          }
          break

        case "hybrid":
          results.local = await this.localManager.saveData(data)
          if (userId && !preferences.offlineMode) {
            results.cloud = await this.cloudManager.saveData(data, userId)
          }
          break
      }

      // Başarı kontrolü
      const success =
        preferences.storageMode === "local"
          ? results.local
          : preferences.storageMode === "cloud"
            ? results.cloud
            : results.local || results.cloud

      return { success }
    } catch (error) {
      console.error("Error saving data:", error)
      return { success: false, error: "Veri kaydetme hatası" }
    }
  }

  // Veri yükleme (hibrit)
  async loadData(userId?: string): Promise<{ data: any; source: "local" | "cloud" | "merged" }> {
    try {
      const preferences = await this.getUserPreferences(userId)

      switch (preferences.storageMode) {
        case "local":
          const localData = await this.localManager.loadData()
          return { data: localData, source: "local" }

        case "cloud":
          if (!userId) {
            throw new Error("Cloud storage için kullanıcı girişi gerekli")
          }
          const cloudData = await this.cloudManager.loadData(userId)
          return { data: cloudData, source: "cloud" }

        case "hybrid":
          return await this.syncManager.getMergedData(userId)

        default:
          return { data: null, source: "local" }
      }
    } catch (error) {
      console.error("Error loading data:", error)
      // Hata durumunda local'den yükle
      const localData = await this.localManager.loadData()
      return { data: localData, source: "local" }
    }
  }

  // Senkronizasyon durumunu kontrol et
  async getSyncStatus(userId?: string): Promise<DataSyncStatus> {
    return await this.syncManager.getSyncStatus(userId)
  }

  // Manuel senkronizasyon
  async manualSync(userId?: string): Promise<{ success: boolean; conflicts?: any[] }> {
    return await this.syncManager.performSync(userId)
  }

  // Veri temizleme
  async clearData(mode: "local" | "cloud" | "both", userId?: string): Promise<boolean> {
    try {
      let success = true

      if (mode === "local" || mode === "both") {
        success = success && (await this.localManager.clearData())
      }

      if ((mode === "cloud" || mode === "both") && userId) {
        success = success && (await this.cloudManager.clearData(userId))
      }

      return success
    } catch (error) {
      console.error("Error clearing data:", error)
      return false
    }
  }
}

// Local veri yöneticisi
class LocalDataManager {
  private storageKey = "scatrack_data"
  private metaKey = "scatrack_meta"

  async saveData(data: any): Promise<boolean> {
    try {
      if (typeof window === "undefined") return false

      const metadata = {
        lastUpdate: new Date().toISOString(),
        version: "1.0",
        checksum: this.generateChecksum(data),
      }

      // Veriyi şifrele
      const encryptedData = this.encryptData(JSON.stringify(data))
      const encryptedMeta = this.encryptData(JSON.stringify(metadata))

      localStorage.setItem(this.storageKey, encryptedData)
      localStorage.setItem(this.metaKey, encryptedMeta)

      return true
    } catch (error) {
      console.error("Error saving to local storage:", error)
      return false
    }
  }

  async loadData(): Promise<any | null> {
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

  async getMetadata(): Promise<any | null> {
    try {
      if (typeof window === "undefined") return null

      const encryptedMeta = localStorage.getItem(this.metaKey)
      if (!encryptedMeta) return null

      const decryptedMeta = this.decryptData(encryptedMeta)
      return JSON.parse(decryptedMeta)
    } catch (error) {
      console.error("Error loading metadata:", error)
      return null
    }
  }

  async clearData(): Promise<boolean> {
    try {
      if (typeof window === "undefined") return false

      localStorage.removeItem(this.storageKey)
      localStorage.removeItem(this.metaKey)
      return true
    } catch (error) {
      console.error("Error clearing local storage:", error)
      return false
    }
  }

  private encryptData(data: string): string {
    // Basit XOR şifreleme (production'da AES kullanılacak)
    const key = "scatrack_local_key_2024"
    let encrypted = ""

    for (let i = 0; i < data.length; i++) {
      encrypted += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length))
    }

    return btoa(encrypted)
  }

  private decryptData(encryptedData: string): string {
    const key = "scatrack_local_key_2024"
    const data = atob(encryptedData)
    let decrypted = ""

    for (let i = 0; i < data.length; i++) {
      decrypted += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length))
    }

    return decrypted
  }

  private generateChecksum(data: any): string {
    // Basit checksum (production'da SHA-256 kullanılacak)
    const str = JSON.stringify(data)
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // 32bit integer'a dönüştür
    }
    return hash.toString()
  }
}

// Cloud veri yöneticisi
class CloudDataManager {
  async saveData(data: any, userId: string): Promise<boolean> {
    try {
      const metadata = {
        lastUpdate: new Date().toISOString(),
        version: "1.0",
        dataSize: JSON.stringify(data).length,
      }

      await sql`
        INSERT INTO user_data_backup (user_id, data, metadata, created_at, updated_at)
        VALUES (${userId}, ${JSON.stringify(data)}, ${JSON.stringify(metadata)}, NOW(), NOW())
        ON CONFLICT (user_id)
        DO UPDATE SET 
          data = EXCLUDED.data,
          metadata = EXCLUDED.metadata,
          updated_at = NOW()
      `

      return true
    } catch (error) {
      console.error("Error saving to cloud:", error)
      return false
    }
  }

  async loadData(userId: string): Promise<any | null> {
    try {
      const result = await sql`
        SELECT data, metadata, updated_at 
        FROM user_data_backup 
        WHERE user_id = ${userId}
      `

      if (result.length === 0) return null

      return JSON.parse(result[0].data)
    } catch (error) {
      console.error("Error loading from cloud:", error)
      return null
    }
  }

  async getMetadata(userId: string): Promise<any | null> {
    try {
      const result = await sql`
        SELECT metadata, updated_at 
        FROM user_data_backup 
        WHERE user_id = ${userId}
      `

      if (result.length === 0) return null

      return {
        ...JSON.parse(result[0].metadata),
        cloudUpdate: result[0].updated_at,
      }
    } catch (error) {
      console.error("Error loading cloud metadata:", error)
      return null
    }
  }

  async clearData(userId: string): Promise<boolean> {
    try {
      await sql`
        DELETE FROM user_data_backup 
        WHERE user_id = ${userId}
      `
      return true
    } catch (error) {
      console.error("Error clearing cloud data:", error)
      return false
    }
  }
}

// Senkronizasyon yöneticisi
class SyncManager {
  constructor(
    private localManager: LocalDataManager,
    private cloudManager: CloudDataManager,
  ) {}

  async getMergedData(userId?: string): Promise<{ data: any; source: "local" | "cloud" | "merged" }> {
    try {
      const localData = await this.localManager.loadData()
      const cloudData = userId ? await this.cloudManager.loadData(userId) : null

      if (!localData && !cloudData) {
        return { data: null, source: "local" }
      }

      if (!localData) {
        return { data: cloudData, source: "cloud" }
      }

      if (!cloudData) {
        return { data: localData, source: "local" }
      }

      // Her ikisi de varsa, en güncel olanı kullan
      const localMeta = await this.localManager.getMetadata()
      const cloudMeta = userId ? await this.cloudManager.getMetadata(userId) : null

      if (!localMeta || !cloudMeta) {
        return { data: localData, source: "local" }
      }

      const localTime = new Date(localMeta.lastUpdate).getTime()
      const cloudTime = new Date(cloudMeta.lastUpdate).getTime()

      if (localTime > cloudTime) {
        return { data: localData, source: "local" }
      } else {
        return { data: cloudData, source: "cloud" }
      }
    } catch (error) {
      console.error("Error merging data:", error)
      const localData = await this.localManager.loadData()
      return { data: localData, source: "local" }
    }
  }

  async getSyncStatus(userId?: string): Promise<DataSyncStatus> {
    try {
      const localMeta = await this.localManager.getMetadata()
      const cloudMeta = userId ? await this.cloudManager.getMetadata(userId) : null

      return {
        lastLocalUpdate: localMeta ? new Date(localMeta.lastUpdate) : null,
        lastCloudUpdate: cloudMeta ? new Date(cloudMeta.lastUpdate) : null,
        pendingSync: this.hasPendingSync(localMeta, cloudMeta),
        conflictResolution: "local", // Varsayılan
      }
    } catch (error) {
      console.error("Error getting sync status:", error)
      return {
        lastLocalUpdate: null,
        lastCloudUpdate: null,
        pendingSync: false,
        conflictResolution: "local",
      }
    }
  }

  async performSync(userId?: string): Promise<{ success: boolean; conflicts?: any[] }> {
    try {
      if (!userId) {
        return { success: false }
      }

      const localData = await this.localManager.loadData()
      const cloudData = await this.cloudManager.loadData(userId)

      // Conflict detection
      const conflicts = this.detectConflicts(localData, cloudData)

      if (conflicts.length > 0) {
        return { success: false, conflicts }
      }

      // Merge data
      const mergedData = this.mergeData(localData, cloudData)

      // Save to both
      const localSave = await this.localManager.saveData(mergedData)
      const cloudSave = await this.cloudManager.saveData(mergedData, userId)

      return { success: localSave && cloudSave }
    } catch (error) {
      console.error("Error performing sync:", error)
      return { success: false }
    }
  }

  private hasPendingSync(localMeta: any, cloudMeta: any): boolean {
    if (!localMeta || !cloudMeta) return false

    const localTime = new Date(localMeta.lastUpdate).getTime()
    const cloudTime = new Date(cloudMeta.lastUpdate).getTime()

    // 5 dakikadan fazla fark varsa pending sync var
    return Math.abs(localTime - cloudTime) > 5 * 60 * 1000
  }

  private detectConflicts(localData: any, cloudData: any): any[] {
    // Basit conflict detection
    // Production'da daha sofistike olacak
    const conflicts: any[] = []

    if (localData && cloudData) {
      // Aynı ID'li farklı veriler varsa conflict
      const localTransactions = localData.transactions || []
      const cloudTransactions = cloudData.transactions || []

      localTransactions.forEach((localTx: any) => {
        const cloudTx = cloudTransactions.find((ctx: any) => ctx.id === localTx.id)
        if (cloudTx && JSON.stringify(localTx) !== JSON.stringify(cloudTx)) {
          conflicts.push({
            type: "transaction",
            id: localTx.id,
            local: localTx,
            cloud: cloudTx,
          })
        }
      })
    }

    return conflicts
  }

  private mergeData(localData: any, cloudData: any): any {
    if (!localData) return cloudData
    if (!cloudData) return localData

    // Basit merge stratejisi - en güncel veriyi al
    const merged = { ...localData }

    // Transactions'ları merge et
    if (cloudData.transactions) {
      const localTxMap = new Map()
      if (merged.transactions) {
        merged.transactions.forEach((tx: any) => localTxMap.set(tx.id, tx))
      }

      cloudData.transactions.forEach((cloudTx: any) => {
        const localTx = localTxMap.get(cloudTx.id)
        if (!localTx || new Date(cloudTx.updated_at) > new Date(localTx.updated_at)) {
          localTxMap.set(cloudTx.id, cloudTx)
        }
      })

      merged.transactions = Array.from(localTxMap.values())
    }

    return merged
  }
}

// Export ana manager
export const hybridDataManager = HybridDataManager.getInstance()
