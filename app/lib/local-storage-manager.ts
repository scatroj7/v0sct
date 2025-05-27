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
}

export interface Category {
  id: string
  name: string
  type: "income" | "expense"
  color?: string
}

export interface Budget {
  id: string
  category_id: string
  amount: number
  period: "monthly" | "yearly"
  created_at: string
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
}

export interface Todo {
  id: string
  title: string
  description: string | null
  due_date: string | null
  completed: boolean
  created_at: string
  updated_at: string
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

  static getInstance(): LocalStorageManager {
    if (!LocalStorageManager.instance) {
      LocalStorageManager.instance = new LocalStorageManager()
    }
    return LocalStorageManager.instance
  }

  // Veri yükleme
  loadData(): AppData {
    try {
      if (typeof window === "undefined") {
        return this.getDefaultData()
      }

      const encryptedData = localStorage.getItem(this.storageKey)
      if (!encryptedData) {
        return this.getDefaultData()
      }

      const decryptedData = this.decrypt(encryptedData)
      const data = JSON.parse(decryptedData) as AppData

      // Veri doğrulama
      if (!this.validateData(data)) {
        console.warn("Invalid data structure, using default")
        return this.getDefaultData()
      }

      return data
    } catch (error) {
      console.error("Error loading data:", error)
      return this.getDefaultData()
    }
  }

  // Veri kaydetme
  saveData(data: AppData): boolean {
    try {
      if (typeof window === "undefined") {
        return false
      }

      // Metadata güncelle
      data.metadata = {
        ...data.metadata,
        lastUpdate: new Date().toISOString(),
        totalTransactions: data.transactions.length,
      }

      // Veriyi şifrele ve kaydet
      const encryptedData = this.encrypt(JSON.stringify(data))
      localStorage.setItem(this.storageKey, encryptedData)

      // Backup oluştur
      this.createBackup(data)

      return true
    } catch (error) {
      console.error("Error saving data:", error)
      return false
    }
  }

