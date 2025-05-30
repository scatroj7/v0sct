"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { PlusIcon, Trash2Icon } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { localStorageManager } from "@/app/lib/local-storage-manager"
import { DatePicker } from "@/components/ui/date-picker"
import { format } from "date-fns"
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
  date: string
}

export default function TransactionsTab() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [newTransaction, setNewTransaction] = useState({
    amount: "",
    description: "",
    type: "expense",
    category_id: "",
    date: new Date(),
  })
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)
  const { toast } = useToast()

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

    // Tarih aralığına göre filtrele
    if (dateRange?.from && dateRange?.to) {
      filteredTransactions = filteredTransactions.filter((transaction) => {
        const transactionDate = new Date(transaction.date)
        const fromDate = dateRange.from
        const toDate = new Date(dateRange.to)
        toDate.setHours(23, 59, 59, 999) // Include the end date

        return transactionDate >= fromDate && transactionDate <= toDate
      })
    }

    setTransactions(filteredTransactions)
  }

  // Tarih aralığı değiştiğinde filtrele
  useEffect(() => {
    filterTransactions(allTransactions)
  }, [dateRange, searchTerm, allTransactions])

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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <Input type="text" placeholder="Arama..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        <DatePicker
          date={dateRange?.from}
          onSelect={(date) => setDateRange(date ? { from: date, to: dateRange?.to } : undefined)}
          placeholder="Tarih aralığı seçin"
        />
      </div>

      {/* İşlem tablosu */}
      <div className="overflow-x-auto rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarih</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Açıklama
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kategori
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tutar</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tip</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center">
                  Yükleniyor...
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center">
                  İşlem bulunamadı.
                </td>
              </tr>
            ) : (
              transactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Checkbox
                      checked={selectedTransactions.includes(transaction.id)}
                      onCheckedChange={() => handleTransactionSelect(transaction.id)}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {format(new Date(transaction.date), "dd.MM.yyyy")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      {transaction.category_name}
                      {transaction.category_color && (
                        <div
                          className="ml-2 w-3 h-3 rounded-full"
                          style={{ backgroundColor: transaction.category_color }}
                        ></div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(transaction.amount)}
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
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Seçili işlemleri sil */}
      {selectedTransactions.length > 0 && (
        <div className="mt-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2Icon className="mr-2 h-4 w-4" /> Seçili İşlemleri Sil ({selectedTransactions.length})
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
                <AlertDialogDescription>
                  Bu işlem geri alınamaz. Seçili işlemleri silmek istediğinizden emin misiniz?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>İptal</AlertDialogCancel>
                <AlertDialogAction onClick={deleteSelectedTransactions}>Sil</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      {/* İşlem ekleme dialogu */}
      <AlertDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>İşlem Ekle</AlertDialogTitle>
            <AlertDialogDescription>Yeni bir işlem ekleyin.</AlertDialogDescription>
          </AlertDialogHeader>
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
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsAddDialogOpen(false)}>İptal</AlertDialogCancel>
            <AlertDialogAction disabled={isSubmitting} onClick={addTransaction}>
              {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
