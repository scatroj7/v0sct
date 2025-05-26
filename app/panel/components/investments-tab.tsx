"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  PlusCircle,
  TrendingUp,
  DollarSign,
  BarChart3,
  RefreshCcw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Pencil,
  Trash2,
  Clock,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { NexusDatePicker } from "@/components/ui/nexus-date-picker"
import { investmentCategories, investmentTypes, stockSymbols } from "@/app/lib/investment-service"
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type Investment = {
  id: string
  name: string
  category: string
  type: string
  amount: number
  purchase_price: number
  current_price: number | null
  current_value?: number
  profit?: number
  profit_percentage?: number
  symbol?: string
  purchase_date: string
  notes?: string
  user_id: string
  last_updated?: string
  created_at: string
  updated_at: string
}

type SortField = "name" | "category" | "amount" | "purchase_price" | "current_price" | "profit" | "profit_percentage"
type SortDirection = "asc" | "desc" | null

export default function InvestmentsTab() {
  const { toast } = useToast()
  const [investments, setInvestments] = useState<Investment[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [openAddDialog, setOpenAddDialog] = useState(false)
  const [openEditDialog, setOpenEditDialog] = useState(false)
  const [currentInvestment, setCurrentInvestment] = useState<Investment | null>(null)
  const [activeTab, setActiveTab] = useState("all")
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // ✅ REACT STATE İLE HOVER KONTROLÜ - DARK MODE UYUMLU
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    category: "crypto",
    type: "",
    amount: "",
    purchase_price: "",
    symbol: "",
    purchase_date: new Date(),
    notes: "",
  })

  // Debug fonksiyonu - hover sorununu analiz etmek için
  const debugHover = () => {
    const table = document.querySelector(".investments-table")
    const rows = document.querySelectorAll(".investments-table tbody tr")

    console.log("=== HOVER DEBUG ===")
    console.log("Table found:", !!table)
    console.log("Rows found:", rows.length)
    console.log("Current hoveredRowId:", hoveredRowId)

    rows.forEach((row, index) => {
      const tds = row.querySelectorAll("td")
      console.log(`Row ${index}:`, {
        classes: row.className,
        computedBg: getComputedStyle(row).backgroundColor,
        tds: tds.length,
      })

      tds.forEach((td, tdIndex) => {
        console.log(`  TD ${tdIndex}:`, {
          computedBg: getComputedStyle(td).backgroundColor,
          styles: td.style.cssText,
        })
      })
    })
  }

  // Test hover fonksiyonu - React state ile test
  const testHover = () => {
    console.log("=== TEST HOVER WITH REACT STATE ===")
    if (investments.length > 0) {
      const firstInvestmentId = investments[0].id
      console.log("Setting hoveredRowId to:", firstInvestmentId)
      setHoveredRowId(firstInvestmentId)

      // 3 saniye sonra sıfırla
      setTimeout(() => {
        console.log("Clearing hoveredRowId")
        setHoveredRowId(null)
      }, 3000)
    }
  }

  // ✅ DARK MODE DETECTION
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    // Dark mode detection
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains("dark")
      setIsDarkMode(isDark)
    }

    checkDarkMode()

    // Dark mode değişikliklerini dinle
    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })

    return () => observer.disconnect()
  }, [])

  // Kategoriye göre filtrelenmiş yatırımlar
  const filteredInvestments = useMemo(() => {
    if (activeTab === "all") return investments
    return investments.filter((inv) => inv.category === activeTab)
  }, [investments, activeTab])

  // Sıralanmış yatırımlar
  const sortedInvestments = useMemo(() => {
    if (!sortField || !sortDirection) return filteredInvestments

    return [...filteredInvestments].sort((a, b) => {
      let comparison = 0

      switch (sortField) {
        case "name":
          comparison = a.name.localeCompare(b.name)
          break
        case "category":
          comparison = a.category.localeCompare(b.category)
          break
        case "amount":
          comparison = a.amount - b.amount
          break
        case "purchase_price":
          comparison = a.purchase_price - b.purchase_price
          break
        case "current_price":
          const aPrice = a.current_price || 0
          const bPrice = b.current_price || 0
          comparison = aPrice - bPrice
          break
        case "profit":
          const aProfit = a.profit || 0
          const bProfit = b.profit || 0
          comparison = aProfit - bProfit
          break
        case "profit_percentage":
          const aPct = a.profit_percentage || 0
          const bPct = b.profit_percentage || 0
          comparison = aPct - bPct
          break
        default:
          comparison = 0
      }

      return sortDirection === "asc" ? comparison : -comparison
    })
  }, [filteredInvestments, sortField, sortDirection])

  // Toplam değerler
  const totals = useMemo(() => {
    const result = {
      totalInvestment: 0,
      totalCurrentValue: 0,
      totalProfit: 0,
      profitPercentage: 0,
      byCategoryInvestment: {} as Record<string, number>,
      byCategoryCurrentValue: {} as Record<string, number>,
      byCategoryProfit: {} as Record<string, number>,
    }

    investments.forEach((inv) => {
      const investmentValue = inv.amount * inv.purchase_price
      const currentValue = inv.current_value || investmentValue
      const profit = currentValue - investmentValue

      result.totalInvestment += investmentValue
      result.totalCurrentValue += currentValue
      result.totalProfit += profit

      // Kategori bazında toplamlar
      if (!result.byCategoryInvestment[inv.category]) {
        result.byCategoryInvestment[inv.category] = 0
        result.byCategoryCurrentValue[inv.category] = 0
        result.byCategoryProfit[inv.category] = 0
      }

      result.byCategoryInvestment[inv.category] += investmentValue
      result.byCategoryCurrentValue[inv.category] += currentValue
      result.byCategoryProfit[inv.category] += profit
    })

    if (result.totalInvestment > 0) {
      result.profitPercentage = (result.totalProfit / result.totalInvestment) * 100
    }

    return result
  }, [investments])

  // Add this function after the component declaration
  const ensureInvestmentsTable = async () => {
    try {
      console.log("Yatırımlar tablosunun varlığı kontrol ediliyor...")
      const response = await fetch("/api/setup-investments-table")
      if (!response.ok) {
        throw new Error("Yatırımlar tablosu oluşturulurken bir hata oluştu")
      }
      console.log("Yatırımlar tablosu hazır")
      return true
    } catch (error) {
      console.error("Yatırımlar tablosu oluşturulurken hata:", error)
      toast({
        title: "Hata",
        description: "Yatırımlar tablosu oluşturulurken bir sorun oluştu",
        variant: "destructive",
      })
      return false
    }
  }

  // Modify the useEffect to call ensureInvestmentsTable first
  // Replace the existing useEffect with this:
  useEffect(() => {
    const initializeInvestments = async () => {
      // Önce tabloyu oluştur
      const tableReady = await ensureInvestmentsTable()
      if (tableReady) {
        // Sonra verileri getir
        fetchInvestments()
      }
    }

    initializeInvestments()
  }, [])

  const fetchInvestments = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/investments")
      if (!response.ok) throw new Error("Yatırımlar yüklenirken bir hata oluştu")

      const data = await response.json()
      setInvestments(data)
      setLastUpdated(new Date())
    } catch (error) {
      console.error("Yatırımlar yüklenirken hata:", error)
      toast({
        title: "Hata",
        description: "Yatırımlar yüklenirken bir sorun oluştu",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const refreshPrices = async () => {
    setRefreshing(true)
    try {
      const response = await fetch("/api/investments")
      if (!response.ok) throw new Error("Fiyatlar güncellenirken bir hata oluştu")

      const data = await response.json()
      setInvestments(data)
      setLastUpdated(new Date())

      toast({
        title: "Başarılı",
        description: "Fiyatlar başarıyla güncellendi",
      })
    } catch (error) {
      console.error("Fiyatlar güncellenirken hata:", error)
      toast({
        title: "Hata",
        description: "Fiyatlar güncellenirken bir sorun oluştu",
        variant: "destructive",
      })
    } finally {
      setRefreshing(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCategoryChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      category: value,
      type: "", // Kategori değiştiğinde türü sıfırla
      symbol: "", // Kategori değiştiğinde sembolü sıfırla
      name: "", // Kategori değiştiğinde ismi sıfırla
    }))
  }

  const handleTypeChange = (value: string) => {
    setFormData((prev) => ({ ...prev, type: value }))

    // Tür seçildiğinde isim ve sembol ayarla
    const category = formData.category

    if (category === "crypto") {
      // Kripto için tür ve sembol aynı olabilir
      setFormData((prev) => ({ ...prev, name: value, symbol: value }))
    } else if (category === "forex" || category === "gold") {
      // Döviz ve altın için tür yeterli, sembol gerekmez
      setFormData((prev) => ({ ...prev, name: value, symbol: "" }))
    } else if (category === "stock") {
      // Hisse senedi için tür isim olarak kullanılır, sembol ayrıca seçilir
      setFormData((prev) => ({ ...prev, name: value }))
    }
  }

  const handleSymbolChange = (value: string) => {
    setFormData((prev) => ({ ...prev, symbol: value }))
  }

  const handleDateChange = (date: Date | null) => {
    if (date) {
      setFormData((prev) => ({ ...prev, purchase_date: date }))
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      category: "crypto",
      type: "",
      amount: "",
      purchase_price: "",
      symbol: "",
      purchase_date: new Date(),
      notes: "",
    })
  }

  const handleAddInvestment = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // Sembol değerini kategori bazında ayarla
      let finalSymbol = formData.symbol
      if (formData.category === "gold" || formData.category === "forex") {
        finalSymbol = formData.type // Altın ve döviz için tür değerini sembol olarak kullan
      }

      const payload = {
        name: formData.name,
        category: formData.category,
        type: formData.type,
        amount: Number.parseFloat(formData.amount),
        purchase_price: Number.parseFloat(formData.purchase_price),
        symbol: finalSymbol,
        purchase_date: formData.purchase_date.toISOString().split("T")[0],
        notes: formData.notes || null,
      }

      const response = await fetch("/api/investments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) throw new Error("Yatırım eklenirken bir hata oluştu")

      await fetchInvestments()
      setOpenAddDialog(false)
      resetForm()

      toast({
        title: "Başarılı",
        description: "Yeni yatırım başarıyla eklendi",
      })
    } catch (error) {
      console.error("Yatırım eklenirken hata:", error)
      toast({
        title: "Hata",
        description: "Yatırım eklenirken bir sorun oluştu",
        variant: "destructive",
      })
    }
  }

  const handleEditInvestment = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentInvestment) return

    try {
      // Sembol değerini kategori bazında ayarla
      let finalSymbol = formData.symbol
      if (formData.category === "gold" || formData.category === "forex") {
        finalSymbol = formData.type // Altın ve döviz için tür değerini sembol olarak kullan
      }

      const payload = {
        name: formData.name,
        category: formData.category,
        type: formData.type,
        amount: Number.parseFloat(formData.amount),
        purchase_price: Number.parseFloat(formData.purchase_price),
        symbol: finalSymbol,
        purchase_date: formData.purchase_date.toISOString().split("T")[0],
        notes: formData.notes || null,
      }

      const response = await fetch(`/api/investments/${currentInvestment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) throw new Error("Yatırım güncellenirken bir hata oluştu")

      await fetchInvestments()
      setOpenEditDialog(false)
      setCurrentInvestment(null)
      resetForm()

      toast({
        title: "Başarılı",
        description: "Yatırım başarıyla güncellendi",
      })
    } catch (error) {
      console.error("Yatırım güncellenirken hata:", error)
      toast({
        title: "Hata",
        description: "Yatırım güncellenirken bir sorun oluştu",
        variant: "destructive",
      })
    }
  }

  const handleDeleteInvestment = async (id: string) => {
    try {
      console.log("Yatırım silme işlemi başladı, ID:", id)

      const response = await fetch(`/api/investments/${id}`, {
        method: "DELETE",
      })

      console.log("API yanıtı alındı:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
      })

      // Content-Type kontrolü
      const contentType = response.headers.get("content-type")
      console.log("Content-Type:", contentType)

      let responseData
      if (contentType && contentType.includes("application/json")) {
        responseData = await response.json()
        console.log("JSON yanıt verisi:", responseData)
      } else {
        // JSON değilse text olarak oku
        const textResponse = await response.text()
        console.log("Text yanıt:", textResponse)
        throw new Error(`Sunucu hatası: ${response.status} - ${textResponse.substring(0, 100)}`)
      }

      if (!response.ok) {
        throw new Error(responseData.error || responseData.message || "Yatırım silinirken bir hata oluştu")
      }

      await fetchInvestments()

      toast({
        title: "Başarılı",
        description: "Yatırım başarıyla silindi",
      })
    } catch (error) {
      console.error("Frontend'te yatırım silme hatası:", {
        error: error,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })

      toast({
        title: "Hata",
        description: error instanceof Error ? error.message : "Yatırım silinirken bir sorun oluştu",
        variant: "destructive",
      })
    }
  }

  const openEditForm = (investment: Investment) => {
    setCurrentInvestment(investment)
    setFormData({
      name: investment.name,
      category: investment.category,
      type: investment.type,
      amount: investment.amount.toString(),
      purchase_price: investment.purchase_price.toString(),
      symbol: investment.symbol || "",
      purchase_date: new Date(investment.purchase_date),
      notes: investment.notes || "",
    })
    setOpenEditDialog(true)
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Aynı alana tekrar tıklandığında sıralama yönünü değiştir
      if (sortDirection === "asc") {
        setSortDirection("desc")
      } else if (sortDirection === "desc") {
        setSortField(null)
        setSortDirection(null)
      } else {
        setSortDirection("asc")
      }
    } else {
      // Farklı bir alana tıklandığında, o alanı artan sırada sırala
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />
    }

    if (sortDirection === "asc") {
      return <ArrowUp className="h-4 w-4 text-blue-500" />
    }

    if (sortDirection === "desc") {
      return <ArrowDown className="h-4 w-4 text-blue-500" />
    }

    return <ArrowUpDown className="h-4 w-4 text-gray-400" />
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "crypto":
        return "bg-orange-500"
      case "gold":
        return "bg-yellow-500"
      case "forex":
        return "bg-green-500"
      case "stock":
        return "bg-blue-500"
      default:
        return "bg-gray-500"
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(value)
  }

  const formatAmount = (value: number) => {
    // Eğer tam sayıysa, ondalık gösterme
    if (value % 1 === 0) {
      return value.toString()
    }
    // Eğer ondalıklıysa, gereksiz sıfırları kaldır
    return Number.parseFloat(value.toFixed(8)).toString()
  }

  const formatPercentage = (value: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "percent",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value / 100)
  }

  const getReturnColor = (value: number) => {
    if (value > 0) return "text-green-600"
    if (value < 0) return "text-red-600"
    return "text-gray-600"
  }

  const formatLastUpdated = () => {
    if (!lastUpdated) return ""

    return new Intl.DateTimeFormat("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(lastUpdated)
  }

  // Kategori bazında sembol alanının gösterilip gösterilmeyeceğini belirle
  const showSymbolField = formData.category === "crypto" || formData.category === "stock"

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Yatırımlarım</h2>
        <div className="flex gap-2 items-center">
          {/* Debug butonları */}
          <Button variant="outline" size="sm" onClick={debugHover}>
            Debug Hover
          </Button>
          <Button variant="outline" size="sm" onClick={testHover}>
            Test React State
          </Button>

          {lastUpdated && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center text-sm text-gray-500 mr-2">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>Son Güncelleme: {formatLastUpdated()}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Fiyat verileri en son bu saatte güncellendi</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <Button variant="outline" onClick={refreshPrices} disabled={refreshing} className="flex items-center gap-1">
            <RefreshCcw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Güncelleniyor..." : "Fiyatları Güncelle"}
          </Button>
          <Dialog open={openAddDialog} onOpenChange={setOpenAddDialog}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  resetForm()
                  setOpenAddDialog(true)
                }}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Yeni Yatırım Ekle
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Yeni Yatırım Ekle</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddInvestment} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Kategori</Label>
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
                  <div className="space-y-2">
                    <Label htmlFor="type">{formData.category === "stock" ? "Hisse Senedi Türü" : "Tür"}</Label>
                    <Select value={formData.type} onValueChange={handleTypeChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tür seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {formData.category &&
                          investmentTypes[formData.category as keyof typeof investmentTypes]?.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Sadece hisse senedi için sembol seçimi göster */}
                {formData.category === "stock" && formData.type && (
                  <div className="space-y-2">
                    <Label htmlFor="symbol">Hisse Senedi Sembolü</Label>
                    <Select value={formData.symbol} onValueChange={handleSymbolChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sembol seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {stockSymbols[formData.type as keyof typeof stockSymbols]?.map((symbol) => (
                          <SelectItem key={symbol.value} value={symbol.value}>
                            {symbol.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Sadece kripto için sembol alanı göster */}
                {formData.category === "crypto" && (
                  <div className="space-y-2">
                    <Label htmlFor="symbol">Kripto Para Sembolü</Label>
                    <Input id="symbol" name="symbol" value={formData.symbol} onChange={handleInputChange} />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Miktar</Label>
                    <Input
                      id="amount"
                      name="amount"
                      type="number"
                      step="0.000001"
                      value={formData.amount}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="purchase_price">Alış Fiyatı (₺)</Label>
                    <Input
                      id="purchase_price"
                      name="purchase_price"
                      type="number"
                      step="0.000001"
                      value={formData.purchase_price}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="purchase_date">Alış Tarihi</Label>
                  <NexusDatePicker value={formData.purchase_date} onChange={handleDateChange} className="w-full" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notlar (Opsiyonel)</Label>
                  <Input id="notes" name="notes" value={formData.notes} onChange={handleInputChange} />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setOpenAddDialog(false)}>
                    İptal
                  </Button>
                  <Button type="submit">Ekle</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Yatırım</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <DollarSign className="mr-2 h-4 w-4 text-muted-foreground" />
              <div className="text-2xl font-bold">
                {loading ? <Skeleton className="h-8 w-24" /> : formatCurrency(totals.totalInvestment)}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Güncel Değer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <BarChart3 className="mr-2 h-4 w-4 text-muted-foreground" />
              <div className="text-2xl font-bold">
                {loading ? <Skeleton className="h-8 w-24" /> : formatCurrency(totals.totalCurrentValue)}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Kar/Zarar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <TrendingUp className="mr-2 h-4 w-4 text-muted-foreground" />
              <div className={`text-2xl font-bold ${getReturnColor(totals.totalProfit)}`}>
                {loading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <>
                    {formatCurrency(totals.totalProfit)}
                    {totals.totalInvestment > 0 && (
                      <span className="text-sm ml-2">({formatPercentage(totals.profitPercentage)})</span>
                    )}
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">Tümü</TabsTrigger>
          <TabsTrigger value="crypto">Kripto</TabsTrigger>
          <TabsTrigger value="gold">Altın</TabsTrigger>
          <TabsTrigger value="forex">Döviz</TabsTrigger>
          <TabsTrigger value="stock">Hisse Senedi</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Yatırım Listesi</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : sortedInvestments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {activeTab === "all"
                    ? 'Henüz yatırım kaydınız bulunmuyor. Yeni bir yatırım eklemek için "Yeni Yatırım Ekle" butonunu kullanabilirsiniz.'
                    : `${
                        activeTab === "crypto"
                          ? "Kripto"
                          : activeTab === "gold"
                            ? "Altın"
                            : activeTab === "forex"
                              ? "Döviz"
                              : "Hisse Senedi"
                      } kategorisinde henüz yatırım kaydınız bulunmuyor.`}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full investments-table">
                    <thead>
                      <tr className="border-b">
                        <th
                          className="text-left py-2 px-2 font-medium text-sm cursor-pointer hover:bg-blue-100 transition-colors duration-200"
                          onClick={() => handleSort("name")}
                        >
                          <div className="flex items-center">Adı {getSortIcon("name")}</div>
                        </th>
                        <th
                          className="text-left py-2 px-2 font-medium text-sm cursor-pointer hover:bg-blue-100 transition-colors duration-200"
                          onClick={() => handleSort("category")}
                        >
                          <div className="flex items-center">Kategori {getSortIcon("category")}</div>
                        </th>
                        <th
                          className="text-left py-2 px-2 font-medium text-sm cursor-pointer hover:bg-blue-100 transition-colors duration-200"
                          onClick={() => handleSort("amount")}
                        >
                          <div className="flex items-center">Miktar {getSortIcon("amount")}</div>
                        </th>
                        <th
                          className="text-left py-2 px-2 font-medium text-sm cursor-pointer hover:bg-blue-100 transition-colors duration-200"
                          onClick={() => handleSort("purchase_price")}
                        >
                          <div className="flex items-center">Alış Fiyatı {getSortIcon("purchase_price")}</div>
                        </th>
                        <th
                          className="text-left py-2 px-2 font-medium text-sm cursor-pointer hover:bg-blue-100 transition-colors duration-200"
                          onClick={() => handleSort("current_price")}
                        >
                          <div className="flex items-center">Güncel Fiyat {getSortIcon("current_price")}</div>
                        </th>
                        <th
                          className="text-left py-2 px-2 font-medium text-sm cursor-pointer hover:bg-blue-100 transition-colors duration-200"
                          onClick={() => handleSort("profit")}
                        >
                          <div className="flex items-center">Kar/Zarar {getSortIcon("profit")}</div>
                        </th>
                        <th className="text-right py-2 px-2 font-medium text-sm">İşlemler</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedInvestments.map((investment) => {
                        // ✅ DARK MODE UYUMLU HOVER RENK KONTROLÜ
                        const isHovered = hoveredRowId === investment.id
                        const hoverStyle = isHovered
                          ? { backgroundColor: isDarkMode ? "rgb(55, 65, 81)" : "rgb(239, 246, 255)" }
                          : {}

                        return (
                          <tr
                            key={investment.id}
                            className="border-b transition-colors duration-200"
                            onMouseEnter={() => {
                              console.log("Mouse Enter - Setting hoveredRowId to:", investment.id)
                              setHoveredRowId(investment.id)
                            }}
                            onMouseLeave={() => {
                              console.log("Mouse Leave - Clearing hoveredRowId")
                              setHoveredRowId(null)
                            }}
                            style={{ cursor: "pointer", ...hoverStyle }} // ✅ TR için dark mode uyumlu inline style
                          >
                            <td className="py-2 px-2" style={hoverStyle}>
                              {" "}
                              {/* ✅ TD için dark mode uyumlu inline style */}
                              <div className="font-medium">{investment.name}</div>
                              {investment.symbol && investment.symbol !== investment.name && (
                                <div className="text-xs text-gray-500">{investment.symbol}</div>
                              )}
                            </td>
                            <td className="py-2 px-2" style={hoverStyle}>
                              {" "}
                              {/* ✅ TD için dark mode uyumlu inline style */}
                              <span
                                className={`px-2 py-1 rounded text-xs text-white ${getCategoryColor(
                                  investment.category,
                                )}`}
                              >
                                {investmentCategories.find((cat) => cat.value === investment.category)?.label}
                              </span>
                            </td>
                            <td className="py-2 px-2" style={hoverStyle}>
                              {" "}
                              {/* ✅ TD için dark mode uyumlu inline style */}
                              {formatAmount(investment.amount)}
                            </td>
                            <td className="py-2 px-2" style={hoverStyle}>
                              {" "}
                              {/* ✅ TD için dark mode uyumlu inline style */}
                              {formatCurrency(investment.purchase_price)}
                            </td>
                            <td className="py-2 px-2" style={hoverStyle}>
                              {" "}
                              {/* ✅ TD için dark mode uyumlu inline style */}
                              {investment.current_price ? formatCurrency(investment.current_price) : "-"}
                            </td>
                            <td className="py-2 px-2" style={hoverStyle}>
                              {" "}
                              {/* ✅ TD için dark mode uyumlu inline style */}
                              {investment.profit ? (
                                <div className={getReturnColor(investment.profit)}>
                                  {formatCurrency(investment.profit)}
                                  {investment.profit_percentage && (
                                    <span className="ml-1">({formatPercentage(investment.profit_percentage)})</span>
                                  )}
                                </div>
                              ) : (
                                "-"
                              )}
                            </td>
                            <td className="py-2 px-2 text-right" style={hoverStyle}>
                              {" "}
                              {/* ✅ TD için dark mode uyumlu inline style */}
                              <div className="flex justify-end space-x-2">
                                <Button variant="outline" size="sm" onClick={() => openEditForm(investment)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="outline" size="sm">
                                      <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Yatırımı Sil</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Bu yatırımı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>İptal</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDeleteInvestment(investment.id)}>
                                        Sil
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Düzenleme Modalı */}
      <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Yatırım Düzenle</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditInvestment} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-category">Kategori</Label>
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
              <div className="space-y-2">
                <Label htmlFor="edit-type">{formData.category === "stock" ? "Hisse Senedi Türü" : "Tür"}</Label>
                <Select value={formData.type} onValueChange={handleTypeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tür seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.category &&
                      investmentTypes[formData.category as keyof typeof investmentTypes]?.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Sadece hisse senedi için sembol seçimi göster */}
            {formData.category === "stock" && formData.type && (
              <div className="space-y-2">
                <Label htmlFor="edit-symbol">Hisse Senedi Sembolü</Label>
                <Select value={formData.symbol} onValueChange={handleSymbolChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sembol seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {stockSymbols[formData.type as keyof typeof stockSymbols]?.map((symbol) => (
                      <SelectItem key={symbol.value} value={symbol.value}>
                        {symbol.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Sadece kripto için sembol alanı göster */}
            {formData.category === "crypto" && (
              <div className="space-y-2">
                <Label htmlFor="edit-symbol">Kripto Para Sembolü</Label>
                <Input id="edit-symbol" name="symbol" value={formData.symbol} onChange={handleInputChange} />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-amount">Miktar</Label>
                <Input
                  id="edit-amount"
                  name="amount"
                  type="number"
                  step="0.000001"
                  value={formData.amount}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-purchase_price">Alış Fiyatı (₺)</Label>
                <Input
                  id="edit-purchase_price"
                  name="purchase_price"
                  type="number"
                  step="0.000001"
                  value={formData.purchase_price}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-purchase_date">Alış Tarihi</Label>
              <NexusDatePicker value={formData.purchase_date} onChange={handleDateChange} className="w-full" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notlar (Opsiyonel)</Label>
              <Input id="edit-notes" name="notes" value={formData.notes} onChange={handleInputChange} />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setOpenEditDialog(false)}>
                İptal
              </Button>
              <Button type="submit">Güncelle</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
