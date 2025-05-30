"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Plus, Trash2, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react"
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns"
import { NexusDatePicker } from "@/components/ui/nexus-date-picker"
import { localStorageManager } from "@/app/lib/local-storage-manager"

interface Transaction {
  id: string
  amount: number
  description: string
  type: string
  category_id: string
  category_name?: string
  category_color?: string
  date: string
  created_at: string
}

interface Category {
  id: string
  name: string
  type: string
  color?: string
  icon?: string
}

interface DateRange {
  startDate: Date | null
  endDate: Date | null
}

// Sıralama türleri
type SortDirection = "asc" | "desc" | "none"
type SortField = "date" | "description" | "category" | "amount" | null

interface TransactionsTabProps {
  useLocalStorage?: boolean
}

const TransactionsTab = ({ useLocalStorage = true }: TransactionsTabProps) => {
  // İşlemler ve kategoriler
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [incomeCategories, setIncomeCategories] = useState<Category[]>([])
  const [expenseCategories, setExpenseCategories] = useState<Category[]>([])

  // Sıralama durumu
  const [sortField, setSortField] = useState<SortField>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>("none")

  // Yeni işlem
  const [newTransaction, setNewTransaction] = useState({
    amount: "",
    description: "",
    type: "expense",
    category_id: "",
    date: new Date(),
  })

  // Filtreler
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [dateFilter, setDateFilter] = useState<string>("thisMonth")
  const [minAmountFilter, setMinAmountFilter] = useState<string>("")
  const [maxAmountFilter, setMaxAmountFilter] = useState<string>("")

  // Seçili işlemler
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)

  // UI durumları
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("all")

  // Tarih filtresi seçenekleri
  const dateFilterOptions = [
    { value: "all", label: "Tüm Zamanlar" },
    { value: "thisMonth", label: "Bu Ay" },
    { value: "lastMonth", label: "Önceki Ay" },
    { value: "nextMonth", label: "Sonraki Ay" },
    { value: "last6Months", label: "Son 6 Ay" },
    { value: "next6Months", label: "Sonraki 6 Ay" },
    { value: "thisYear", label: "Bu Yıl" },
  ]

  // Tarih filtresi için tarih aralığı hesapla
  const getDateRangeForFilter = (filter: string): DateRange => {
    const now = new Date()
    let startDate: Date | null = null
    let endDate: Date | null = null

    switch (filter) {
      case "thisMonth":
        startDate = startOfMonth(now)
        endDate = endOfMonth(now)
        break
      case "lastMonth":
        startDate = startOfMonth(subMonths(now, 1))
        endDate = endOfMonth(subMonths(now, 1))
        break
      case "nextMonth":
        startDate = startOfMonth(addMonths(now, 1))
        endDate = endOfMonth(addMonths(now, 1))
        break
      case "last6Months":
        startDate = startOfMonth(subMonths(now, 5))
        endDate = endOfMonth(now)
        break
      case "next6Months":
        startDate = startOfMonth(now)
        endDate = endOfMonth(addMonths(now, 5))
        break
      case "thisYear":
        startDate = startOfYear(now)
        endDate = endOfYear(now)
        break
      case "all":
      default:
        // Tüm zamanlar için filtre yok
        break
    }

    return { startDate, endDate }
  }

  // Para formatı
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(amount)
  }

  // İşlemleri getir
  const fetchTransactions = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log("📦 SADECE LOCAL STORAGE kullanılıyor - API çağrısı yapılmayacak")

      // Local storage'dan veri al
      const localTransactions = localStorageManager.getTransactions()

      // Kategori isimlerini ekle
      const categories = localStorageManager.getCategories()
      const transactionsWithCategories = localTransactions.map((transaction) => ({
        ...transaction,
        category_name: categories.find((cat) => cat.id === transaction.category_id)?.name || "Bilinmeyen",
        category_color: categories.find((cat) => cat.id === transaction.category_id)?.color,
      }))

      setAllTransactions(transactionsWithCategories)
      setTransactions(transactionsWithCategories)
      console.log(`📦 ${transactionsWithCategories.length} local işlem alındı`)

      filterTransactions(transactionsWithCategories)
    } catch (err) {
      console.error("İşlemler getirilirken hata:", err)
      setError(`İşlemler yüklenirken bir hata oluştu: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setLoading(false)
    }
  }

  // Kategorileri getir
  const fetchCategories = async () => {
    try {
      console.log("📦 SADECE LOCAL STORAGE - Kategoriler API çağrısı yapılmayacak")

      const localCategories = localStorageManager.getCategories()

      setCategories(localCategories)

      const income = localCategories.filter((cat) => cat.type === "income")
      const expense = localCategories.filter((cat) => cat.type === "expense")

      setIncomeCategories(income)
      setExpenseCategories(expense)

      console.log(
        `📦 ${localCategories.length} local kategori alındı (${income.length} gelir, ${expense.length} gider)`,
      )
    } catch (err) {
      console.error("Kategoriler getirilirken hata:", err)
      setError(`Kategoriler yüklenirken bir hata oluştu: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  // İşlem ekle
  const addTransaction = async () => {
    try {
      setIsSubmitting(true)
      setError(null)

      if (!newTransaction.amount || !newTransaction.category_id || !newTransaction.date) {
        setError("Tutar, kategori ve tarih alanları zorunludur.")
        return
      }

      // SADECE local storage kullan - API çağrısı yapma
      console.log("📦 Local storage'a işlem ekleniyor...")
      const transactionData = {
        amount: Number.parseFloat(newTransaction.amount),
        description: newTransaction.description,
        type: newTransaction.type as "income" | "expense",
        category_id: newTransaction.category_id,
        date: format(newTransaction.date, "yyyy-MM-dd"),
      }

      localStorageManager.addTransaction(transactionData)
      console.log("📦 Local storage'a işlem eklendi")

      // Formu sıfırla ve işlemleri yeniden getir
      setNewTransaction({
        amount: "",
        description: "",
        type: "expense",
        category_id: "",
        date: new Date(),
      })

      setIsAddDialogOpen(false)
      fetchTransactions()
    } catch (err) {
      console.error("İşlem eklenirken hata:", err)
      setError(`İşlem eklenirken bir hata oluştu: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Seçili işlemleri sil
  const deleteSelectedTransactions = async () => {
    if (selectedTransactions.length === 0) return

    if (!confirm(`${selectedTransactions.length} işlemi silmek istediğinizden emin misiniz?`)) {
      return
    }

    try {
      setLoading(true)
      setError(null)

      if (useLocalStorage) {
        // Local storage'dan sil
        console.log("📦 Local storage'dan işlemler siliniyor:", selectedTransactions)
        const deletedCount = localStorageManager.deleteTransactions(selectedTransactions)
        console.log(`📦 ${deletedCount} local işlem silindi`)

        // Seçili işlemleri sıfırla ve işlemleri yeniden getir
        setSelectedTransactions([])
        setSelectAll(false)
        fetchTransactions()
      } else {
        // Database'den sil
        console.log("🗄️ Database'den işlemler siliniyor:", selectedTransactions)

        const response = await fetch("/api/transactions/batch-delete", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ids: selectedTransactions,
          }),
        })

        const responseText = await response.text()
        console.log("🗄️ Silme işlemi yanıtı:", responseText)

        let data
        try {
          data = JSON.parse(responseText)
        } catch (e) {
          throw new Error(`API yanıtı geçerli JSON değil: ${responseText}`)
        }

        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText} - ${data.error || "Bilinmeyen hata"}`)
        }

        if (data.success) {
          // İşlem başarılı, seçili işlemleri sıfırla ve işlemleri yeniden getir
          setSelectedTransactions([])
          setSelectAll(false)
          fetchTransactions()
        } else {
          setError(data.error || "İşlemler silinirken bir hata oluştu.")
        }
      }
    } catch (err) {
      console.error("İşlemler silinirken hata:", err)
      setError(`İşlemler silinirken bir hata oluştu: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setLoading(false)
    }
  }

  // İşlemleri filtrele
  const filterTransactions = (transactionsToFilter = allTransactions) => {
    let filtered = [...transactionsToFilter]

    // Tür filtreleme
    if (activeTab === "income") {
      filtered = filtered.filter((t) => t.type === "income")
    } else if (activeTab === "expense") {
      filtered = filtered.filter((t) => t.type === "expense")
    }

    // Kategori filtreleme
    if (categoryFilter && categoryFilter !== "all") {
      filtered = filtered.filter((t) => t.category_id === categoryFilter)
    }

    // Tarih filtreleme
    const { startDate, endDate } = getDateRangeForFilter(dateFilter)

    if (startDate) {
      filtered = filtered.filter((t) => new Date(t.date) >= startDate)
    }

    if (endDate) {
      filtered = filtered.filter((t) => new Date(t.date) <= endDate)
    }

    // Tutar filtreleme
    if (minAmountFilter) {
      filtered = filtered.filter((t) => t.amount >= Number.parseFloat(minAmountFilter))
    }

    if (maxAmountFilter) {
      filtered = filtered.filter((t) => t.amount <= Number.parseFloat(maxAmountFilter))
    }

    // Sıralama
    if (sortField && sortDirection !== "none") {
      filtered = sortTransactions(filtered, sortField, sortDirection)
    }

    setTransactions(filtered)
  }

  // İşlemleri sırala
  const sortTransactions = (transactionsToSort: Transaction[], field: SortField, direction: SortDirection) => {
    if (!field || direction === "none") return transactionsToSort

    return [...transactionsToSort].sort((a, b) => {
      let comparison = 0

      switch (field) {
        case "date":
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime()
          break
        case "description":
          comparison = (a.description || "").localeCompare(b.description || "")
          break
        case "category":
          comparison = (a.category_name || "").localeCompare(b.category_name || "")
          break
        case "amount":
          comparison = a.amount - b.amount
          break
      }

      return direction === "asc" ? comparison : -comparison
    })
  }

  // Sıralama değiştir
  const handleSort = (field: SortField) => {
    let newDirection: SortDirection = "asc"

    if (sortField === field) {
      if (sortDirection === "asc") {
        newDirection = "desc"
      } else if (sortDirection === "desc") {
        newDirection = "none"
      } else {
        newDirection = "asc"
      }
    }

    setSortField(field)
    setSortDirection(newDirection)

    // Sıralamayı uygula
    if (field && newDirection !== "none") {
      setTransactions(sortTransactions(transactions, field, newDirection))
    } else {
      // Sıralama kaldırıldıysa, filtreleri yeniden uygula
      filterTransactions()
    }
  }

  // Sıralama ikonu
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1 text-gray-400" />
    }

    if (sortDirection === "asc") {
      return <ArrowUp className="h-4 w-4 ml-1 text-primary" />
    }

    if (sortDirection === "desc") {
      return <ArrowDown className="h-4 w-4 ml-1 text-primary" />
    }

    return <ArrowUpDown className="h-4 w-4 ml-1 text-gray-400" />
  }

  // Filtreleri sıfırla
  const resetFilters = () => {
    setCategoryFilter(null)
    setDateFilter("all")
    setMinAmountFilter("")
    setMaxAmountFilter("")
    setSortField(null)
    setSortDirection("none")

    // Aktif sekmeye göre filtreleme yap
    let filtered = [...allTransactions]

    if (activeTab === "income") {
      filtered = filtered.filter((t) => t.type === "income")
    } else if (activeTab === "expense") {
      filtered = filtered.filter((t) => t.type === "expense")
    }

    setTransactions(filtered)
  }

  // İşlem seçme/seçimini kaldırma
  const toggleTransactionSelection = (id: string) => {
    if (selectedTransactions.includes(id)) {
      setSelectedTransactions(selectedTransactions.filter((transactionId) => transactionId !== id))
    } else {
      setSelectedTransactions([...selectedTransactions, id])
    }
  }

  // Tüm işlemleri seç/seçimini kaldır
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedTransactions([])
    } else {
      setSelectedTransactions(transactions.map((t) => t.id))
    }
    setSelectAll(!selectAll)
  }

  // Yeni işlem formundaki değişiklikleri izle
  const handleNewTransactionChange = (field: string, value: any) => {
    setNewTransaction({
      ...newTransaction,
      [field]: value,
    })

    // İşlem türü değiştiğinde kategori seçimini sıfırla
    if (field === "type") {
      setNewTransaction({
        ...newTransaction,
        type: value,
        category_id: "",
      })
    }
  }

  // Sekme değiştiğinde işlemleri filtrele
  const handleTabChange = (value: string) => {
    setActiveTab(value)

    let filtered = [...allTransactions]

    if (value === "income") {
      filtered = filtered.filter((t) => t.type === "income")
    } else if (value === "expense") {
      filtered = filtered.filter((t) => t.type === "expense")
    }

    setTransactions(filtered)

    // Seçili işlemleri sıfırla
    setSelectedTransactions([])
    setSelectAll(false)
  }

  // İlk yükleme
  useEffect(() => {
    console.log("🔄 TransactionsTab useEffect - useLocalStorage:", useLocalStorage)
    fetchTransactions()
    fetchCategories()
  }, [useLocalStorage]) // useLocalStorage değiştiğinde yeniden yükle

  // Filtreler değiştiğinde işlemleri filtrele
  useEffect(() => {
    filterTransactions()
  }, [categoryFilter, dateFilter, minAmountFilter, maxAmountFilter, activeTab])

  // Seçili işlemler değiştiğinde selectAll durumunu güncelle
  useEffect(() => {
    setSelectAll(selectedTransactions.length === transactions.length && transactions.length > 0)
  }, [selectedTransactions, transactions])

  return (
    <div className="space-y-6">
      {/* Veri kaynağı göstergesi */}
      <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg border">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          📊 Veri kaynağı: {useLocalStorage ? "Local Storage (Kişisel)" : "Database (Admin)"}
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Hata</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col md:flex-row justify-between gap-4">
        <h2 className="text-2xl font-bold">İşlemler</h2>
        <div className="flex gap-2">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> İşlem Ekle
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Yeni İşlem Ekle</DialogTitle>
                <DialogDescription>İşlem detaylarını girin ve ekle butonuna tıklayın.</DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="transactionType">İşlem Türü</Label>
                    <Select
                      value={newTransaction.type}
                      onValueChange={(value) => handleNewTransactionChange("type", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="İşlem türü seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income">Gelir</SelectItem>
                        <SelectItem value="expense">Gider</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="transactionCategory">Kategori</Label>
                    <Select
                      value={newTransaction.category_id}
                      onValueChange={(value) => handleNewTransactionChange("category_id", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Kategori seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {newTransaction.type === "income"
                          ? incomeCategories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))
                          : expenseCategories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="transactionAmount">Tutar</Label>
                  <Input
                    id="transactionAmount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newTransaction.amount}
                    onChange={(e) => handleNewTransactionChange("amount", e.target.value)}
                  />
                </div>

                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="transactionDescription">Açıklama</Label>
                  <Input
                    id="transactionDescription"
                    placeholder="İşlem açıklaması"
                    value={newTransaction.description}
                    onChange={(e) => handleNewTransactionChange("description", e.target.value)}
                  />
                </div>

                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="transactionDate">Tarih</Label>
                  <NexusDatePicker
                    value={newTransaction.date}
                    onChange={(date) => handleNewTransactionChange("date", date)}
                    className="p-0"
                    label=""
                    buttonText="Seç"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  İptal
                </Button>
                <Button onClick={addTransaction} disabled={isSubmitting}>
                  {isSubmitting ? "Ekleniyor..." : "Ekle"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {selectedTransactions.length > 0 && (
            <Button variant="destructive" onClick={deleteSelectedTransactions} disabled={loading}>
              <Trash2 className="mr-2 h-4 w-4" /> Seçilenleri Sil ({selectedTransactions.length})
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="all">Tümü</TabsTrigger>
          <TabsTrigger value="income">Gelirler</TabsTrigger>
          <TabsTrigger value="expense">Giderler</TabsTrigger>
        </TabsList>

        <div className="mt-4 p-4 bg-card rounded-lg border">
          <h3 className="text-lg font-medium mb-4">Filtreler</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="categoryFilter">Kategori</Label>
              <Select
                value={categoryFilter || "all"}
                onValueChange={(value) => setCategoryFilter(value === "all" ? null : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tüm kategoriler" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm kategoriler</SelectItem>
                  {activeTab === "income"
                    ? incomeCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))
                    : activeTab === "expense"
                      ? expenseCategories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))
                      : categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name} ({category.type === "income" ? "Gelir" : "Gider"})
                          </SelectItem>
                        ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="dateFilter">Tarih Aralığı</Label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tarih aralığı seçin" />
                </SelectTrigger>
                <SelectContent>
                  {dateFilterOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="minAmountFilter">Minimum Tutar</Label>
              <Input
                id="minAmountFilter"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={minAmountFilter}
                onChange={(e) => setMinAmountFilter(e.target.value)}
              />
            </div>

            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="maxAmountFilter">Maksimum Tutar</Label>
              <Input
                id="maxAmountFilter"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={maxAmountFilter}
                onChange={(e) => setMaxAmountFilter(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={resetFilters} variant="outline">
              Filtreleri Sıfırla
            </Button>
          </div>
        </div>

        <TabsContent value="all" className="mt-4">
          {renderTransactionsTable()}
        </TabsContent>

        <TabsContent value="income" className="mt-4">
          {renderTransactionsTable()}
        </TabsContent>

        <TabsContent value="expense" className="mt-4">
          {renderTransactionsTable()}
        </TabsContent>
      </Tabs>
    </div>
  )

  // İşlemler tablosunu render et
  function renderTransactionsTable() {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <p className="text-lg">Veriler yükleniyor...</p>
        </div>
      )
    }

    if (transactions.length === 0) {
      return (
        <div className="flex items-center justify-center h-64">
          <p className="text-lg text-gray-500">İşlem bulunamadı</p>
        </div>
      )
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>İşlemler</CardTitle>
          <CardDescription>{transactions.length} işlem listeleniyor</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="p-2 text-left">
                    <Checkbox checked={selectAll} onCheckedChange={toggleSelectAll} aria-label="Tümünü seç" />
                  </th>
                  <th
                    className="p-2 text-left cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => handleSort("date")}
                  >
                    <div className="flex items-center">
                      Tarih
                      {getSortIcon("date")}
                    </div>
                  </th>
                  <th
                    className="p-2 text-left cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => handleSort("description")}
                  >
                    <div className="flex items-center">
                      Açıklama
                      {getSortIcon("description")}
                    </div>
                  </th>
                  <th
                    className="p-2 text-left cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => handleSort("category")}
                  >
                    <div className="flex items-center">
                      Kategori
                      {getSortIcon("category")}
                    </div>
                  </th>
                  <th
                    className="p-2 text-right cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => handleSort("amount")}
                  >
                    <div className="flex items-center justify-end">
                      Tutar
                      {getSortIcon("amount")}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="border-b hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                  >
                    <td className="p-2">
                      <Checkbox
                        checked={selectedTransactions.includes(transaction.id)}
                        onCheckedChange={() => toggleTransactionSelection(transaction.id)}
                        aria-label={`İşlem ${transaction.id} seç`}
                      />
                    </td>
                    <td className="p-2">{new Date(transaction.date).toLocaleDateString("tr-TR")}</td>
                    <td className="p-2">{transaction.description || "-"}</td>
                    <td className="p-2">
                      {transaction.category_name ? (
                        <div className="flex items-center">
                          {transaction.category_color && (
                            <div
                              className="w-3 h-3 rounded-full mr-2"
                              style={{ backgroundColor: transaction.category_color }}
                            ></div>
                          )}
                          {transaction.category_name}
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td
                      className={`p-2 text-right ${transaction.type === "income" ? "text-green-600" : "text-red-600"}`}
                    >
                      {formatCurrency(transaction.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    )
  }
}

export default TransactionsTab
