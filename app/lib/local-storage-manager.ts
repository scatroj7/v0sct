import { v4 as uuidv4 } from "uuid"

export interface Transaction {
  id: string
  amount: number
  date: string
  description: string
  type: "income" | "expense"
  category_id?: string
  created_at: string
  updated_at: string
  user_id: string // Kullanıcı ID'si eklendi
}

export interface Category {
  id: string
  name: string
  type: "income" | "expense"
  color?: string
  user_id: string // Kullanıcı ID'si eklendi
}

export interface Budget {
  id: string
  category_id: string
  amount: number
  period: "monthly" | "yearly"
  created_at: string
  user_id: string // Kullanıcı ID'si eklendi
}

export interface Investment {
  id: string
  symbol: string
  name: string
  quantity: number
  purchase_price: number
  current_price?: number
  created_at: string
  updated_at: string
  user_id: string // Kullanıcı ID'si eklendi
}

export interface Todo {
  id: string
  title: string
  description: string | null
  due_date: string | null
  completed: boolean
  created_at: string
  updated_at: string
  user_id: string // Kullanıcı ID'si eklendi
}

export interface AppData {
  transactions: Transaction[]
  categories: Category[]
  budgets: Budget[]
  investments: Investment[]
  todos: Todo[]
  settings: {
    currency: string
    theme: "light" | "dark"
    language: string
  }
  metadata: {
    version: string
    lastUpdate: string
    totalTransactions: number
  }
}

class LocalStorageManager {
  private static instance: LocalStorageManager
  private storageKey = "scatrack_data"
  private backupKey = "scatrack_backup"
  private encryptionKey = "scatrack_2024_secure_key"
  private currentUserId: string | null = null
  private currentVersion = "2.1.0" // Versiyon güncellendi

  static getInstance(): LocalStorageManager {
    if (!LocalStorageManager.instance) {
      LocalStorageManager.instance = new LocalStorageManager()
    }
    return LocalStorageManager.instance
  }

  // Aktif kullanıcıyı ayarla
  setCurrentUser(userId: string): void {
    this.currentUserId = userId
  }

  // Aktif kullanıcıyı al
  getCurrentUserId(): string | null {
    return this.currentUserId
  }

  // Kullanıcıya özel storage key
  private getUserStorageKey(): string {
    if (!this.currentUserId) {
      throw new Error("No user set. Call setCurrentUser() first.")
    }
    return `${this.storageKey}_${this.currentUserId}`
  }

  // Veri yükleme (kullanıcıya özel)
  loadData(): AppData {
    try {
      if (typeof window === "undefined" || !this.currentUserId) {
        return this.getDefaultData()
      }

      const userStorageKey = this.getUserStorageKey()
      const encryptedData = localStorage.getItem(userStorageKey)

      if (!encryptedData) {
        // İlk kez giriş yapan kullanıcı için default data oluştur
        const defaultData = this.getDefaultData()
        this.saveData(defaultData)
        return defaultData
      }

      const decryptedData = this.decrypt(encryptedData)
      const data = JSON.parse(decryptedData) as AppData

      // Veri doğrulama
      if (!this.validateData(data)) {
        console.warn("Invalid data structure, using default")
        return this.getDefaultData()
      }

      // Versiyon kontrolü ve otomatik güncelleme
      if (!data.metadata.version || data.metadata.version !== this.currentVersion) {
        console.log("Kategori yapısı güncelleniyor...")
        data.categories = this.getDefaultCategories()
        data.metadata.version = this.currentVersion
        this.saveData(data)
      }

      return data
    } catch (error) {
      console.error("Error loading data:", error)
      return this.getDefaultData()
    }
  }

  // Veri kaydetme (kullanıcıya özel)
  saveData(data: AppData): boolean {
    try {
      if (typeof window === "undefined" || !this.currentUserId) {
        return false
      }

      // Metadata güncelle
      data.metadata = {
        ...data.metadata,
        version: this.currentVersion,
        lastUpdate: new Date().toISOString(),
        totalTransactions: data.transactions.length,
      }

      // Veriyi şifrele ve kullanıcıya özel kaydet
      const userStorageKey = this.getUserStorageKey()
      const encryptedData = this.encrypt(JSON.stringify(data))
      localStorage.setItem(userStorageKey, encryptedData)

      // Backup oluştur
      this.createBackup(data)

      return true
    } catch (error) {
      console.error("Error saving data:", error)
      return false
    }
  }

