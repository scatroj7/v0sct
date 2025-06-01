"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Trash2, RefreshCw, TrendingUp, TrendingDown, Plus, Edit } from "lucide-react"
import { investmentCategories, investmentTypes, stockSymbols } from "@/app/lib/investment-service"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DatePicker } from "@/components/ui/date-picker"

interface Investment {
  id: string
  name: string
  category: string
  type: string
  amount: number
  purchase_price: number
  current_price?: number
  symbol?: string
  purchase_date: string
  notes?: string
  created_at: string
  updated_at: string
  current_value?: number
  profit?: number
  profit_percentage?: number
}

export default function InvestmentsTab() {
  const [investments, setInvestments] = useState<Investment[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null)

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    type: "",
    amount: "",
    purchase_price: "",
    symbol: "",
    purchase_date: new Date(),
    notes: "",
  })

  useEffect(() => {
    fetchInvestments()
  }, [])

  const fetchInvestments = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/investments")
      if (response.ok) {
        const data = await response.json()
        setInvestments(data)
      }
    } catch (error) {
      console.error("Yatırımlar yüklenirken hata:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddInvestment = async () => {
    // Daha detaylı validation
    if (!formData.category) {
      alert("Lütfen bir kategori seçin.")
      return
    }

    if (!formData.type) {
      alert("Lütfen bir tür seçin.")
      return
    }

    if (formData.category === "stock" && !formData.symbol) {
      alert("Lütfen bir hisse senedi seçin.")
      return
    }

    if (formData.category === "crypto" && !formData.name.trim()) {
      alert("Lütfen yatırım adını girin.")
      return
    }

    if (!formData.amount || !formData.purchase_price) {
      alert("Lütfen miktar ve alış fiyatını girin.")
      return
    }

    const amount = Number.parseFloat(formData.amount)
    const purchase_price = Number.parseFloat(formData.purchase_price)

    if (isNaN(amount) || isNaN(purchase_price) || amount <= 0 || purchase_price <= 0) {
      alert("Lütfen geçerli sayısal değerler girin.")
      return
    }

    try {
      const investmentData = {
        name: formData.name.trim() || formData.type,
        category: formData.category,
        type: formData.type,
        amount: amount,
        purchase_price: purchase_price,
        symbol: formData.symbol || formData.type,
        purchase_date: formData.purchase_date.toISOString().split("T")[0],
        notes: formData.notes.trim(),
        user_id: "admin",
      }

      console.log("Gönderilen veri:", investmentData)

      const response = await fetch("/api/investments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(investmentData),
      })

      if (response.ok) {
        await fetchInvestments()
        resetForm()
        setIsAddModalOpen(false)
      } else {
        const errorData = await response.json()
        console.error("API Error:", errorData)
        alert(`Yatırım eklenirken hata oluştu: ${errorData.details || errorData.error}`)
      }
    } catch (error) {
      console.error("Yatırım eklenirken hata:", error)
      alert("Yatırım eklenirken hata oluştu.")
    }
  }

  const handleEditInvestment = async () => {
    if (!selectedInvestment) return

    // Validation
    if (!formData.category) {
      alert("Lütfen bir kategori seçin.")
      return
    }

    if (!formData.type) {
      alert("Lütfen bir tür seçin.")
      return
    }

    if (formData.category === "stock" && !formData.symbol) {
      alert("Lütfen bir hisse senedi seçin.")
      return
    }

    if (!formData.amount || !formData.purchase_price) {
      alert("Lütfen miktar ve alış fiyatını girin.")
      return
    }

    const amount = Number.parseFloat(formData.amount)
    const purchase_price = Number.parseFloat(formData.purchase_price)

    if (isNaN(amount) || isNaN(purchase_price) || amount <= 0 || purchase_price <= 0) {
      alert("Lütfen geçerli sayısal değerler girin.")
      return
    }

    try {
      const investmentData = {
        name: formData.name.trim() || formData.type,
        category: formData.category,
        type: formData.type,
        amount: amount,
        purchase_price: purchase_price,
        symbol: formData.symbol || formData.type,
        purchase_date: formData.purchase_date.toISOString().split("T")[0],
        notes: formData.notes.trim(),
      }

      console.log("Güncellenen veri:", investmentData)

      const response = await fetch(`/api/investments/${selectedInvestment.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(investmentData),
      })

      if (response.ok) {
        await fetchInvestments()
        resetForm()
        setIsEditModalOpen(false)
        setSelectedInvestment(null)
      } else {
        const errorData = await response.json()
        console.error("API Error:", errorData)
        alert(`Yatırım güncellenirken hata oluştu: ${errorData.details || errorData.error}`)
      }
    } catch (error) {
      console.error("Yatırım güncellenirken hata:", error)
      alert("Yatırım güncellenirken hata oluştu.")
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      category: "",
      type: "",
      amount: "",
      purchase_price: "",
      symbol: "",
      purchase_date: new Date(),
      notes: "",
    })
  }

  const handleDeleteInvestment = async (id: string) => {
    if (!confirm("Bu yatırımı silmek istediğinizden emin misiniz?")) {
      return
    }

    try {
      const response = await fetch(`/api/investments/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await fetchInvestments()
      } else {
        alert("Yatırım silinirken hata oluştu.")
      }
    } catch (error) {
      console.error("Yatırım silinirken hata:", error)
      alert("Yatırım silinirken hata oluştu.")
    }
  }

  const openEditModal = (investment: Investment) => {
    setSelectedInvestment(investment)
    setFormData({
      name: investment.name,
      category: investment.category,
      type: investment.type,
      amount: investment.amount.toString(),
      purchase_price: investment.purchase_price.toString(),
      symbol: investment.symbol || "",
      purchase_date: investment.purchase_date ? new Date(investment.purchase_date) : new Date(),
      notes: investment.notes || "",
    })
    setIsEditModalOpen(true)
  }

  const refreshPrices = async () => {
    setRefreshing(true)
    try {
      // Her yatırım için güncel fiyatı çek
      for (const investment of investments) {
        await fetch(`/api/investments/${investment.id}`)
      }
      await fetchInvestments()
    } catch (error) {
      console.error("Fiyatlar güncellenirken hata:", error)
    } finally {
      setRefreshing(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const calculateTotalValue = (category?: string) => {
    return investments
      .filter((inv) => !category || category === "all" || inv.category === category)
      .reduce((total, investment) => {
        const currentPrice = investment.current_price || investment.purchase_price
        return total + investment.amount * currentPrice
      }, 0)
  }

  const calculateTotalInvestment = (category?: string) => {
    return investments
      .filter((inv) => !category || category === "all" || inv.category === category)
      .reduce((total, investment) => total + investment.amount * investment.purchase_price, 0)
  }

  const calculateTotalGain = (category?: string) => {
    return calculateTotalValue(category) - calculateTotalInvestment(category)
  }

  const getAvailableTypes = () => {
    if (!formData.category) return []
    return investmentTypes[formData.category as keyof typeof investmentTypes] || []
  }

  const getAvailableSymbols = () => {
    if (formData.category !== "stock" || !formData.type) return []
    return stockSymbols[formData.type as keyof typeof stockSymbols] || []
  }

  const getCategoryLabel = (category: string) => {
    const cat = investmentCategories.find((c) => c.value === category)
    return cat ? cat.label : category
  }

  const getTypeLabel = (category: string, type: string) => {
    if (!category) return type
    const types = investmentTypes[category as keyof typeof investmentTypes] || []
    const typeObj = types.find((t) => t.value === type)
    return typeObj ? typeObj.label : type
  }

  const getSymbolLabel = (type: string, symbol: string) => {
    if (!type || formData.category !== "stock") return symbol
    const symbols = stockSymbols[type as keyof typeof stockSymbols] || []
    const symbolObj = symbols.find((s) => s.value === symbol)
    return symbolObj ? symbolObj.label : symbol
  }

  const filteredInvestments = investments.filter((inv) => activeTab === "all" || inv.category === activeTab)

  const handleCategoryChange = (value: string) => {
    setFormData({
      ...formData,
      category: value,
      type: "",
      symbol: "",
      name: "",
    })
  }

  const handleTypeChange = (value: string) => {
    const newFormData = { ...formData, type: value, symbol: "" }

    // Altın ve döviz için tür değerini isim olarak da kullan
    if (formData.category === "gold" || formData.category === "forex") {
      const typeObj = getAvailableTypes().find((t) => t.value === value)
      if (typeObj) {
        newFormData.name = typeObj.label
      }
    }

    // Kripto için tür değerini isim olarak kullan
    if (formData.category === "crypto") {
      const typeObj = getAvailableTypes().find((t) => t.value === value)
      if (typeObj) {
        newFormData.name = typeObj.label
      }
    }

    setFormData(newFormData)
  }

  const handleSymbolChange = (value: string) => {
    const newFormData = { ...formData, symbol: value }

    // Hisse senetleri için sembol değerini isim olarak da kullan
    if (formData.category === "stock") {
      const symbolObj = getAvailableSymbols().find((s) => s.value === value)
      if (symbolObj) {
        newFormData.name = symbolObj.label
      }
    }

    setFormData(newFormData)
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">Yükleniyor...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Yatırımlar</h2>
        <div className="flex gap-2">
          <Button onClick={refreshPrices} disabled={refreshing} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Fiyatları Güncelle
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Yeni Yatırım
          </Button>
        </div>
      </div>

      {/* Özet kartları */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Yatırım</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(calculateTotalInvestment(activeTab))}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Güncel Değer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(calculateTotalValue(activeTab))}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Kar/Zarar</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold flex items-center ${
                calculateTotalGain(activeTab) >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {calculateTotalGain(activeTab) >= 0 ? (
                <TrendingUp className="h-5 w-5 mr-1" />
              ) : (
                <TrendingDown className="h-5 w-5 mr-1" />
              )}
              {formatCurrency(calculateTotalGain(activeTab))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Kategori filtreleme */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full overflow-x-auto flex-nowrap">
          <TabsTrigger value="all">Tümü</TabsTrigger>
          {investmentCategories.map((category) => (
            <TabsTrigger key={category.value} value={category.value}>
              {category.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Yatırım listesi */}
      <div className="space-y-4">
        {filteredInvestments.map((investment) => {
          const currentPrice = investment.current_price || investment.purchase_price
          const currentValue = investment.amount * currentPrice
          const totalInvestment = investment.amount * investment.purchase_price
          const gain = currentValue - totalInvestment
          const gainPercentage = ((gain / totalInvestment) * 100).toFixed(2)

          return (
            <Card key={investment.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{investment.name}</h3>
                      <Badge variant="secondary">{getCategoryLabel(investment.category)}</Badge>
                      <Badge variant="outline">{getTypeLabel(investment.category, investment.type)}</Badge>
                      {investment.symbol && investment.symbol !== investment.type && (
                        <Badge variant="outline" className="bg-slate-100">
                          {investment.symbol}
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-4">
                      <div>
                        <p className="text-sm text-gray-500">Miktar</p>
                        <p className="font-semibold">{investment.amount}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Alış Fiyatı</p>
                        <p className="font-semibold">{formatCurrency(investment.purchase_price)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Güncel Fiyat</p>
                        <p className="font-semibold">{formatCurrency(currentPrice)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Yatırım Tutarı</p>
                        <p className="font-semibold">{formatCurrency(totalInvestment)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Güncel Değer</p>
                        <p className="font-semibold">{formatCurrency(currentValue)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Kar/Zarar</p>
                        <p
                          className={`font-semibold flex items-center ${gain >= 0 ? "text-green-600" : "text-red-600"}`}
                        >
                          {gain >= 0 ? (
                            <TrendingUp className="h-4 w-4 mr-1" />
                          ) : (
                            <TrendingDown className="h-4 w-4 mr-1" />
                          )}
                          {formatCurrency(gain)} ({gainPercentage}%)
                        </p>
                      </div>
                    </div>

                    {investment.notes && (
                      <div className="mt-3">
                        <p className="text-sm text-gray-500">Notlar</p>
                        <p className="text-sm">{investment.notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditModal(investment)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteInvestment(investment.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredInvestments.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          {activeTab === "all"
            ? "Henüz yatırım eklenmemiş. 'Yeni Yatırım' butonuna tıklayarak yeni bir yatırım ekleyebilirsiniz."
            : `Bu kategoride henüz yatırım bulunmuyor. 'Yeni Yatırım' butonuna tıklayarak ${
                investmentCategories.find((c) => c.value === activeTab)?.label || ""
              } kategorisinde yatırım ekleyebilirsiniz.`}
        </div>
      )}

      {/* Yeni Yatırım Ekleme Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yeni Yatırım Ekle</DialogTitle>
            <DialogDescription>Yatırım bilgilerini girin. Önce kategori, sonra tür seçin.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Kategori *</label>
                <Select value={formData.category} onValueChange={handleCategoryChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Kategori seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {investmentCategories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.category && (
                <div>
                  <label className="text-sm font-medium mb-1 block">Tür *</label>
                  <Select value={formData.type} onValueChange={handleTypeChange} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Tür seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableTypes().map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.category === "stock" && formData.type && (
                <div>
                  <label className="text-sm font-medium mb-1 block">Hisse Senedi *</label>
                  <Select value={formData.symbol} onValueChange={handleSymbolChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Hisse seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableSymbols().map((symbol) => (
                        <SelectItem key={symbol.value} value={symbol.value}>
                          {symbol.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.category === "crypto" && (
                <div>
                  <label className="text-sm font-medium mb-1 block">Yatırım Adı *</label>
                  <Input
                    type="text"
                    placeholder="Örn: Bitcoin"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              )}

              <div>
                <label className="text-sm font-medium mb-1 block">Miktar *</label>
                <Input
                  type="number"
                  step="0.00001"
                  placeholder="Örn: 0.5"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Alış Fiyatı (TL) *</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Örn: 1750000"
                  value={formData.purchase_price}
                  onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Alış Tarihi</label>
                <DatePicker
                  date={formData.purchase_date}
                  onSelect={(date) => setFormData({ ...formData, purchase_date: date || new Date() })}
                  placeholder="Alış tarihini seçin"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Notlar</label>
              <Textarea
                placeholder="Opsiyonel notlar"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleAddInvestment}>Yatırım Ekle</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Yatırım Düzenleme Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yatırım Düzenle</DialogTitle>
            <DialogDescription>Yatırım bilgilerini güncelleyin.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Kategori *</label>
                <Select value={formData.category} onValueChange={handleCategoryChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Kategori seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {investmentCategories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.category && (
                <div>
                  <label className="text-sm font-medium mb-1 block">Tür *</label>
                  <Select value={formData.type} onValueChange={handleTypeChange} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Tür seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableTypes().map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.category === "stock" && formData.type && (
                <div>
                  <label className="text-sm font-medium mb-1 block">Hisse Senedi *</label>
                  <Select value={formData.symbol} onValueChange={handleSymbolChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Hisse seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableSymbols().map((symbol) => (
                        <SelectItem key={symbol.value} value={symbol.value}>
                          {symbol.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.category === "crypto" && (
                <div>
                  <label className="text-sm font-medium mb-1 block">Yatırım Adı *</label>
                  <Input
                    type="text"
                    placeholder="Örn: Bitcoin"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              )}

              <div>
                <label className="text-sm font-medium mb-1 block">Miktar *</label>
                <Input
                  type="number"
                  step="0.00001"
                  placeholder="Örn: 0.5"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Alış Fiyatı (TL) *</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Örn: 1750000"
                  value={formData.purchase_price}
                  onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Alış Tarihi</label>
                <DatePicker
                  date={formData.purchase_date}
                  onSelect={(date) => setFormData({ ...formData, purchase_date: date || new Date() })}
                  placeholder="Alış tarihini seçin"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Notlar</label>
              <Textarea
                placeholder="Opsiyonel notlar"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleEditInvestment}>Değişiklikleri Kaydet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
