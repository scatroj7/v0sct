import { localStorageManager } from "./local-storage-manager"

export class HybridDataService {
  private static instance: HybridDataService

  static getInstance(): HybridDataService {
    if (!HybridDataService.instance) {
      HybridDataService.instance = new HybridDataService()
    }
    return HybridDataService.instance
  }

  // Kullanıcının admin olup olmadığına göre veri kaynağını belirle
  private shouldUseDatabase(): boolean {
    if (typeof window === "undefined") {
      console.log("🌐 Server-side, database kullanılmayacak")
      return false
    }

    try {
      const userStr = localStorage.getItem("scatrack_user")
      if (!userStr) {
        console.log("👤 Kullanıcı bilgisi bulunamadı")
        return false
      }

      const user = JSON.parse(userStr)
      const isHuseyin = user.email === "huseyin97273@gmail.com"

      console.log("🔍 Veri kaynağı kontrolü:", {
        email: user.email,
        isHuseyin: isHuseyin,
        willUseDB: isHuseyin,
      })

      return isHuseyin
    } catch (error) {
      console.error("❌ Veri kaynağı kontrol hatası:", error)
      return false
    }
  }

  // Transactions
  async getTransactions() {
    console.log("🔄 getTransactions çağrıldı")

    if (this.shouldUseDatabase()) {
      console.log("📊 Veritabanından transactions alınıyor...")
      try {
        // Admin parametresi ile API çağır
        const response = await fetch("/api/transactions?admin=true")
        console.log("🌐 API response status:", response.status)

        if (response.ok) {
          const data = await response.json()
          console.log("📦 API'den gelen raw data:", data)

          if (data.success && Array.isArray(data.transactions)) {
            console.log("✅ DB'den alınan transactions:", data.transactions.length)
            console.log("📋 İlk 3 transaction:", data.transactions.slice(0, 3))
            return data.transactions
          } else {
            console.log("❌ Unexpected data format:", data)
          }
        } else {
          console.error("❌ DB response error:", response.status, response.statusText)
          const errorText = await response.text()
          console.error("❌ Error response:", errorText)
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

  // Investments
  async getInvestments() {
    console.log("🔄 getInvestments çağrıldı")

    if (this.shouldUseDatabase()) {
      console.log("📊 Veritabanından investments alınıyor...")
      try {
        // Admin parametresi ile API çağır
        const response = await fetch("/api/investments?admin=true")
        console.log("🌐 Investments API response status:", response.status)

        if (response.ok) {
          const data = await response.json()
          console.log("📦 Investments API'den gelen raw data:", data)

          const investments = Array.isArray(data) ? data : data.investments || []
          console.log("✅ DB'den alınan investments:", investments.length)
          console.log("📋 İlk 3 investment:", investments.slice(0, 3))

          return investments
        } else {
          console.error("❌ Investments DB response error:", response.status)
          const errorText = await response.text()
          console.error("❌ Investments error response:", errorText)
        }
      } catch (error) {
        console.error("❌ Investments database fetch error:", error)
      }
    }

    console.log("💾 Local storage'dan investments alınıyor...")
    const localInvestments = localStorageManager.getInvestments()
    console.log("✅ Local'den alınan investments:", localInvestments.length)
    return localInvestments
  }

  // Todos
  async getTodos() {
    console.log("🔄 getTodos çağrıldı")

    if (this.shouldUseDatabase()) {
      console.log("📊 Veritabanından todos alınıyor...")
      try {
        // Admin parametresi ile API çağır
        const response = await fetch("/api/todos?admin=true")
        console.log("🌐 Todos API response status:", response.status)

        if (response.ok) {
          const data = await response.json()
          console.log("📦 Todos API'den gelen raw data:", data)

          const todos = Array.isArray(data) ? data : data.todos || []
          console.log("✅ DB'den alınan todos:", todos.length)
          console.log("📋 İlk 3 todo:", todos.slice(0, 3))

          return todos
        } else {
          console.error("❌ Todos DB response error:", response.status)
        }
      } catch (error) {
        console.error("❌ Todos database fetch error:", error)
      }
    }

    console.log("💾 Local storage'dan todos alınıyor...")
    const localTodos = localStorageManager.getTodos()
    console.log("✅ Local'den alınan todos:", localTodos.length)
    return localTodos
  }

  async addTransaction(transaction: any) {
    console.log("➕ addTransaction çağrıldı:", transaction)

    if (this.shouldUseDatabase()) {
      console.log("📊 Veritabanına transaction ekleniyor...")
      try {
        const response = await fetch("/api/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(transaction),
        })

        console.log("🌐 Add transaction response status:", response.status)

        if (response.ok) {
          const result = await response.json()
          console.log("✅ DB'ye eklenen transaction:", result)
          return result
        } else {
          const errorText = await response.text()
          console.error("❌ Add transaction error:", errorText)
        }
      } catch (error) {
        console.error("❌ Database add error:", error)
      }
    }

    console.log("💾 Local storage'a transaction ekleniyor...")
    return localStorageManager.addTransaction(transaction)
  }

  async deleteTransaction(id: string) {
    console.log("🗑️ deleteTransaction çağrıldı:", id)

    if (this.shouldUseDatabase()) {
      try {
        const response = await fetch(`/api/transactions/${id}`, {
          method: "DELETE",
        })

        console.log("🌐 Delete transaction response status:", response.status)

        if (response.ok) {
          console.log("✅ DB'den transaction silindi:", id)
          return true
        }
      } catch (error) {
        console.error("❌ Database delete error:", error)
      }
    }

    console.log("💾 Local storage'dan transaction siliniyor...")
    return localStorageManager.deleteTransaction(id)
  }

  async deleteTransactions(ids: string[]) {
    console.log("🗑️ deleteTransactions çağrıldı:", ids)

    if (this.shouldUseDatabase()) {
      try {
        const response = await fetch("/api/transactions/batch-delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids }),
        })

        console.log("🌐 Batch delete response status:", response.status)

        if (response.ok) {
          console.log("✅ DB'den transactions silindi:", ids.length)
          return ids.length
        }
      } catch (error) {
        console.error("❌ Database batch delete error:", error)
      }
    }

    console.log("💾 Local storage'dan transactions siliniyor...")
    return localStorageManager.deleteTransactions(ids)
  }

  async addInvestment(investment: any) {
    console.log("➕ addInvestment çağrıldı:", investment)

    if (this.shouldUseDatabase()) {
      try {
        const response = await fetch("/api/investments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(investment),
        })

        console.log("🌐 Add investment response status:", response.status)

        if (response.ok) {
          const result = await response.json()
          console.log("✅ DB'ye eklenen investment:", result)
          return result
        }
      } catch (error) {
        console.error("❌ Investment database add error:", error)
      }
    }

    console.log("💾 Local storage'a investment ekleniyor...")
    return localStorageManager.addInvestment(investment)
  }

  async updateInvestment(id: string, updates: any) {
    console.log("🔄 updateInvestment çağrıldı:", id, updates)

    if (this.shouldUseDatabase()) {
      try {
        const response = await fetch(`/api/investments/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        })

        console.log("🌐 Update investment response status:", response.status)

        if (response.ok) {
          const result = await response.json()
          console.log("✅ DB'de güncellenen investment:", result)
          return result
        }
      } catch (error) {
        console.error("❌ Investment database update error:", error)
      }
    }

    console.log("💾 Local storage'da investment güncelleniyor...")
    return localStorageManager.updateInvestment(id, updates)
  }

  async deleteInvestment(id: string) {
    console.log("🗑️ deleteInvestment çağrıldı:", id)

    if (this.shouldUseDatabase()) {
      try {
        const response = await fetch(`/api/investments/${id}`, {
          method: "DELETE",
        })

        console.log("🌐 Delete investment response status:", response.status)

        if (response.ok) {
          console.log("✅ DB'den investment silindi:", id)
          return true
        }
      } catch (error) {
        console.error("❌ Investment database delete error:", error)
      }
    }

    console.log("💾 Local storage'dan investment siliniyor...")
    return localStorageManager.deleteInvestment(id)
  }

  async addTodo(todo: any) {
    console.log("➕ addTodo çağrıldı:", todo)

    if (this.shouldUseDatabase()) {
      try {
        const response = await fetch("/api/todos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(todo),
        })

        console.log("🌐 Add todo response status:", response.status)

        if (response.ok) {
          const result = await response.json()
          console.log("✅ DB'ye eklenen todo:", result)
          return result
        }
      } catch (error) {
        console.error("❌ Todo database add error:", error)
      }
    }

    console.log("💾 Local storage'a todo ekleniyor...")
    return localStorageManager.addTodo(todo)
  }

  async updateTodo(id: string, updates: any) {
    console.log("🔄 updateTodo çağrıldı:", id, updates)

    if (this.shouldUseDatabase()) {
      try {
        const response = await fetch(`/api/todos/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        })

        console.log("🌐 Update todo response status:", response.status)

        if (response.ok) {
          const result = await response.json()
          console.log("✅ DB'de güncellenen todo:", result)
          return result
        }
      } catch (error) {
        console.error("❌ Todo database update error:", error)
      }
    }

    console.log("💾 Local storage'da todo güncelleniyor...")
    return localStorageManager.updateTodo(id, updates)
  }