  // Transaction işlemleri
  addTransaction(transaction: Omit<Transaction, "id" | "created_at" | "updated_at">): Transaction {
    const data = this.loadData()
    const newTransaction: Transaction = {
      ...transaction,
      id: uuidv4(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    data.transactions.push(newTransaction)
    this.saveData(data)

    return newTransaction
  }

  updateTransaction(id: string, updates: Partial<Transaction>): Transaction | null {
    const data = this.loadData()
    const index = data.transactions.findIndex((t) => t.id === id)

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
    data.transactions = data.transactions.filter((t) => t.id !== id)

    if (data.transactions.length < initialLength) {
      this.saveData(data)
      return true
    }

    return false
  }

  deleteTransactions(ids: string[]): number {
    const data = this.loadData()
    const initialLength = data.transactions.length
    data.transactions = data.transactions.filter((t) => !ids.includes(t.id))

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
    let transactions = [...data.transactions]

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
  addCategory(category: Omit<Category, "id">): Category {
    const data = this.loadData()
    const newCategory: Category = {
      ...category,
      id: uuidv4(),
    }

    data.categories.push(newCategory)
    this.saveData(data)

    return newCategory
  }

  getCategories(type?: "income" | "expense"): Category[] {
    const data = this.loadData()
    if (type) {
      return data.categories.filter((c) => c.type === type)
    }
    return data.categories
  }

  // Investment işlemleri
  addInvestment(investment: Omit<Investment, "id" | "created_at" | "updated_at">): Investment {
    const data = this.loadData()
    const newInvestment: Investment = {
      ...investment,
      id: uuidv4(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    data.investments.push(newInvestment)
    this.saveData(data)

    return newInvestment
  }

  updateInvestment(id: string, updates: Partial<Investment>): Investment | null {
    const data = this.loadData()
    const index = data.investments.findIndex((i) => i.id === id)

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
    data.investments = data.investments.filter((i) => i.id !== id)

    if (data.investments.length < initialLength) {
      this.saveData(data)
      return true
    }

    return false
  }

  getInvestments(): Investment[] {
    const data = this.loadData()
    return data.investments
  }

  // Budget işlemleri
  addBudget(budget: Omit<Budget, "id" | "created_at">): Budget {
    const data = this.loadData()
    const newBudget: Budget = {
      ...budget,
      id: uuidv4(),
      created_at: new Date().toISOString(),
    }

    data.budgets.push(newBudget)
    this.saveData(data)

    return newBudget
  }

  getBudgets(): Budget[] {
    const data = this.loadData()
    return data.budgets
  }

  // Todo işlemleri
  addTodo(todo: Omit<Todo, "id" | "created_at" | "updated_at">): Todo {
    const data = this.loadData()
    const newTodo: Todo = {
      ...todo,
      id: uuidv4(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    data.todos.push(newTodo)
    this.saveData(data)
    return newTodo
  }

  updateTodo(id: string, updates: Partial<Todo>): Todo | null {
    const data = this.loadData()
    const index = data.todos.findIndex((t) => t.id === id)

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
    data.todos = data.todos.filter((t) => t.id !== id)

    if (data.todos.length < initialLength) {
      this.saveData(data)
      return true
    }
    return false
  }

  getTodos(): Todo[] {
    const data = this.loadData()
    return data.todos
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
      if (typeof window === "undefined") {
        return false
      }

      localStorage.removeItem(this.storageKey)
      localStorage.removeItem(this.backupKey)
      return true
    } catch (error) {
      console.error("Error clearing data:", error)
      return false
    }
  }

  // Backup işlemleri
  private createBackup(data: AppData): void {
    try {
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
      localStorage.setItem(this.backupKey, encryptedBackups)
    } catch (error) {
      console.error("Error creating backup:", error)
    }
  }

  getBackups(): Array<{ id: string; data: AppData; timestamp: string }> {
    try {
      if (typeof window === "undefined") {
        return []
      }

      const encryptedBackups = localStorage.getItem(this.backupKey)
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

  // Yardımcı metodlar
  private getDefaultData(): AppData {
    return {
      transactions: [],
      categories: [
        { id: "cat-1", name: "Gıda", type: "expense", color: "#ef4444" },
        { id: "cat-2", name: "Barınma", type: "expense", color: "#f97316" },
        { id: "cat-3", name: "Ulaşım", type: "expense", color: "#eab308" },
        { id: "cat-4", name: "Eğlence", type: "expense", color: "#22c55e" },
        { id: "cat-5", name: "Sağlık", type: "expense", color: "#06b6d4" },
        { id: "cat-6", name: "Giyim", type: "expense", color: "#8b5cf6" },
        { id: "cat-7", name: "Eğitim", type: "expense", color: "#ec4899" },
        { id: "cat-8", name: "Diğer Gider", type: "expense", color: "#6b7280" },
        { id: "cat-9", name: "Maaş", type: "income", color: "#10b981" },
        { id: "cat-10", name: "Ek Gelir", type: "income", color: "#3b82f6" },
        { id: "cat-11", name: "Yatırım", type: "income", color: "#8b5cf6" },
        { id: "cat-12", name: "Diğer Gelir", type: "income", color: "#06b6d4" },
      ],
      budgets: [],
      investments: [],
      todos: [],
      settings: {
        currency: "TRY",
        theme: "light",
        language: "tr",
      },
      metadata: {
        version: "1.0.0",
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
    // Basit XOR şifreleme
    let encrypted = ""
    for (let i = 0; i < data.length; i++) {
      encrypted += String.fromCharCode(
        data.charCodeAt(i) ^ this.encryptionKey.charCodeAt(i % this.encryptionKey.length),
      )
    }
    return btoa(encrypted)
  }

  private decrypt(encryptedData: string): string {
    const data = atob(encryptedData)
    let decrypted = ""
    for (let i = 0; i < data.length; i++) {
      decrypted += String.fromCharCode(
        data.charCodeAt(i) ^ this.encryptionKey.charCodeAt(i % this.encryptionKey.length),
      )
    }
    return decrypted
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

    const totalIncome = data.transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)

    const totalExpense = data.transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)

    const investmentValue = data.investments.reduce(
      (sum, i) => sum + i.quantity * (i.current_price || i.purchase_price),
      0,
    )

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      transactionCount: data.transactions.length,
      categoryCount: data.categories.length,
      investmentValue,
    }
  }
}

export const localStorageManager = LocalStorageManager.getInstance()
