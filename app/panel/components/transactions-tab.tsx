"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { PlusIcon, Trash2Icon, EditIcon } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
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
    frequency: "once" as "once" | "monthly" | "every3months" | "every6months" | "yearly" | "custom",
    customCount: "2",
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
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

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

      console.log("📦 Local storage'a işlem ekleniyor...")

      // Tek seferlik işlem
      if (newTransaction.frequency === "once") {
        const transactionData = {
          amount: Number.parseFloat(newTransaction.amount),
          description: newTransaction.description,
          type: newTransaction.type as "income" | "expense",
          category_id: newTransaction.category_id,
          date: format(newTransaction.date, "yyyy-MM-dd"),
        }

        localStorageManager.addTransaction(transactionData)
        console.log("📦 Local storage'a tek seferlik işlem eklendi")
      }
      // Tekrarlanan/Taksitli işlem
      else {
        // Ay adları
        const months = [
          "Ocak",
          "Şubat",
          "Mart",
          "Nisan",
          "Mayıs",
          "Haziran",
          "Temmuz",
          "Ağustos",
          "Eylül",
          "Ekim",
          "Kasım",
          "Aralık",
        ]

        // Kategori adını bul
        const selectedCategory = categories.find((cat) => cat.id === newTransaction.category_id)
        const categoryName = selectedCategory?.name || "İşlem"

        // Frequency türüne göre ay aralığı
        const frequencyIntervals = {
          monthly: 1,
          every3months: 3,
          every6months: 6,
          yearly: 12,
          custom: 1,
        }

        // Frequency türüne göre toplam sayı (yıl sonuna kadar)
        const currentYear = new Date().getFullYear()
        const endOfYear = new Date(currentYear, 11, 31) // 31 Aralık
        const startDate = new Date(newTransaction.date)

        let totalCount = 0
        if (newTransaction.frequency === "custom") {
          totalCount = Number.parseInt(newTransaction.customCount) || 2
        } else {
          // Yıl sonuna kadar kaç kez tekrarlanacağını hesapla
          let tempDate = new Date(startDate)
          while (tempDate <= endOfYear) {
            totalCount++
            tempDate = new Date(tempDate)
            tempDate.setMonth(tempDate.getMonth() + frequencyIntervals[newTransaction.frequency])
          }
        }

        // İşlemleri oluştur
        for (let i = 0; i < totalCount; i++) {
          const transactionDate = new Date(startDate)

          if (newTransaction.frequency === "custom") {
            // Özel taksit/tekrar için aylık artır
            transactionDate.setMonth(startDate.getMonth() + i)
          } else {
            // Diğer seçenekler için belirlenen aralıkta artır
            transactionDate.setMonth(startDate.getMonth() + i * frequencyIntervals[newTransaction.frequency])
          }

          // Yıl sonunu geçerse dur (custom hariç)
          if (newTransaction.frequency !== "custom" && transactionDate > endOfYear) {
            break
          }

          const monthName = months[transactionDate.getMonth()]

          let description = ""

          if (newTransaction.type === "income") {
            // Gelir için: "Temmuz ayı Prim" formatı
            if (newTransaction.description && newTransaction.description.trim() !== "") {
              description = `${monthName} ayı ${newTransaction.description.trim()}`
            } else {
              description = `${monthName} ayı ${categoryName}`
            }
          } else {
            // Gider için: "5/6 Taksit xxx" formatı
            const taksitInfo = `${i + 1}/${totalCount} Taksit`
            if (newTransaction.description && newTransaction.description.trim() !== "") {
              description = `${taksitInfo} ${newTransaction.description.trim()}`
            } else {
              description = `${taksitInfo} ${categoryName}`
            }
          }

          const transactionData = {
            amount: Number.parseFloat(newTransaction.amount),
            description: description,
            type: newTransaction.type as "income" | "expense",
            category_id: newTransaction.category_id,
            date: format(transactionDate, "yyyy-MM-dd"),
          }

          localStorageManager.addTransaction(transactionData)
        }

        console.log(
          `📦 Local storage'a ${totalCount} adet ${newTransaction.type === "income" ? "tekrarlı" : "taksitli"} işlem eklendi`,
        )
      }

      // Formu sıfırla ve işlemleri yeniden getir
      setNewTransaction({
        amount: "",
        description: "",
        type: "expense",
        category_id: "",
        date: new Date(),
        frequency: "once",
        customCount: "2",
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
        date: format(newTransaction.date, "yyyy-MM-dd"),
      }

      localStorageManager.updateTransaction(transactionData)
      console.log("📦 Local storage'da işlem düzenlendi")

      // Formu sıfırla ve işlemleri yeniden getir
      setNewTransaction({
        amount: "",
        description: "",
        type: "expense",
        category_id: "",
        date: new Date(),
        frequency: "once",
        customCount: "2",
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
      date: new Date(transaction.date),
      frequency: "once",
      customCount: "2",
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
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
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
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Tarih</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Açıklama</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Kategori</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Tutar</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Tip</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center">
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
                <tr key={transaction.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Checkbox
                      checked={selectedTransactions.includes(transaction.id)}
                      onCheckedChange={() => handleTransactionSelect(transaction.id)}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {format(new Date(transaction.date), "dd.MM.yyyy")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{transaction.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
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
                      {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(
                        transaction.amount,
                      )}
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
                {newTransaction.type === "income" ? "Tekrar" : "Taksit"}
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
                  <SelectValue placeholder={newTransaction.type === "income" ? "Tekrar seçin" : "Taksit seçin"} />
                </SelectTrigger>
                <SelectContent>
                  {newTransaction.type === "income" ? (
                    <>
                      <SelectItem value="once">Tek Seferlik</SelectItem>
                      <SelectItem value="monthly">Aylık</SelectItem>
                      <SelectItem value="every3months">3 Ayda Bir</SelectItem>
                      <SelectItem value="every6months">6 Ayda Bir</SelectItem>
                      <SelectItem value="yearly">12 Ayda Bir</SelectItem>
                      <SelectItem value="custom">Özel Tekrar</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="once">Tek Çekim</SelectItem>
                      <SelectItem value="monthly">2 Taksit</SelectItem>
                      <SelectItem value="every3months">3 Taksit</SelectItem>
                      <SelectItem value="every6months">6 Taksit</SelectItem>
                      <SelectItem value="yearly">12 Taksit</SelectItem>
                      <SelectItem value="custom">Özel Taksit</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            {newTransaction.frequency === "custom" && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="customCount" className="text-right">
                  {newTransaction.type === "income" ? "Tekrar Sayısı" : "Taksit Sayısı"}
                </Label>
                <Input
                  type="number"
                  id="customCount"
                  value={newTransaction.customCount}
                  onChange={(e) => setNewTransaction({ ...newTransaction, customCount: e.target.value })}
                  className="col-span-3"
                  placeholder={newTransaction.type === "income" ? "Tekrar sayısı" : "Taksit sayısı"}
                  min="2"
                  max="24"
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
