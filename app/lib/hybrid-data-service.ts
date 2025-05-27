import { localStorageManager } from "./local-storage-manager"

export class HybridDataService {
  private static instance: HybridDataService

  static getInstance(): HybridDataService {
    if (!HybridDataService.instance) {
      HybridDataService.instance = new HybridDataService()
    }
    return HybridDataService.instance
  }

  // Kullanıcının admin olup olmadığını kontrol et
  private shouldUseDatabase(): boolean {
    if (typeof window === "undefined") {
      return false
    }

    try {
      const userStr = localStorage.getItem("scatrack_user")
      if (!userStr) {
        return false
      }

      const user = JSON.parse(userStr)
      return user.email === "huseyin97273@gmail.com"
    } catch (error) {
      console.error("❌ Admin kontrol hatası:", error)
      return false
    }
  }

  // Transactions
  async getTransactions() {
    console.log("🔄 getTransactions çağrıldı")

    if (this.shouldUseDatabase()) {
      console.log("📊 Veritabanından transactions alınıyor...")
      try {
        const response = await fetch("/api/transactions?admin=true")
        console.log("🌐 API response status:", response.status)

        if (response.ok) {
          const data = await response.json()
          console.log("📦 API'den gelen data:", data)

          if (data.success && Array.isArray(data.transactions)) {
            console.log("✅ DB'den alınan transactions:", data.transactions.length)
            return data.transactions
          }
        }
      } catch (error) {
        console.error("❌ Database fetch error:", error)
      }
    }

    // Local storage fallback
    console.log("💾 Local storage'dan transactions alınıyor...")
    const localTransactions = localStorageManager.getTransactions()
    console.log("✅ Local'den alınan transactions:", localTransactions.length)
    return localTransactions
  }

  async addTransaction(transaction: any) {
    console.log("➕ addTransaction çağrıldı:", transaction)

    if (this.shouldUseDatabase()) {
      try {
        const response = await fetch("/api/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(transaction),
        })

        if (response.ok) {
          const result = await response.json()
          console.log("✅ DB'ye eklenen transaction:", result)
          return result
        }
      } catch (error) {
        console.error("❌ Database add error:", error)
      }
    }