  async deleteTodo(id: string) {
    console.log("🗑️ deleteTodo çağrıldı:", id)

    if (this.shouldUseDatabase()) {
      try {
        const response = await fetch(`/api/todos/${id}`, {
          method: "DELETE",
        })

        console.log("🌐 Delete todo response status:", response.status)

        if (response.ok) {
          console.log("✅ DB'den todo silindi:", id)
          return true
        }
      } catch (error) {
        console.error("❌ Todo database delete error:", error)
      }
    }

    console.log("💾 Local storage'dan todo siliniyor...")
    return localStorageManager.deleteTodo(id)
  }

  // Categories
  async getCategories() {
    console.log("🔄 getCategories çağrıldı")

    if (this.shouldUseDatabase()) {
      console.log("📊 Veritabanından categories alınıyor...")
      try {
        const response = await fetch("/api/categories?admin=true")
        console.log("🌐 Categories API response status:", response.status)

        if (response.ok) {
          const data = await response.json()
          console.log("📦 Categories API'den gelen data:", data)
          return Array.isArray(data) ? data : data.categories || []
        }
      } catch (error) {
        console.error("❌ Categories database fetch error:", error)
      }
    }

    console.log("💾 Local storage'dan categories alınıyor...")
    return localStorageManager.getCategories()
  }

