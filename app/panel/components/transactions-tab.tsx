"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { PlusIcon, Trash2Icon, EditIcon, ChevronUpIcon, ChevronDownIcon } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { localStorageManager } from "@/app/lib/local-storage-manager"
import { DatePicker } from "@/components/ui/date-picker"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import type { DateRange } from "react-day-picker"

interface Category {
  id: string
  name: string
  type: "income" | "expense"
  color: string
}

interface Transaction {
  id: string
  amount: number
  description: string
  type: "income" | "expense"
  category_id: string
  category_name?: string
  category_color?: string
  currency: string
  date: string
}

// Para birimleri listesi
const currencies = [
  { code: "TRY", name: "Türk Lirası", symbol: "₺" },
  { code: "USD", name: "Amerikan Doları", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "İngiliz Sterlini", symbol: "£" },
  { code: "JPY", name: "Japon Yeni", symbol: "¥" },
  { code: "CHF", name: "İsviçre Frangı", symbol: "CHF" },
  { code: "CAD", name: "Kanada Doları", symbol: "C$" },
  { code: "AUD", name: "Avustralya Doları", symbol: "A$" },
]

export default function TransactionsTab() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [newTransaction, setNewTransaction] = useState({
    amount: "",
    description: "",
    type: "expense",
    category_id: "",
    currency: "TRY", // Varsayılan para birimi
    date: new Date(),
    frequency: "once" as "once" | "monthly" | "every3months" | "every6months" | "yearly" | "custom",
    customRepeatCount: "2", // Sadece özel seçenek için
  })
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)
  const { toast } = useToast()
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [dateFilter, setDateFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")

  // Para birimi formatı
  const formatCurrency = (amount: number, currencyCode: string) => {
    const currency = currencies.find((c) => c.code === currencyCode)
    if (currency) {
      return new Intl.NumberFormat("tr-TR", {
        style: "currency",
        currency: currencyCode,
        minimumFractionDigits: 2,
      }).format(amount)
    }
    return `${amount.toFixed(2)} ${currencyCode}`
  }

  // İşlemleri getir
  const fetchTransactions = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log("📦 SADECE LOCAL STORAGE kullanılıyor")

      // Local storage'dan veri al
      const localTransactions = localStorageManager.getTransactions()

      // Kategori isimlerini ekle
      const categories = localStorageManager.getCategories()
      const transactionsWithCategories = localTransactions.map((transaction) => ({
        ...transaction,
        currency: transaction.currency || "TRY", // Varsayılan para birimi ekle
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
      console.log("📦 SADECE LOCAL STORAGE - Kategoriler")

      const localCategories = localStorageManager.getCategories()
      setCategories(localCategories)

      console.log(`📦 ${localCategories.length} local kategori alındı`)
      console.log(
        "Kategoriler:",
        localCategories.map((c) => c.name),
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

      // Tekrarlı işlemler için tekrar sayısı kontrolü (sadece özel seçenek için)
      if (
        newTransaction.frequency === "custom" &&
        (!newTransaction.customRepeatCount || Number.parseInt(newTransaction.customRepeatCount) < 1)
      ) {
        setError("Özel tekrar seçeneği için geçerli bir tekrar sayısı giriniz.")
        return
      }

      console.log("📦 Local storage'a işlem ekleniyor...")

      // Tek seferlik işlem
      if (newTransaction.frequency === "once") {
        const transactionData = {
          amount: Number.parseFloat(newTransaction.amount),
          description: newTransaction.description,
          type: newTransaction.type as "income" | "expense",
          category_id: newTransaction.category_id,
          currency: newTransaction.currency,
          date: format(newTransaction.date, "yyyy-MM-dd"),
        }

        localStorageManager.addTransaction(transactionData)
        console.log("📦 Local storage'a tek seferlik işlem eklendi")
      }
      // Tekrarlanan işlem
      else {
        // Kategori adını bul
        const selectedCategory = categories.find((cat) => cat.id === newTransaction.category_id)
        const categoryName = selectedCategory?.name || "İşlem"

        // Frequency türüne göre ay aralığı ve otomatik tekrar sayısı hesaplama
        let intervalMonths = 1
        let totalCount = 1

        const startDate = newTransaction.date
        const currentYear = startDate.getFullYear()
        const yearEnd = new Date(currentYear, 11, 31) // Yıl sonu
        const monthsUntilYearEnd =
          (yearEnd.getFullYear() - startDate.getFullYear()) * 12 + (yearEnd.getMonth() - startDate.getMonth()) + 1

        switch (newTransaction.frequency) {
          case "monthly":
            intervalMonths = 1
            totalCount = Math.max(1, monthsUntilYearEnd) // Yıl sonuna kadar aylık
            break
          case "every3months":
            intervalMonths = 3
            totalCount = Math.max(1, Math.ceil(monthsUntilYearEnd / 3)) // Yıl sonuna kadar 3 ayda bir
            break
          case "every6months":
            intervalMonths = 6
            totalCount = Math.max(1, Math.ceil(monthsUntilYearEnd / 6)) // Yıl sonuna kadar 6 ayda bir
            break
          case "yearly":
            intervalMonths = 12
            totalCount = Math.max(1, Math.ceil(monthsUntilYearEnd / 12)) // Yıl sonuna kadar yıllık
            break
          case "custom":
            intervalMonths = 1 // Özel seçenekte aylık olarak tekrarla
            totalCount = Number.parseInt(newTransaction.customRepeatCount) || 1
            break
        }

        // İşlemleri oluştur
        for (let i = 0; i < totalCount; i++) {
          const transactionDate = new Date(startDate)
          transactionDate.setMonth(startDate.getMonth() + i * intervalMonths)

          // Yıl sonunu geçmesin (özel seçenek hariç)
          if (newTransaction.frequency !== "custom" && transactionDate.getFullYear() > currentYear) {
            break
          }

          let description = ""
          if (newTransaction.description && newTransaction.description.trim() !== "") {
            description = `${i + 1}/${totalCount} ${newTransaction.description.trim()}`
          } else {
            description = `${i + 1}/${totalCount} ${categoryName}`
          }

          const transactionData = {
            amount: Number.parseFloat(newTransaction.amount),
            description: description,
            type: newTransaction.type as "income" | "expense",
            category_id: newTransaction.category_id,
            currency: newTransaction.currency,
            date: format(transactionDate, "yyyy-MM-dd"),
          }

          localStorageManager.addTransaction(transactionData)
        }

        console.log(`📦 Local storage'a ${totalCount} adet tekrarlı işlem eklendi`)
      }

      // Formu sıfırla ve işlemleri yeniden getir
      setNewTransaction({
        amount: "",
        description: "",
        type: "expense",
        category_id: "",
        currency: "TRY",
        date: new Date(),
        frequency: "once",
        customRepeatCount: "2",
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

  // İşlem düzenle
  const editTransaction = async () => {
    try {
      setIsSubmitting(true)
      setError(null)

      if (!editingTransaction || !newTransaction.amount || !newTransaction.category_id || !newTransaction.date) {
        setError("Tutar, kategori ve tarih alanları zorunludur.")
        return
      }

      console.log("📦 Local storage'da işlem düzenleniyor...")

      const transactionData = {
        id: editingTransaction.id,
        amount: Number.parseFloat(newTransaction.amount),
        description: newTransaction.description,
        type: newTransaction.type as "income" | "expense",
        category_id: newTransaction.category_id,
        currency: newTransaction.currency,
        date: format(newTransaction.date, "yyyy-MM-dd"),
      }

      localStorageManager.updateTransaction(editingTransaction.id, transactionData)
      console.log("📦 Local storage'da işlem düzenlendi")

      // Formu sıfırla ve işlemleri yeniden getir
      setNewTransaction({
        amount: "",
        description: "",
        type: "expense",
        category_id: "",
        currency: "TRY",
        date: new Date(),
        frequency: "once",
        customRepeatCount: "2",
      })

      setEditingTransaction(null)
      setIsEditDialogOpen(false)
      fetchTransactions()
    } catch (err) {
      console.error("İşlem düzenlenirken hata:", err)
      setError(`İşlem düzenlenirken bir hata oluştu: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Tek işlem sil
  const deleteSingleTransaction = async (transactionId: string) => {
    if (!confirm("Bu işlemi silmek istediğinizden emin misiniz?")) {
      return
    }

    try {
      setLoading(true)
      setError(null)

      console.log("📦 Local storage'dan işlem siliniyor:", transactionId)
      const deletedCount = localStorageManager.deleteTransactions([transactionId])
      console.log(`📦 ${deletedCount} local işlem silindi`)

      fetchTransactions()
    } catch (err) {
      console.error("İşlem silinirken hata:", err)
      setError(`İşlem silinirken bir hata oluştu: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setLoading(false)
    }
  }

  // Düzenleme dialogunu aç
  const openEditDialog = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setNewTransaction({
      amount: transaction.amount.toString(),
      description: transaction.description,
      type: transaction.type,
      category_id: transaction.category_id,
      currency: transaction.currency || "TRY",
      date: new Date(transaction.date),
      frequency: "once",
      customRepeatCount: "2",
    })
    setIsEditDialogOpen(true)
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

      console.log("📦 Local storage'dan işlemler siliniyor:", selectedTransactions)
      const deletedCount = localStorageManager.deleteTransactions(selectedTransactions)
      console.log(`📦 ${deletedCount} local işlem silindi`)

      setSelectedTransactions([])
      setSelectAll(false)
      fetchTransactions()
    } catch (err) {
      console.error("İşlemler silinirken hata:", err)
      setError(`İşlemler silinirken bir hata oluştu: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setLoading(false)
    }
  }

  // Arama ve tarih aralığına göre işlemleri filtrele
  const filterTransactions = (transactionsToFilter: Transaction[]) => {
    let filteredTransactions = [...transactionsToFilter]

    // Arama terimine göre filtrele
    if (searchTerm) {
      filteredTransactions = filteredTransactions.filter((transaction) => {
        const searchTermLower = searchTerm.toLowerCase()
        return (
          transaction.description.toLowerCase().includes(searchTermLower) ||
          transaction.category_name?.toLowerCase().includes(searchTermLower) ||
          transaction.amount.toString().includes(searchTerm)
        )
      })
    }

    // Tarih filtresi
    if (dateFilter !== "all") {
      const now = new Date()
      let startDate: Date | null = null
      let endDate: Date | null = null

      switch (dateFilter) {
        case "thisMonth":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
          break
        case "lastMonth":
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
          endDate = new Date(now.getFullYear(), now.getMonth(), 0)
          break
        case "nextMonth":
          startDate = new Date(now.getFullYear(), now.getMonth() + 1, 1)
          endDate = new Date(now.getFullYear(), now.getMonth() + 2, 0)
          break
        case "last6Months":
          startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1)
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
          break
        case "next6Months":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          endDate = new Date(now.getFullYear(), now.getMonth() + 6, 0)
          break
        case "thisYear":
          startDate = new Date(now.getFullYear(), 0, 1)
          endDate = new Date(now.getFullYear(), 11, 31)
          break
      }

      if (startDate && endDate) {
        filteredTransactions = filteredTransactions.filter((transaction) => {
          const transactionDate = new Date(transaction.date)
          return transactionDate >= startDate && transactionDate <= endDate
        })
      }
    }

    // Manuel tarih aralığına göre filtrele
    if (dateRange?.from && dateRange?.to) {
      filteredTransactions = filteredTransactions.filter((transaction) => {
        const transactionDate = new Date(transaction.date)
        const fromDate = dateRange.from
        const toDate = new Date(dateRange.to)
        toDate.setHours(23, 59, 59, 999) // Include the end date

        return transactionDate >= fromDate && transactionDate <= toDate
      })
    }

    // Kategori filtresi
    if (categoryFilter !== "all") {
      filteredTransactions = filteredTransactions.filter((transaction) => transaction.category_id === categoryFilter)
    }

    // Tip filtresi
    if (typeFilter !== "all") {
      filteredTransactions = filteredTransactions.filter((transaction) => transaction.type === typeFilter)
    }

    // Sıralama uygula
    if (sortField) {
      filteredTransactions.sort((a, b) => {
        let aValue: any = a[sortField as keyof Transaction]
        let bValue: any = b[sortField as keyof Transaction]

        // Özel sıralama mantıkları
        switch (sortField) {
          case "date":
            aValue = new Date(aValue).getTime()
            bValue = new Date(bValue).getTime()
            break
          case "amount":
            aValue = Number(aValue)
            bValue = Number(bValue)
            break
          case "category_name":
            aValue = (aValue || "").toLowerCase()
            bValue = (bValue || "").toLowerCase()
            break
          case "description":
            aValue = aValue.toLowerCase()
            bValue = bValue.toLowerCase()
            break
          case "type":
            aValue = aValue.toLowerCase()
            bValue = bValue.toLowerCase()
            break
          case "currency":
            aValue = aValue.toLowerCase()
            bValue = bValue.toLowerCase()
            break
        }

        if (aValue < bValue) {
          return sortDirection === "asc" ? -1 : 1
        }
        if (aValue > bValue) {
          return sortDirection === "asc" ? 1 : -1
        }
        return 0
      })
    }

    setTransactions(filteredTransactions)
  }

  // Sıralama fonksiyonu
  const handleSort = (field: string) => {
    if (sortField === field) {
      // Aynı sütuna tıklandıysa yönü değiştir
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      // Farklı sütuna tıklandıysa yeni sütunu seç ve artan sıralama yap
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Sıralama ikonu bileşeni
  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) {
      return <div className="w-4 h-4" /> // Boş alan
    }
    return sortDirection === "asc" ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />
  }

  // Tarih aralığı değiştiğinde filtrele
  useEffect(() => {
    filterTransactions(allTransactions)
  }, [dateRange, searchTerm, dateFilter, categoryFilter, typeFilter, allTransactions, sortField, sortDirection])

  // İlk yükleme
  useEffect(() => {
    console.log("🔄 TransactionsTab useEffect - SADECE LOCAL STORAGE")
    fetchTransactions()
    fetchCategories()
  }, [])

  // Hata mesajı göster
  useEffect(() => {
    if (error) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error,
      })
    }
  }, [error, toast])

  // Tek bir işlem seçildiğinde
  const handleTransactionSelect = (transactionId: string) => {
    setSelectedTransactions((prevSelected) => {
      if (prevSelected.includes(transactionId)) {
        return prevSelected.filter((id) => id !== transactionId)
      } else {
        return [...prevSelected, transactionId]
      }
    })
  }

  // Seçili işlemler değiştiğinde, tümü seç checkbox'ının durumunu güncelle
  useEffect(() => {
    if (transactions.length > 0) {
      setSelectAll(selectedTransactions.length === transactions.length)
    } else {
      setSelectAll(false)
    }
  }, [selectedTransactions, transactions.length])

  return (
    <div className="space-y-6">
      {/* Hata mesajı */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Hata!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      {/* Başlık ve aksiyonlar */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">İşlemler</h2>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <PlusIcon className="mr-2 h-4 w-4" />
          İşlem Ekle
        </Button>
      </div>

      {/* Arama ve filtreleme */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <Input type="text" placeholder="Arama..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />

        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Tarih filtresi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Zamanlar</SelectItem>
            <SelectItem value="thisMonth">Bu Ay</SelectItem>
            <SelectItem value="lastMonth">Önceki Ay</SelectItem>
            <SelectItem value="nextMonth">Sonraki Ay</SelectItem>
            <SelectItem value="last6Months">Son 6 Ay</SelectItem>
            <SelectItem value="next6Months">Gelecek 6 Ay</SelectItem>
            <SelectItem value="thisYear">Bu Yıl</SelectItem>
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Kategori filtresi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Kategoriler</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Tip filtresi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Tipler</SelectItem>
            <SelectItem value="income">Gelir</SelectItem>
            <SelectItem value="expense">Gider</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mb-4">
        <Label className="text-sm text-gray-600 mb-2 block">Ay Seçimi (Opsiyonel)</Label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm text-gray-500 mb-1 block">Başlangıç Ayı</Label>
            <Select
              value={dateRange?.from ? format(dateRange.from, "yyyy-MM") : ""}
              onValueChange={(value) => {
                if (value) {
                  const [year, month] = value.split("-")
                  const startDate = new Date(Number.parseInt(year), Number.parseInt(month) - 1, 1)
                  setDateRange({ from: startDate, to: dateRange?.to })
                } else {
                  setDateRange(undefined)
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Başlangıç ayı seçin" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 24 }, (_, i) => {
                  const date = new Date()
                  date.setMonth(date.getMonth() - 12 + i)
                  const value = format(date, "yyyy-MM")
                  const label = format(date, "MMMM yyyy", { locale: tr })
                  return (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm text-gray-500 mb-1 block">Bitiş Ayı</Label>
            <Select
              value={dateRange?.to ? format(dateRange.to, "yyyy-MM") : ""}
              onValueChange={(value) => {
                if (value) {
                  const [year, month] = value.split("-")
                  const endDate = new Date(Number.parseInt(year), Number.parseInt(month), 0) // Son gün
                  setDateRange({ from: dateRange?.from, to: endDate })
                } else {
                  setDateRange({ from: dateRange?.from, to: undefined })
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Bitiş ayı seçin" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 24 }, (_, i) => {
                  const date = new Date()
                  date.setMonth(date.getMonth() - 12 + i)
                  const value = format(date, "yyyy-MM")
                  const label = format(date, "MMMM yyyy", { locale: tr })
                  return (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex justify-end mb-4">
        <Button
          variant="outline"
          onClick={() => {
            setSearchTerm("")
            setDateFilter("all")
            setCategoryFilter("all")
            setTypeFilter("all")
            setDateRange(undefined)
          }}
        >
          Filtreleri Sıfırla
        </Button>
      </div>

      {/* İşlem tablosu */}
      <div className="overflow-x-auto rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200 bg-white dark:bg-gray-800">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                <Checkbox
                  checked={selectAll}
                  onCheckedChange={(checked) => {
                    setSelectAll(!!checked)
                    if (checked) {
                      setSelectedTransactions(transactions.map((transaction) => transaction.id))
                    } else {
                      setSelectedTransactions([])
                    }
                  }}
                />
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 select-none transition-colors duration-200"
                onClick={() => handleSort("date")}
              >
                <div className="flex items-center justify-between">
                  Tarih
                  <SortIcon field="date" />
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 select-none transition-colors duration-200"
                onClick={() => handleSort("description")}
              >
                <div className="flex items-center justify-between">
                  Açıklama
                  <SortIcon field="description" />
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 select-none transition-colors duration-200"
                onClick={() => handleSort("category_name")}
              >
                <div className="flex items-center justify-between">
                  Kategori
                  <SortIcon field="category_name" />
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 select-none transition-colors duration-200"
                onClick={() => handleSort("amount")}
              >
                <div className="flex items-center justify-between">
                  Tutar
                  <SortIcon field="amount" />
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 select-none transition-colors duration-200"
                onClick={() => handleSort("currency")}
              >
                <div className="flex items-center justify-between">
                  Para Birimi
                  <SortIcon field="currency" />
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 select-none transition-colors duration-200"
                onClick={() => handleSort("type")}
              >
                <div className="flex items-center justify-between">
                  Tip
                  <SortIcon field="type" />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                İşlemler
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                  Yükleniyor...
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                  İşlem bulunamadı.
                </td>
              </tr>
            ) : (
              transactions.map((transaction) => (
                <tr
                  key={transaction.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Checkbox
                      checked={selectedTransactions.includes(transaction.id)}
                      onCheckedChange={() => handleTransactionSelect(transaction.id)}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {format(new Date(transaction.date), "dd.MM.yyyy")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {transaction.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    <div className="flex items-center">
                      {transaction.category_name}
                      <div
                        className={`ml-2 w-3 h-3 rounded-full ${
                          transaction.type === "income" ? "bg-green-500" : "bg-red-500"
                        }`}
                      ></div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={
                        transaction.type === "expense" ? "text-red-600 font-medium" : "text-green-600 font-medium"
                      }
                    >
                      {formatCurrency(transaction.amount, transaction.currency)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200">
                      {transaction.currency}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        transaction.type === "income" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}
                    >
                      {transaction.type === "income" ? "Gelir" : "Gider"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(transaction)}
                        className="h-8 w-8 p-0"
                      >
                        <EditIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteSingleTransaction(transaction.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2Icon className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Seçili işlemleri sil */}
      {selectedTransactions.length > 0 && (
        <div className="mt-4">
          <Button variant="destructive" onClick={deleteSelectedTransactions}>
            <Trash2Icon className="mr-2 h-4 w-4" /> Seçili İşlemleri Sil ({selectedTransactions.length})
          </Button>
        </div>
      )}

      {/* İşlem ekleme dialogu */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>İşlem Ekle</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Tutar
              </Label>
              <Input
                type="number"
                id="amount"
                value={newTransaction.amount}
                onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                className="col-span-3"
                placeholder="0.00"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="currency" className="text-right">
                Para Birimi
              </Label>
              <Select
                value={newTransaction.currency}
                onValueChange={(value) => setNewTransaction({ ...newTransaction, currency: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Para birimi seçin" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.symbol} {currency.name} ({currency.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Açıklama
              </Label>
              <Input
                type="text"
                id="description"
                value={newTransaction.description}
                onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                className="col-span-3"
                placeholder="İşlem açıklaması"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Tip
              </Label>
              <Select
                value={newTransaction.type}
                onValueChange={(value) => setNewTransaction({ ...newTransaction, type: value as "income" | "expense" })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Tip seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Gelir</SelectItem>
                  <SelectItem value="expense">Gider</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Kategori
              </Label>
              <Select
                value={newTransaction.category_id}
                onValueChange={(value) => setNewTransaction({ ...newTransaction, category_id: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Kategori seçin" />
                </SelectTrigger>
                <SelectContent>
                  {categories
                    .filter((category) => category.type === newTransaction.type)
                    .map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">
                Tarih
              </Label>
              <div className="col-span-3">
                <DatePicker
                  date={newTransaction.date}
                  onSelect={(date) => setNewTransaction({ ...newTransaction, date: date || new Date() })}
                  placeholder="Tarih seçin"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="frequency" className="text-right">
                Tekrar
              </Label>
              <Select
                value={newTransaction.frequency}
                onValueChange={(value) =>
                  setNewTransaction({
                    ...newTransaction,
                    frequency: value as "once" | "monthly" | "every3months" | "every6months" | "yearly" | "custom",
                  })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Tekrar seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="once">Tek Seferlik</SelectItem>
                  <SelectItem value="monthly">Her Ay</SelectItem>
                  <SelectItem value="every3months">3 Ayda 1</SelectItem>
                  <SelectItem value="every6months">6 Ayda 1</SelectItem>
                  <SelectItem value="yearly">12 Ayda 1</SelectItem>
                  <SelectItem value="custom">Özel</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newTransaction.frequency === "custom" && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="customRepeatCount" className="text-right">
                  Tekrar Sayısı
                </Label>
                <Input
                  type="number"
                  id="customRepeatCount"
                  value={newTransaction.customRepeatCount}
                  onChange={(e) => setNewTransaction({ ...newTransaction, customRepeatCount: e.target.value })}
                  className="col-span-3"
                  placeholder="Tekrar sayısı"
                  min="1"
                  max="60"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              İptal
            </Button>
            <Button disabled={isSubmitting} onClick={addTransaction}>
              {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* İşlem düzenleme dialogu */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>İşlem Düzenle</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-amount" className="text-right">
                Tutar
              </Label>
              <Input
                type="number"
                id="edit-amount"
                value={newTransaction.amount}
                onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                className="col-span-3"
                placeholder="0.00"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-currency" className="text-right">
                Para Birimi
              </Label>
              <Select
                value={newTransaction.currency}
                onValueChange={(value) => setNewTransaction({ ...newTransaction, currency: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Para birimi seçin" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.symbol} {currency.name} ({currency.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-description" className="text-right">
                Açıklama
              </Label>
              <Input
                type="text"
                id="edit-description"
                value={newTransaction.description}
                onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                className="col-span-3"
                placeholder="İşlem açıklaması"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-type" className="text-right">
                Tip
              </Label>
              <Select
                value={newTransaction.type}
                onValueChange={(value) => setNewTransaction({ ...newTransaction, type: value as "income" | "expense" })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Tip seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Gelir</SelectItem>
                  <SelectItem value="expense">Gider</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-category" className="text-right">
                Kategori
              </Label>
              <Select
                value={newTransaction.category_id}
                onValueChange={(value) => setNewTransaction({ ...newTransaction, category_id: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Kategori seçin" />
                </SelectTrigger>
                <SelectContent>
                  {categories
                    .filter((category) => category.type === newTransaction.type)
                    .map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-date" className="text-right">
                Tarih
              </Label>
              <div className="col-span-3">
                <DatePicker
                  date={newTransaction.date}
                  onSelect={(date) => setNewTransaction({ ...newTransaction, date: date || new Date() })}
                  placeholder="Tarih seçin"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              İptal
            </Button>
            <Button disabled={isSubmitting} onClick={editTransaction}>
              {isSubmitting ? "Güncelleniyor..." : "Güncelle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