    console.log("💾 Local storage'a transaction ekleniyor...")
    return localStorageManager.addTransaction(transaction)
  }

  async deleteTransaction(id: string) {
    if (this.shouldUseDatabase()) {
      try {
        const response = await fetch(`/api/transactions/${id}`, {
          method: "DELETE",
        })
        if (response.ok) {
          return true
        }
      } catch (error) {
        console.error("❌ Database delete error:", error)
      }
    }

    return localStorageManager.deleteTransaction(id)
  }

  async deleteTransactions(ids: string[]) {
    if (this.shouldUseDatabase()) {
      try {
        const response = await fetch("/api/transactions/batch-delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids }),
        })
        if (response.ok) {
          return ids.length
        }
      } catch (error) {
        console.error("❌ Database batch delete error:", error)
      }
    }

    return localStorageManager.deleteTransactions(ids)
  }

  // Investments
  async getInvestments() {
    console.log("🔄 getInvestments çağrıldı")

    if (this.shouldUseDatabase()) {
      try {
        const response = await fetch("/api/investments?admin=true")
        if (response.ok) {
          const data = await response.json()
          console.log("✅ DB'den alınan investments:", data.length)
          return data
        }
      } catch (error) {
        console.error("❌ Investments database fetch error:", error)
      }
    }

    const localInvestments = localStorageManager.getInvestments()
    console.log("✅ Local'den alınan investments:", localInvestments.length)
    return localInvestments
  }

  async addInvestment(investment: any) {
    if (this.shouldUseDatabase()) {
      try {
        const response = await fetch("/api/investments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(investment),
        })
        if (response.ok) {
          return await response.json()
        }
      } catch (error) {
        console.error("❌ Investment database add error:", error)
      }
    }

    return localStorageManager.addInvestment(investment)
  }

  async updateInvestment(id: string, updates: any) {
    if (this.shouldUseDatabase()) {
      try {
        const response = await fetch(`/api/investments/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        })
        if (response.ok) {
          return await response.json()
        }
      } catch (error) {
        console.error("❌ Investment database update error:", error)
      }
    }

    return localStorageManager.updateInvestment(id, updates)
  }

  async deleteInvestment(id: string) {
    if (this.shouldUseDatabase()) {
      try {
        const response = await fetch(`/api/investments/${id}`, {
          method: "DELETE",
        })
        if (response.ok) {
          return true
        }
      } catch (error) {
        console.error("❌ Investment database delete error:", error)
      }
    }

    return localStorageManager.deleteInvestment(id)
  }

  // Todos
  async getTodos() {
    console.log("🔄 getTodos çağrıldı")

    if (this.shouldUseDatabase()) {
      try {
        const response = await fetch("/api/todos?admin=true")
        if (response.ok) {
          const data = await response.json()
          console.log("✅ DB'den alınan todos:", data.length)
          return data
        }
      } catch (error) {
        console.error("❌ Todos database fetch error:", error)
      }
    }

    const localTodos = localStorageManager.getTodos()
    console.log("✅ Local'den alınan todos:", localTodos.length)
    return localTodos
  }

  async addTodo(todo: any) {
    if (this.shouldUseDatabase()) {
      try {
        const response = await fetch("/api/todos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(todo),
        })
        if (response.ok) {
          return await response.json()
        }
      } catch (error) {
        console.error("❌ Todo database add error:", error)
      }
    }

    return localStorageManager.addTodo(todo)
  }

  async updateTodo(id: string, updates: any) {
    if (this.shouldUseDatabase()) {
      try {
        const response = await fetch(`/api/todos/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        })
        if (response.ok) {
          return await response.json()
        }
      } catch (error) {
        console.error("❌ Todo database update error:", error)
      }
    }

    return localStorageManager.updateTodo(id, updates)
  }

  async deleteTodo(id: string) {
    if (this.shouldUseDatabase()) {
      try {
        const response = await fetch(`/api/todos/${id}`, {
          method: "DELETE",
        })
        if (response.ok) {
          return true
        }
      } catch (error) {
        console.error("❌ Todo database delete error:", error)
      }
    }

    return localStorageManager.deleteTodo(id)
  }

  // Categories
  async getCategories() {
    if (this.shouldUseDatabase()) {
      try {
        const response = await fetch("/api/categories?admin=true")
        if (response.ok) {
          const data = await response.json()
          return Array.isArray(data) ? data : data.categories || []
        }
      } catch (error) {
        console.error("❌ Categories database fetch error:", error)
      }
    }

    return localStorageManager.getCategories()
  }

  // Budgets
  async getBudgets() {
    if (this.shouldUseDatabase()) {
      try {
        const response = await fetch("/api/budgets?admin=true")
        if (response.ok) {
          const data = await response.json()
          return Array.isArray(data) ? data : data.budgets || []
        }
      } catch (error) {
        console.error("❌ Budgets database fetch error:", error)
      }
    }

    return localStorageManager.getBudgets()
  }

  // Veri kaynağı bilgisi
  getDataSource(): "database" | "local" {
    return this.shouldUseDatabase() ? "database" : "local"
  }

  // Admin panel için özel metodlar
  async syncLocalToDatabase() {
    if (!this.shouldUseDatabase()) {
      throw new Error("Only admin users can sync data")
    }

    const localData = localStorageManager.loadData()
    console.log("📦 Local data yüklendi:", {
      transactions: localData.transactions.length,
      investments: localData.investments.length,
    })

    for (const transaction of localData.transactions) {
      try {
        await fetch("/api/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(transaction),
        })
      } catch (error) {
        console.error("❌ Transaction sync error:", error)
      }
    }

    for (const investment of localData.investments) {
      try {
        await fetch("/api/investments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(investment),
        })
      } catch (error) {
        console.error("❌ Investment sync error:", error)
      }
    }

    return true
  }

  async syncDatabaseToLocal() {
    if (!this.shouldUseDatabase()) {
      throw new Error("Only admin users can sync data")
    }

    try {
      const [transactions, investments, todos, categories, budgets] = await Promise.all([
        this.getTransactions(),
        this.getInvestments(),
        this.getTodos(),
        this.getCategories(),
        this.getBudgets(),
      ])

      const localData = localStorageManager.loadData()
      localData.transactions = transactions
      localData.investments = investments
      localData.todos = todos
      localData.categories = categories
      localData.budgets = budgets

      localStorageManager.saveData(localData)
      return true
    } catch (error) {
      console.error("❌ syncDatabaseToLocal error:", error)
      return false
    }
  }
}

export const hybridDataService = HybridDataService.getInstance()
