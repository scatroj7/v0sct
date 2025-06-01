"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, FileText, Filter, PieChart, TrendingUp } from "lucide-react"
import { format, subDays, subMonths, startOfMonth, endOfMonth, addMonths } from "date-fns"
import { tr } from "date-fns/locale"
import { localStorageManager } from "@/app/lib/local-storage-manager"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts"

interface Transaction {
  id: string
  amount: number
  description: string
  type: string
  category_name?: string
  category_id?: string
  currency: string
  date: string
  created_at: string
}

interface Category {
  id: string
  name: string
  type: string
  color: string
}

interface CategorySummary {
  name: string
  value: number
  color: string
}

interface MonthlyData {
  month: string
  income: number
  expense: number
  balance: number
}

// Döviz kurları cache
const CACHE_DURATION = 5 * 60 * 1000 // 5 dakika
const exchangeRateCache: Record<string, { rate: number; timestamp: number }> = {}

export default function ReportsTab() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [dateFilter, setDateFilter] = useState("last30days")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [amountRange, setAmountRange] = useState([0, 100000])
  const [maxAmount, setMaxAmount] = useState(100000)
  const [categoryData, setCategoryData] = useState<CategorySummary[]>([])
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [topCategories, setTopCategories] = useState<CategorySummary[]>([])
  const [reportTab, setReportTab] = useState("overview")
  const [chartDescription, setChartDescription] = useState("Son 6 ay")
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({})

  // Döviz kurlarını çek
  const fetchExchangeRates = async (): Promise<Record<string, number>> => {
    try {
      console.log("💱 Güncel döviz kurları çekiliyor...")

      // Cache kontrolü
      const cachedRates: Record<string, number> = {}
      let needsFetch = false

      const currencies = ["USD", "EUR", "GBP", "CHF", "JPY", "CAD", "AUD"]

      for (const currency of currencies) {
        const cached = exchangeRateCache[currency]
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          cachedRates[currency] = cached.rate
        } else {
          needsFetch = true
          break
        }
      }

      if (!needsFetch && Object.keys(cachedRates).length === currencies.length) {
        console.log("✅ Cache'den döviz kurları alındı:", cachedRates)
        return cachedRates
      }

      // Önce güncel manuel kurları dene
      const currentRates = await getCurrentExchangeRates()

      // Cache'e kaydet
      for (const [currency, rate] of Object.entries(currentRates)) {
        exchangeRateCache[currency] = {
          rate,
          timestamp: Date.now(),
        }
      }

      console.log("✅ Güncel kurlar alındı:", currentRates)
      return currentRates
    } catch (error) {
      console.error("❌ Döviz kuru çekilirken hata:", error)
      return getManualExchangeRates()
    }
  }

  // Güncel döviz kurları (gerçek değerler)
  const getCurrentExchangeRates = async (): Promise<Record<string, number>> => {
    try {
      // Alternatif API deneyelim - exchangerate-api.com
      const response = await fetch("https://api.exchangerate-api.com/v4/latest/TRY")

      if (response.ok) {
        const data = await response.json()
        const rates = data.rates

        return {
          USD: 1 / (rates.USD || 0.0304), // TRY/USD
          EUR: 1 / (rates.EUR || 0.0284), // TRY/EUR
          GBP: 1 / (rates.GBP || 0.0241), // TRY/GBP
          CHF: 1 / (rates.CHF || 0.0272), // TRY/CHF
          JPY: 1 / (rates.JPY || 4.55), // TRY/JPY
          CAD: 1 / (rates.CAD || 0.0426), // TRY/CAD
          AUD: 1 / (rates.AUD || 0.0471), // TRY/AUD
        }
      }

      throw new Error("API yanıt vermedi")
    } catch (error) {
      console.log("API hatası, güncel manuel kurlar kullanılıyor")
      return getManualExchangeRates()
    }
  }

  // Manuel döviz kurları (fallback)
  const getManualExchangeRates = (): Record<string, number> => {
    return {
      USD: 34.25, // Güncel USD/TRY
      EUR: 36.15, // Güncel EUR/TRY
      GBP: 43.2, // Güncel GBP/TRY
      CHF: 38.45, // Güncel CHF/TRY
      JPY: 0.23, // Güncel JPY/TRY
      CAD: 24.8, // Güncel CAD/TRY
      AUD: 22.15, // Güncel AUD/TRY
    }
  }

  // Fiyat parsing (Türkiye formatı)
  const parsePrice = (priceStr: string | number): number | null => {
    if (typeof priceStr === "number") return priceStr
    if (!priceStr) return null

    const cleanPrice = String(priceStr)
      .replace(/\s/g, "") // Boşlukları kaldır
      .replace(/\./g, "") // Binlik ayırıcı noktaları kaldır
      .replace(",", ".") // Virgülü noktaya çevir

    const price = Number.parseFloat(cleanPrice)
    return isNaN(price) ? null : price
  }

  // Tutarı TRY'ye çevir
  const convertToTRY = async (amount: number, currency: string): Promise<number> => {
    if (currency === "TRY") {
      return amount
    }

    const rates = await fetchExchangeRates()
    const rate = rates[currency]

    if (!rate) {
      console.warn(`❌ ${currency} kuru bulunamadı, orijinal tutar kullanılıyor`)
      return amount
    }

    const convertedAmount = amount * rate
    console.log(`💱 ${amount} ${currency} = ${convertedAmount.toFixed(2)} TRY (kur: ${rate})`)
    return convertedAmount
  }

  // Verileri yükle
  useEffect(() => {
    const loadData = async () => {
      const loadedTransactions = localStorageManager.getTransactions()
      const loadedCategories = localStorageManager.getCategories()

      // Döviz kurlarını çek
      const rates = await fetchExchangeRates()
      setExchangeRates(rates)

      // Kategorileri ekle
      const transactionsWithCategories = loadedTransactions.map((transaction) => {
        const category = loadedCategories.find((cat) => cat.id === transaction.category_id)
        return {
          ...transaction,
          currency: transaction.currency || "TRY", // Varsayılan para birimi
          category_name: category?.name || "Bilinmeyen",
          category_color: category?.color,
        }
      })

      setAllTransactions(transactionsWithCategories)
      setCategories(loadedCategories)

      // Maksimum tutarı belirle (TRY cinsinden)
      let maxTrans = 0
      for (const transaction of transactionsWithCategories) {
        const tryAmount = await convertToTRY(transaction.amount, transaction.currency)
        if (tryAmount > maxTrans) {
          maxTrans = tryAmount
        }
      }
      maxTrans = Math.max(maxTrans, 10000)
      setMaxAmount(maxTrans)
      setAmountRange([0, maxTrans])

      // Filtreleri uygula
      applyFilters(transactionsWithCategories, dateFilter, categoryFilter, typeFilter, [0, maxTrans])
    }

    loadData()
  }, [])

  // Filtreleri uygula
  const applyFilters = (
    transactionsToFilter: Transaction[],
    date: string,
    category: string,
    type: string,
    amount: number[],
  ) => {
    let filtered = [...transactionsToFilter]

    // Tarih filtresi
    const now = new Date()
    let startDate: Date | null = null
    let endDate: Date | null = null
    let chartDesc = "Son 6 ay"

    switch (date) {
      case "today":
        startDate = new Date(now.setHours(0, 0, 0, 0))
        endDate = new Date(now.setHours(23, 59, 59, 999))
        chartDesc = "Bugün"
        break
      case "last7days":
        startDate = subDays(now, 7)
        endDate = now
        chartDesc = "Son 7 gün"
        break
      case "last30days":
        startDate = subDays(now, 30)
        endDate = now
        chartDesc = "Son 30 gün"
        break
      case "thisMonth":
        startDate = startOfMonth(now)
        endDate = endOfMonth(now)
        chartDesc = "Bu ay"
        break
      case "nextMonth":
        const nextMonth = addMonths(now, 1)
        startDate = startOfMonth(nextMonth)
        endDate = endOfMonth(nextMonth)
        chartDesc = "Sonraki ay"
        break
      case "last3months":
        startDate = subMonths(now, 3)
        endDate = now
        chartDesc = "Son 3 ay"
        break
      case "last6months":
        startDate = subMonths(now, 6)
        endDate = now
        chartDesc = "Son 6 ay"
        break
      case "next6months":
        startDate = startOfMonth(now) // Bu ayın başından başla
        endDate = endOfMonth(addMonths(now, 5)) // 6 ay sonrasının sonuna kadar
        chartDesc = "Gelecek 6 ay"
        break
      case "thisYear":
        startDate = new Date(now.getFullYear(), 0, 1)
        endDate = new Date(now.getFullYear(), 11, 31)
        chartDesc = "Bu yıl"
        break
      case "all":
      default:
        chartDesc = "Tüm zamanlar"
        break
    }

    setChartDescription(chartDesc)

    if (startDate && endDate) {
      filtered = filtered.filter((transaction) => {
        const transactionDate = new Date(transaction.date)
        return transactionDate >= startDate! && transactionDate <= endDate!
      })
    }

    // Kategori filtresi
    if (category !== "all") {
      filtered = filtered.filter((transaction) => transaction.category_id === category)
    }

    // Tür filtresi
    if (type !== "all") {
      filtered = filtered.filter((transaction) => transaction.type === type)
    }

    // Tutar filtresi (TRY cinsinden)
    const filterByAmount = async () => {
      const filteredByAmount = []
      for (const transaction of filtered) {
        const tryAmount = await convertToTRY(transaction.amount, transaction.currency)
        if (tryAmount >= amount[0] && tryAmount <= amount[1]) {
          filteredByAmount.push(transaction)
        }
      }
      setTransactions(filteredByAmount)
      prepareChartData(filteredByAmount, date, startDate, endDate)
    }

    filterByAmount()
  }

  // Grafik verilerini hazırla
  const prepareChartData = async (
    filteredTransactions: Transaction[],
    dateFilterType: string,
    startDate: Date | null,
    endDate: Date | null,
  ) => {
    console.log("📊 Grafik verileri hazırlanıyor (TRY cinsinden)...")

    // Kategori bazlı veri - sadece giderler için (TRY cinsinden)
    const expenseCategoryMap = new Map<string, { name: string; value: number; color: string }>()
    const incomeCategoryMap = new Map<string, { name: string; value: number; color: string }>()

    for (const transaction of filteredTransactions) {
      const categoryId = transaction.category_id || "unknown"
      const category = categories.find((c) => c.id === categoryId)
      const categoryName = category?.name || "Bilinmeyen"
      const categoryColor = category?.color || "#888888"

      // Tutarı TRY'ye çevir
      const tryAmount = await convertToTRY(transaction.amount, transaction.currency)

      if (transaction.type === "expense") {
        if (!expenseCategoryMap.has(categoryId)) {
          expenseCategoryMap.set(categoryId, { name: categoryName, value: 0, color: categoryColor })
        }
        const categoryData = expenseCategoryMap.get(categoryId)!
        categoryData.value += tryAmount
      } else if (transaction.type === "income") {
        if (!incomeCategoryMap.has(categoryId)) {
          incomeCategoryMap.set(categoryId, { name: categoryName, value: 0, color: categoryColor })
        }
        const categoryData = incomeCategoryMap.get(categoryId)!
        categoryData.value += tryAmount
      }
    }

    // Sadece gider kategorilerini kullan
    const categoryDataArray = Array.from(expenseCategoryMap.values())
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)

    setCategoryData(categoryDataArray)
    setTopCategories(categoryDataArray.slice(0, 5))

    // Aylık veri (TRY cinsinden)
    const monthlyMap = new Map<string, MonthlyData>()
    const now = new Date()

    // Tarih filtresine göre aylık veri oluştur
    if (dateFilterType === "next6months") {
      // Gelecek 6 ay için - bu aydan başlayarak
      for (let i = 0; i < 6; i++) {
        const date = addMonths(startOfMonth(now), i)
        const monthKey = format(date, "yyyy-MM")
        const monthName = format(date, "MMM yyyy", { locale: tr })
        monthlyMap.set(monthKey, { month: monthName, income: 0, expense: 0, balance: 0 })
      }
    } else if (dateFilterType === "all") {
      // Tüm zamanlar için - işlemlerin tarihlerine göre dinamik oluştur
      // Önce boş harita oluştur, sonra işlemlerden dolduracağız
    } else if (dateFilterType === "thisYear") {
      // Bu yıl için - yılın tüm ayları
      for (let i = 0; i < 12; i++) {
        const date = new Date(now.getFullYear(), i, 1)
        const monthKey = format(date, "yyyy-MM")
        const monthName = format(date, "MMM yyyy", { locale: tr })
        monthlyMap.set(monthKey, { month: monthName, income: 0, expense: 0, balance: 0 })
      }
    } else {
      // Diğer filtreler için son 6 ay
      for (let i = 5; i >= 0; i--) {
        const date = subMonths(now, i)
        const monthKey = format(date, "yyyy-MM")
        const monthName = format(date, "MMM yyyy", { locale: tr })
        monthlyMap.set(monthKey, { month: monthName, income: 0, expense: 0, balance: 0 })
      }
    }

    // İşlemleri aylara dağıt (TRY cinsinden)
    for (const transaction of filteredTransactions) {
      const date = new Date(transaction.date)
      const monthKey = format(date, "yyyy-MM")

      if (!monthlyMap.has(monthKey)) {
        // Eğer ay haritada yoksa ve "all" filtresi ise ekle
        if (dateFilterType === "all") {
          const monthName = format(date, "MMM yyyy", { locale: tr })
          monthlyMap.set(monthKey, { month: monthName, income: 0, expense: 0, balance: 0 })
        } else {
          // Diğer filtreler için tarih aralığı dışındaysa atla
          console.log(`İşlem ${transaction.description} tarih aralığı dışında: ${transaction.date}`)
          continue
        }
      }

      const monthData = monthlyMap.get(monthKey)!
      const tryAmount = await convertToTRY(transaction.amount, transaction.currency)

      if (transaction.type === "income") {
        monthData.income += tryAmount
      } else {
        monthData.expense += tryAmount
      }
      monthData.balance = monthData.income - monthData.expense
    }

    // Ay sırasına göre sırala
    let monthlyDataArray: MonthlyData[]

    if (dateFilterType === "all") {
      // Tüm zamanlar için tarih sırasına göre sırala
      monthlyDataArray = Array.from(monthlyMap.entries())
        .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
        .map(([, value]) => value)
    } else {
      // Diğer filtreler için ay anahtarına göre sırala
      monthlyDataArray = Array.from(monthlyMap.entries())
        .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
        .map(([, value]) => value)
    }

    console.log("📊 Aylık veri hazırlandı (TRY cinsinden):", monthlyDataArray)
    setMonthlyData(monthlyDataArray)
  }

  // Filtreleri uygula
  const handleApplyFilters = () => {
    applyFilters(allTransactions, dateFilter, categoryFilter, typeFilter, amountRange)
  }

  // Filtreleri sıfırla
  const handleResetFilters = () => {
    setDateFilter("last30days")
    setCategoryFilter("all")
    setTypeFilter("all")
    setAmountRange([0, maxAmount])
    applyFilters(allTransactions, "last30days", "all", "all", [0, maxAmount])
  }

  // Raporu dışa aktar
  const handleExportReport = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      filters: {
        dateFilter,
        categoryFilter,
        typeFilter,
        amountRange,
      },
      exchangeRates: exchangeRates,
      summary: calculateSummary(),
      transactions: transactions,
      categoryData: categoryData,
      monthlyData: monthlyData,
    }

    const dataStr = JSON.stringify(reportData, null, 2)
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)
    const exportFileDefaultName = `finans-rapor-${format(new Date(), "yyyy-MM-dd")}.json`

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  }

  // Özet hesapla (TRY cinsinden)
  const calculateSummary = () => {
    let totalIncome = 0
    let totalExpense = 0
    const transactionCount = transactions.length
    const categoryCount = new Set(transactions.map((t) => t.category_id)).size

    // Async hesaplama için Promise kullan
    const calculateAsync = async () => {
      for (const transaction of transactions) {
        const tryAmount = await convertToTRY(transaction.amount, transaction.currency)
        if (transaction.type === "income") {
          totalIncome += tryAmount
        } else {
          totalExpense += tryAmount
        }
      }

      return {
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
        transactionCount,
        categoryCount,
        averageTransaction: transactionCount > 0 ? (totalIncome + totalExpense) / transactionCount : 0,
      }
    }

    // Sync fallback (mevcut exchange rates kullanarak)
    transactions.forEach((transaction) => {
      let tryAmount = transaction.amount
      if (transaction.currency !== "TRY" && exchangeRates[transaction.currency]) {
        tryAmount = transaction.amount * exchangeRates[transaction.currency]
      }

      if (transaction.type === "income") {
        totalIncome += tryAmount
      } else {
        totalExpense += tryAmount
      }
    })

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      transactionCount,
      categoryCount,
      averageTransaction: transactionCount > 0 ? (totalIncome + totalExpense) / transactionCount : 0,
    }
  }

  // Para formatı (her zaman TRY)
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(amount)
  }

  // Grafik renkleri
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D", "#FF6B6B", "#6B66FF"]

  const summary = calculateSummary()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Finansal Raporlar</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportReport}>
            <Download className="mr-2 h-4 w-4" />
            Raporu İndir
          </Button>
        </div>
      </div>

      {/* Döviz Kuru Bilgisi */}
      {Object.keys(exchangeRates).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-lg">💱</span>
              Güncel Döviz Kurları
              <Badge variant="outline" className="ml-auto">
                {format(new Date(), "dd.MM.yyyy HH:mm")}
              </Badge>
            </CardTitle>
            <CardDescription>Tüm hesaplamalar güncel kurlar kullanılarak TRY cinsinden yapılmaktadır</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {Object.entries(exchangeRates).map(([currency, rate]) => (
                <div key={currency} className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{currency}/TRY</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-gray-100">₺{rate.toFixed(2)}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
                <span>ℹ️</span>
                Kurlar 5 dakikada bir güncellenir. Hesaplamalar gerçek zamanlı kurlar ile yapılır.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtreler */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Rapor Filtreleri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateFilter">Tarih Aralığı</Label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tarih seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Bugün</SelectItem>
                  <SelectItem value="last7days">Son 7 Gün</SelectItem>
                  <SelectItem value="last30days">Son 30 Gün</SelectItem>
                  <SelectItem value="thisMonth">Bu Ay</SelectItem>
                  <SelectItem value="nextMonth">Sonraki Ay</SelectItem>
                  <SelectItem value="last3months">Son 3 Ay</SelectItem>
                  <SelectItem value="last6months">Son 6 Ay</SelectItem>
                  <SelectItem value="next6months">Gelecek 6 Ay</SelectItem>
                  <SelectItem value="thisYear">Bu Yıl</SelectItem>
                  <SelectItem value="all">Tüm Zamanlar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoryFilter">Kategori</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Kategori seçin" />
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="typeFilter">İşlem Türü</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tür seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  <SelectItem value="income">Gelir</SelectItem>
                  <SelectItem value="expense">Gider</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>
                Tutar Aralığı (TRY): {formatCurrency(amountRange[0])} - {formatCurrency(amountRange[1])}
              </Label>
              <Slider
                value={amountRange}
                min={0}
                max={maxAmount}
                step={100}
                onValueChange={setAmountRange}
                className="py-4"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={handleResetFilters}>
              Sıfırla
            </Button>
            <Button onClick={handleApplyFilters}>Filtreleri Uygula</Button>
          </div>
        </CardContent>
      </Card>

      {/* Rapor Sekmeleri */}
      <Tabs value={reportTab} onValueChange={setReportTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-4">
          <TabsTrigger value="overview">
            <FileText className="mr-2 h-4 w-4" />
            Genel Bakış
          </TabsTrigger>
          <TabsTrigger value="categories">
            <PieChart className="mr-2 h-4 w-4" />
            Kategori Analizi
          </TabsTrigger>
          <TabsTrigger value="trends">
            <TrendingUp className="mr-2 h-4 w-4" />
            Trend Analizi
          </TabsTrigger>
          <TabsTrigger value="transactions">
            <FileText className="mr-2 h-4 w-4" />
            İşlem Listesi
          </TabsTrigger>
        </TabsList>

        {/* Genel Bakış */}
        <TabsContent value="overview" className="space-y-4">
          {/* Özet Kartları */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Gelir (TRY)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalIncome)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Gider (TRY)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalExpense)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Net Bakiye (TRY)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${summary.balance >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {formatCurrency(summary.balance)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">İşlem Sayısı</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.transactionCount}</div>
              </CardContent>
            </Card>
          </div>

          {/* Aylık Trend ve Top Kategoriler */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Aylık Trend */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Aylık Gelir/Gider Trendi (TRY)</CardTitle>
                <CardDescription>{chartDescription}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {monthlyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="income"
                          name="Gelir"
                          stroke="#4ade80"
                          fill="#4ade8080"
                          activeDot={{ r: 8 }}
                        />
                        <Area
                          type="monotone"
                          dataKey="expense"
                          name="Gider"
                          stroke="#f87171"
                          fill="#f8717180"
                          activeDot={{ r: 8 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-lg text-gray-500">Grafik için yeterli veri yok</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Top Kategoriler */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>En Çok Gider Yapılan Kategoriler (TRY)</CardTitle>
                <CardDescription>Top 5 kategori</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topCategories.length > 0 ? (
                    topCategories.map((category, index) => (
                      <div key={index} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{category.name}</span>
                          <span className="text-sm">{formatCurrency(category.value)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                          <div
                            className="h-2.5 rounded-full"
                            style={{
                              width: `${Math.min((category.value / topCategories[0].value) * 100, 100)}%`,
                              backgroundColor: category.color,
                            }}
                          ></div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-center h-64">
                      <p className="text-lg text-gray-500">Kategori verisi bulunamadı</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Kategori Analizi */}
        <TabsContent value="categories" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Kategori Pasta Grafiği */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Kategori Dağılımı (TRY)</CardTitle>
                <CardDescription>Harcamaların kategori bazlı dağılımı</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {categoryData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-lg text-gray-500">Grafik için yeterli veri yok</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Kategori Listesi */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Kategori Detayları (TRY)</CardTitle>
                <CardDescription>Tüm kategorilerin harcama tutarları</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                  {categoryData.length > 0 ? (
                    categoryData.map((category, index) => (
                      <div key={index} className="flex justify-between items-center p-2 border rounded-md">
                        <div className="flex items-center">
                          <div
                            className="w-4 h-4 rounded-full mr-2"
                            style={{ backgroundColor: category.color || COLORS[index % COLORS.length] }}
                          ></div>
                          <span className="font-medium">{category.name}</span>
                        </div>
                        <span className="font-bold">{formatCurrency(category.value)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-center h-64">
                      <p className="text-lg text-gray-500">Kategori verisi bulunamadı</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trend Analizi */}
        <TabsContent value="trends" className="space-y-4">
          {/* Aylık Trend Grafiği */}
          <Card>
            <CardHeader>
              <CardTitle>Aylık Gelir/Gider Trendi (TRY)</CardTitle>
              <CardDescription>{chartDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {monthlyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Legend />
                      <Line type="monotone" dataKey="income" name="Gelir" stroke="#4ade80" activeDot={{ r: 8 }} />
                      <Line type="monotone" dataKey="expense" name="Gider" stroke="#f87171" activeDot={{ r: 8 }} />
                      <Line type="monotone" dataKey="balance" name="Bakiye" stroke="#60a5fa" activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-lg text-gray-500">Grafik için yeterli veri yok</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Aylık Veri Tablosu */}
          <Card>
            <CardHeader>
              <CardTitle>Aylık Finansal Veriler (TRY)</CardTitle>
              <CardDescription>{chartDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Ay</th>
                      <th className="text-right py-3 px-4">Gelir</th>
                      <th className="text-right py-3 px-4">Gider</th>
                      <th className="text-right py-3 px-4">Bakiye</th>
                      <th className="text-right py-3 px-4">Durum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyData.length > 0 ? (
                      monthlyData.map((data, index) => (
                        <tr key={index} className="border-b">
                          <td className="py-3 px-4">{data.month}</td>
                          <td className="text-right py-3 px-4 text-green-600">{formatCurrency(data.income)}</td>
                          <td className="text-right py-3 px-4 text-red-600">{formatCurrency(data.expense)}</td>
                          <td className="text-right py-3 px-4">
                            <span className={data.balance >= 0 ? "text-green-600" : "text-red-600"}>
                              {formatCurrency(data.balance)}
                            </span>
                          </td>
                          <td className="text-right py-3 px-4">
                            <Badge
                              variant={data.balance >= 0 ? "success" : "destructive"}
                              className={data.balance >= 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                            >
                              {data.balance >= 0 ? "Pozitif" : "Negatif"}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-gray-500">
                          Veri bulunamadı
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* İşlem Listesi */}
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>İşlem Listesi</CardTitle>
              <CardDescription>Filtrelere göre işlemler (orijinal para birimleri)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Tarih</th>
                      <th className="text-left py-3 px-4">Açıklama</th>
                      <th className="text-left py-3 px-4">Kategori</th>
                      <th className="text-right py-3 px-4">Tutar</th>
                      <th className="text-right py-3 px-4">Para Birimi</th>
                      <th className="text-center py-3 px-4">Tür</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.length > 0 ? (
                      transactions.map((transaction) => (
                        <tr key={transaction.id} className="border-b">
                          <td className="py-3 px-4">
                            {format(new Date(transaction.date), "dd MMM yyyy", { locale: tr })}
                          </td>
                          <td className="py-3 px-4">{transaction.description}</td>
                          <td className="py-3 px-4">{transaction.category_name}</td>
                          <td className="text-right py-3 px-4">
                            <span className={transaction.type === "income" ? "text-green-600" : "text-red-600"}>
                              {new Intl.NumberFormat("tr-TR", {
                                style: "currency",
                                currency: transaction.currency,
                              }).format(transaction.amount)}
                            </span>
                          </td>
                          <td className="text-right py-3 px-4">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                              {transaction.currency}
                            </span>
                          </td>
                          <td className="text-center py-3 px-4">
                            <Badge
                              variant={transaction.type === "income" ? "success" : "destructive"}
                              className={
                                transaction.type === "income"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }
                            >
                              {transaction.type === "income" ? "Gelir" : "Gider"}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-gray-500">
                          İşlem bulunamadı
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
