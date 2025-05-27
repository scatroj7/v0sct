"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Trash2, Plus, Download, Upload, RotateCcw } from "lucide-react"
import { localStorageManager, type Transaction, type Category } from "@/app/lib/local-storage-manager"
import { useToast } from "@/components/ui/use-toast"

export default function TransactionsTabLocal() {
  const { toast } = useToast()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([])

  // Form state
  const [formData, setFormData] = useState({
    amount: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
    type: "expense" as "income" | "expense",
    category_id: "",
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    try {
      const data = localStorageManager.loadData()
      setTransactions(data.transactions)
      setCategories(data.categories)
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "Hata",
        description: "Veriler yüklenirken bir hata oluştu",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (!formData.amount || !formData.date || !formData.type) {
        throw new Error("Tüm gerekli alanları doldurun")
      }

      const newTransaction = localStorageManager.addTransaction({
        amount: Number.parseFloat(formData.amount),
        date: formData.date,
        description: formData.description,
        type: formData.type,
        category_id: formData.category_id || undefined,
      })

      setTransactions((prev) => [newTransaction, ...prev])

      // Form'u temizle
      setFormData({
        amount: "",
        date: new Date().toISOString().split("T")[0],
        description: "",
        type: "expense",
        category_id: "",
      })

      toast({
        title: "Başarılı",
        description: "İşlem başarıyla eklendi",
      })
    } catch (error) {
      toast({
        title: "Hata",
        description: error instanceof Error ? error.message : "İşlem eklenirken bir hata oluştu",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = (id: string) => {
    try {
      const success = localStorageManager.deleteTransaction(id)
      if (success) {
        setTransactions((prev) => prev.filter((t) => t.id !== id))
        toast({
          title: "Başarılı",
          description: "İşlem silindi",
        })
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "İşlem silinirken bir hata oluştu",
        variant: "destructive",
      })
    }
  }

  const handleBatchDelete = () => {
    try {
      const deletedCount = localStorageManager.deleteTransactions(selectedTransactions)
      if (deletedCount > 0) {
        setTransactions((prev) => prev.filter((t) => !selectedTransactions.includes(t.id)))
        setSelectedTransactions([])
        toast({
          title: "Başarılı",
          description: `${deletedCount} işlem silindi`,
        })
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "İşlemler silinirken bir hata oluştu",
        variant: "destructive",
      })
    }
  }

  const handleExport = () => {
    try {
      const data = localStorageManager.exportData()
      const blob = new Blob([data], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `scatrack-backup-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Başarılı",
        description: "Veriler dışa aktarıldı",
      })
    } catch (error) {
      toast({
        title: "Hata",
        description: "Dışa aktarma sırasında bir hata oluştu",
        variant: "destructive",
      })
    }
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const jsonData = e.target?.result as string
        const success = localStorageManager.importData(jsonData)

        if (success) {
          loadData()
          toast({
            title: "Başarılı",
            description: "Veriler içe aktarıldı",
          })
        } else {
          throw new Error("Geçersiz dosya formatı")
        }
      } catch (error) {
        toast({
          title: "Hata",
          description: "İçe aktarma sırasında bir hata oluştu",
          variant: "destructive",
        })
      }
    }
    reader.readAsText(file)
  }

  const handleClearAll = () => {
    if (confirm("Tüm veriler silinecek. Emin misiniz?")) {
      try {
        localStorageManager.clearAllData()
        loadData()
        toast({
          title: "Başarılı",
          description: "Tüm veriler temizlendi",
        })
      } catch (error) {
        toast({
          title: "Hata",
          description: "Veriler temizlenirken bir hata oluştu",
          variant: "destructive",
        })
      }
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(amount)
  }

  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return "Kategori Yok"
    const category = categories.find((c) => c.id === categoryId)
    return category?.name || "Bilinmeyen Kategori"
  }

  const stats = localStorageManager.getStats()

  return (
    <div className="space-y-6">
      {/* İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Toplam Gelir</div>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalIncome)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Toplam Gider</div>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(stats.totalExpense)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Bakiye</div>
            <div className={`text-2xl font-bold ${stats.balance >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(stats.balance)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">İşlem Sayısı</div>
            <div className="text-2xl font-bold">{stats.transactionCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Yeni İşlem Formu */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Yeni İşlem Ekle
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Input
              type="number"
              step="0.01"
              placeholder="Tutar"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
            />

            <Input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />

            <Select
              value={formData.type}
              onValueChange={(value: "income" | "expense") => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Gelir</SelectItem>
                <SelectItem value="expense">Gider</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={formData.category_id}
              onValueChange={(value) => setFormData({ ...formData, category_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                {categories
                  .filter((c) => c.type === formData.type)
                  .map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Ekleniyor..." : "Ekle"}
            </Button>
          </form>

          <Input
            className="mt-4"
            placeholder="Açıklama (opsiyonel)"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </CardContent>
      </Card>

      {/* Veri Yönetimi */}
      <Card>
        <CardHeader>
          <CardTitle>Veri Yönetimi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleExport} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Dışa Aktar
            </Button>

            <Button variant="outline" onClick={() => document.getElementById("import-file")?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              İçe Aktar
            </Button>
            <input id="import-file" type="file" accept=".json" onChange={handleImport} className="hidden" />

            <Button onClick={handleClearAll} variant="destructive">
              <RotateCcw className="h-4 w-4 mr-2" />
              Tümünü Temizle
            </Button>

            {selectedTransactions.length > 0 && (
              <Button onClick={handleBatchDelete} variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Seçilenleri Sil ({selectedTransactions.length})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* İşlemler Listesi */}
      <Card>
        <CardHeader>
          <CardTitle>İşlemler ({transactions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedTransactions.includes(transaction.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTransactions([...selectedTransactions, transaction.id])
                      } else {
                        setSelectedTransactions(selectedTransactions.filter((id) => id !== transaction.id))
                      }
                    }}
                  />

                  <div>
                    <div className="font-medium">{transaction.description || "İsimsiz İşlem"}</div>
                    <div className="text-sm text-gray-600">
                      {transaction.date} • {getCategoryName(transaction.category_id)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge variant={transaction.type === "income" ? "default" : "destructive"}>
                    {transaction.type === "income" ? "Gelir" : "Gider"}
                  </Badge>

                  <div className={`font-bold ${transaction.type === "income" ? "text-green-600" : "text-red-600"}`}>
                    {transaction.type === "income" ? "+" : "-"}
                    {formatCurrency(Math.abs(transaction.amount))}
                  </div>

                  <Button size="sm" variant="outline" onClick={() => handleDelete(transaction.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {transactions.length === 0 && <div className="text-center py-8 text-gray-500">Henüz işlem bulunmuyor</div>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