  // Budgets
  async getBudgets() {
    console.log("🔄 getBudgets çağrıldı")

    if (this.shouldUseDatabase()) {
      console.log("📊 Veritabanından budgets alınıyor...")
      try {
        const response = await fetch("/api/budgets?admin=true")
        console.log("🌐 Budgets API response status:", response.status)

        if (response.ok) {
          const data = await response.json()
          console.log("📦 Budgets API'den gelen data:", data)
          return Array.isArray(data) ? data : data.budgets || []
        }
      } catch (error) {
        console.error("❌ Budgets database fetch error:", error)
      }
    }

    console.log("💾 Local storage'dan budgets alınıyor...")
    return localStorageManager.getBudgets()
  }

  // Veri kaynağı bilgisi
  getDataSource(): "database" | "local" {
    const useDB = this.shouldUseDatabase()
    console.log("📍 Veri kaynağı:", useDB ? "database" : "local")
    return useDB ? "database" : "local"
  }

  // Admin panel için özel metodlar
  async syncLocalToDatabase() {
    console.log("🔄 syncLocalToDatabase başlatıldı")

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
        console.log("➕ Transaction senkronize ediliyor:", transaction.id)
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
        console.log("➕ Investment senkronize ediliyor:", investment.id)
        await fetch("/api/investments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(investment),
        })
      } catch (error) {
        console.error("❌ Investment sync error:", error)
      }
    }

    console.log("✅ syncLocalToDatabase tamamlandı")
    return true
  }

  async syncDatabaseToLocal() {
    console.log("🔄 syncDatabaseToLocal başlatıldı")

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

      console.log("📦 DB'den alınan veriler:", {
        transactions: transactions.length,
        investments: investments.length,
        todos: todos.length,
        categories: categories.length,
        budgets: budgets.length,
      })

      const localData = localStorageManager.loadData()
      localData.transactions = transactions
      localData.investments = investments
      localData.todos = todos
      localData.categories = categories
      localData.budgets = budgets

      localStorageManager.saveData(localData)
      console.log("✅ syncDatabaseToLocal tamamlandı")
      return true
    } catch (error) {
      console.error("❌ syncDatabaseToLocal error:", error)
      return false
    }
  }
}

export const hybridDataService = HybridDataService.getInstance()