  // Transaction işlemleri
  addTransaction(transaction: Omit<Transaction, "id" | "created_at" | "updated_at" | "user_id">): Transaction {
    if (!this.currentUserId) {
      throw new Error("No user set")
    }

    const data = this.loadData()
    const newTransaction: Transaction = {
      ...transaction,
      id: uuidv4(),
      user_id: this.currentUserId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    data.transactions.push(newTransaction)
    this.saveData(data)

    return newTransaction
  }

  updateTransaction(id: string, updates: Partial<Transaction>): Transaction | null {
    const data = this.loadData()
    const index = data.transactions.findIndex((t) => t.id === id && t.user_id === this.currentUserId)

    if (index === -1) {
      return null
    }

    data.transactions[index] = {
      ...data.transactions[index],
      ...updates,
      updated_at: new Date().toISOString(),
    }

    this.saveData(data)
    return data.transactions[index]
  }

  deleteTransaction(id: string): boolean {
    const data = this.loadData()
    const initialLength = data.transactions.length
    data.transactions = data.transactions.filter((t) => !(t.id === id && t.user_id === this.currentUserId))

    if (data.transactions.length < initialLength) {
      this.saveData(data)
      return true
    }

    return false
  }

  deleteTransactions(ids: string[]): number {
    const data = this.loadData()
    const initialLength = data.transactions.length
    data.transactions = data.transactions.filter((t) => !(ids.includes(t.id) && t.user_id === this.currentUserId))

    const deletedCount = initialLength - data.transactions.length
    if (deletedCount > 0) {
      this.saveData(data)
    }

    return deletedCount
  }

  getTransactions(filters?: {
    startDate?: string
    endDate?: string
    type?: "income" | "expense"
    categoryId?: string
  }): Transaction[] {
    const data = this.loadData()
    let transactions = data.transactions.filter((t) => t.user_id === this.currentUserId)

    if (filters) {
      if (filters.startDate) {
        transactions = transactions.filter((t) => t.date >= filters.startDate!)
      }
      if (filters.endDate) {
        transactions = transactions.filter((t) => t.date <= filters.endDate!)
      }
      if (filters.type) {
        transactions = transactions.filter((t) => t.type === filters.type)
      }
      if (filters.categoryId) {
        transactions = transactions.filter((t) => t.category_id === filters.categoryId)
      }
    }

    return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  // Category işlemleri
  addCategory(category: Omit<Category, "id" | "user_id">): Category {
    if (!this.currentUserId) {
      throw new Error("No user set")
    }

    const data = this.loadData()
    const newCategory: Category = {
      ...category,
      id: uuidv4(),
      user_id: this.currentUserId,
    }

    data.categories.push(newCategory)
    this.saveData(data)

    return newCategory
  }

  getCategories(type?: "income" | "expense"): Category[] {
    const data = this.loadData()
    const categories = data.categories.filter((c) => c.user_id === this.currentUserId)

    if (type) {
      return categories.filter((c) => c.type === type)
    }
    return categories
  }

  // Investment işlemleri
  addInvestment(investment: Omit<Investment, "id" | "created_at" | "updated_at" | "user_id">): Investment {
    if (!this.currentUserId) {
      throw new Error("No user set")
    }

    const data = this.loadData()
    const newInvestment: Investment = {
      ...investment,
      id: uuidv4(),
      user_id: this.currentUserId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    data.investments.push(newInvestment)
    this.saveData(data)

    return newInvestment
  }

  updateInvestment(id: string, updates: Partial<Investment>): Investment | null {
    const data = this.loadData()
    const index = data.investments.findIndex((i) => i.id === id && i.user_id === this.currentUserId)

    if (index === -1) {
      return null
    }

    data.investments[index] = {
      ...data.investments[index],
      ...updates,
      updated_at: new Date().toISOString(),
    }

    this.saveData(data)
    return data.investments[index]
  }

  deleteInvestment(id: string): boolean {
    const data = this.loadData()
    const initialLength = data.investments.length
    data.investments = data.investments.filter((i) => !(i.id === id && i.user_id === this.currentUserId))

    if (data.investments.length < initialLength) {
      this.saveData(data)
      return true
    }

    return false
  }

  getInvestments(): Investment[] {
    const data = this.loadData()
    return data.investments.filter((i) => i.user_id === this.currentUserId)
  }

  // Budget işlemleri
  addBudget(budget: Omit<Budget, "id" | "created_at" | "user_id">): Budget {
    if (!this.currentUserId) {
      throw new Error("No user set")
    }

    const data = this.loadData()
    const newBudget: Budget = {
      ...budget,
      id: uuidv4(),
      user_id: this.currentUserId,
      created_at: new Date().toISOString(),
    }

    data.budgets.push(newBudget)
    this.saveData(data)

    return newBudget
  }

  getBudgets(): Budget[] {
    const data = this.loadData()
    return data.budgets.filter((b) => b.user_id === this.currentUserId)
  }

  // Todo işlemleri
  addTodo(todo: Omit<Todo, "id" | "created_at" | "updated_at" | "user_id">): Todo {
    if (!this.currentUserId) {
      throw new Error("No user set")
    }

    const data = this.loadData()
    const newTodo: Todo = {
      ...todo,
      id: uuidv4(),
      user_id: this.currentUserId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    data.todos.push(newTodo)
    this.saveData(data)
    return newTodo
  }

  updateTodo(id: string, updates: Partial<Todo>): Todo | null {
    const data = this.loadData()
    const index = data.todos.findIndex((t) => t.id === id && t.user_id === this.currentUserId)

    if (index === -1) {
      return null
    }

    data.todos[index] = {
      ...data.todos[index],
      ...updates,
      updated_at: new Date().toISOString(),
    }

    this.saveData(data)
    return data.todos[index]
  }

  deleteTodo(id: string): boolean {
    const data = this.loadData()
    const initialLength = data.todos.length
    data.todos = data.todos.filter((t) => !(t.id === id && t.user_id === this.currentUserId))

    if (data.todos.length < initialLength) {
      this.saveData(data)
      return true
    }
    return false
  }

  getTodos(): Todo[] {
    const data = this.loadData()
    return data.todos.filter((t) => t.user_id === this.currentUserId)
  }

  // Veri yönetimi
  exportData(): string {
    const data = this.loadData()
    return JSON.stringify(data, null, 2)
  }

  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData) as AppData
      if (!this.validateData(data)) {
        return false
      }

      this.saveData(data)
      return true
    } catch (error) {
      console.error("Error importing data:", error)
      return false
    }
  }

  clearAllData(): boolean {
    try {
      if (typeof window === "undefined" || !this.currentUserId) {
        return false
      }

      const userStorageKey = this.getUserStorageKey()
      localStorage.removeItem(userStorageKey)
      return true
    } catch (error) {
      console.error("Error clearing data:", error)
      return false
    }
  }

  // Backup işlemleri
  private createBackup(data: AppData): void {
    try {
      if (!this.currentUserId) return

      const backupKey = `${this.backupKey}_${this.currentUserId}`
      const backups = this.getBackups()
      const newBackup = {
        id: uuidv4(),
        data,
        timestamp: new Date().toISOString(),
      }

      backups.push(newBackup)

      // Son 5 backup'ı tut
      if (backups.length > 5) {
        backups.splice(0, backups.length - 5)
      }

      const encryptedBackups = this.encrypt(JSON.stringify(backups))
      localStorage.setItem(backupKey, encryptedBackups)
    } catch (error) {
      console.error("Error creating backup:", error)
    }
  }

  getBackups(): Array<{ id: string; data: AppData; timestamp: string }> {
    try {
      if (typeof window === "undefined" || !this.currentUserId) {
        return []
      }

      const backupKey = `${this.backupKey}_${this.currentUserId}`
      const encryptedBackups = localStorage.getItem(backupKey)
      if (!encryptedBackups) {
        return []
      }

      const decryptedBackups = this.decrypt(encryptedBackups)
      return JSON.parse(decryptedBackups)
    } catch (error) {
      console.error("Error loading backups:", error)
      return []
    }
  }

  restoreBackup(backupId: string): boolean {
    try {
      const backups = this.getBackups()
      const backup = backups.find((b) => b.id === backupId)

      if (!backup) {
        return false
      }

      this.saveData(backup.data)
      return true
    } catch (error) {
      console.error("Error restoring backup:", error)
      return false
    }
  }

  // Standart kategorileri al
  private getDefaultCategories(): Category[] {
    if (!this.currentUserId) {
      throw new Error("No user set")
    }

    return [
      // GELİR KATEGORİLERİ
      { id: "income-1", name: "Maaş", type: "income", color: "#10b981", user_id: this.currentUserId },
      { id: "income-2", name: "Prim/Bonus", type: "income", color: "#059669", user_id: this.currentUserId },
      { id: "income-3", name: "Yan Gelir", type: "income", color: "#34d399", user_id: this.currentUserId },
      { id: "income-4", name: "Yatırım Geliri", type: "income", color: "#6ee7b7", user_id: this.currentUserId },
      { id: "income-5", name: "Diğer Gelir", type: "income", color: "#047857", user_id: this.currentUserId },

      // GİDER KATEGORİLERİ
      { id: "expense-1", name: "Konut", type: "expense", color: "#ef4444", user_id: this.currentUserId },
      { id: "expense-2", name: "Faturalar", type: "expense", color: "#dc2626", user_id: this.currentUserId },
      { id: "expense-3", name: "Gıda", type: "expense", color: "#f97316", user_id: this.currentUserId },
      { id: "expense-4", name: "Ulaşım", type: "expense", color: "#eab308", user_id: this.currentUserId },
      { id: "expense-5", name: "Sağlık", type: "expense", color: "#22c55e", user_id: this.currentUserId },
      { id: "expense-6", name: "Giyim", type: "expense", color: "#06b6d4", user_id: this.currentUserId },
      { id: "expense-7", name: "Abonelikler", type: "expense", color: "#8b5cf6", user_id: this.currentUserId },
      { id: "expense-8", name: "Eğlence", type: "expense", color: "#ec4899", user_id: this.currentUserId },
      { id: "expense-9", name: "Düğün", type: "expense", color: "#fbbf24", user_id: this.currentUserId },
      { id: "expense-10", name: "Nişan", type: "expense", color: "#fde047", user_id: this.currentUserId },
      { id: "expense-11", name: "Ödemeler", type: "expense", color: "#6b7280", user_id: this.currentUserId },
      { id: "expense-12", name: "Ev Eşyaları", type: "expense", color: "#92400e", user_id: this.currentUserId },
      { id: "expense-13", name: "Eğitim", type: "expense", color: "#0f766e", user_id: this.currentUserId },
      { id: "expense-14", name: "Kredi", type: "expense", color: "#b91c1c", user_id: this.currentUserId },
      { id: "expense-15", name: "Diğer", type: "expense", color: "#525252", user_id: this.currentUserId },
    ]
  }

  // Yardımcı metodlar
  private getDefaultData(): AppData {
    if (!this.currentUserId) {
      throw new Error("No user set")
    }

    return {
      transactions: [],
      categories: this.getDefaultCategories(),
      budgets: [],
      investments: [],
      todos: [],
      settings: {
        currency: "TRY",
        theme: "light",
        language: "tr",
      },
      metadata: {
        version: this.currentVersion,
        lastUpdate: new Date().toISOString(),
        totalTransactions: 0,
      },
    }
  }

  private validateData(data: any): data is AppData {
    return (
      data &&
      Array.isArray(data.transactions) &&
      Array.isArray(data.categories) &&
      Array.isArray(data.budgets) &&
      Array.isArray(data.investments) &&
      data.todos &&
      data.settings &&
      data.metadata
    )
  }

  private encrypt(data: string): string {
    try {
      // UTF-8 karakterleri güvenli hale getir
      const utf8Data = encodeURIComponent(data)

      // Basit XOR şifreleme
      let encrypted = ""
      for (let i = 0; i < utf8Data.length; i++) {
        encrypted += String.fromCharCode(
          utf8Data.charCodeAt(i) ^ this.encryptionKey.charCodeAt(i % this.encryptionKey.length),
        )
      }
      return btoa(encrypted)
    } catch (error) {
      console.error("Encryption error:", error)
      // Şifreleme başarısız olursa, veriyi olduğu gibi döndür
      return btoa(encodeURIComponent(data))
    }
  }

  private decrypt(encryptedData: string): string {
    try {
      const data = atob(encryptedData)
      let decrypted = ""
      for (let i = 0; i < data.length; i++) {
        decrypted += String.fromCharCode(
          data.charCodeAt(i) ^ this.encryptionKey.charCodeAt(i % this.encryptionKey.length),
        )
      }
      // UTF-8 karakterleri geri çevir
      return decodeURIComponent(decrypted)
    } catch (error) {
      console.error("Decryption error:", error)
      // Şifre çözme başarısız olursa, veriyi olduğu gibi çöz
      try {
        return decodeURIComponent(atob(encryptedData))
      } catch (fallbackError) {
        console.error("Fallback decryption error:", fallbackError)
        return "{}"
      }
    }
  }

  // İstatistikler
  getStats(): {
    totalIncome: number
    totalExpense: number
    balance: number
    transactionCount: number
    categoryCount: number
    investmentValue: number
  } {
    const data = this.loadData()

    const userTransactions = data.transactions.filter((t) => t.user_id === this.currentUserId)
    const userCategories = data.categories.filter((c) => c.user_id === this.currentUserId)
    const userInvestments = data.investments.filter((i) => i.user_id === this.currentUserId)

    const totalIncome = userTransactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)
    const totalExpense = userTransactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)
    const investmentValue = userInvestments.reduce(
      (sum, i) => sum + i.quantity * (i.current_price || i.purchase_price),
      0,
    )

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      transactionCount: userTransactions.length,
      categoryCount: userCategories.length,
      investmentValue,
    }
  }
}

export const localStorageManager = LocalStorageManager.getInstance()
