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

  // Verileri yükle
  useEffect(() => {
    const loadedTransactions = localStorageManager.getTransactions()
    const loadedCategories = localStorageManager.getCategories()

    // Kategorileri ekle
    const transactionsWithCategories = loadedTransactions.map((transaction) => {
      const category = loadedCategories.find((cat) => cat.id === transaction.category_id)
      return {
        ...transaction,
        category_name: category?.name || "Bilinmeyen",
        category_color: category?.color,
      }
    })

    setAllTransactions(transactionsWithCategories)
    setCategories(loadedCategories)

    // Maksimum tutarı belirle
    const maxTrans = Math.max(...transactionsWithCategories.map((t) => t.amount), 10000)
    setMaxAmount(maxTrans)
    setAmountRange([0, maxTrans])

    // Filtreleri uygula
    applyFilters(transactionsWithCategories, dateFilter, categoryFilter, typeFilter, [0, maxTrans])
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
        startDate = now
        endDate = addMonths(now, 6)
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

    // Tutar filtresi
    filtered = filtered.filter((transaction) => transaction.amount >= amount[0] && transaction.amount <= amount[1])

    setTransactions(filtered)
    prepareChartData(filtered, date)
  }

  // Grafik verilerini hazırla
  const prepareChartData = (filteredTransactions: Transaction[], dateFilterType: string) => {
    // Kategori bazlı veri - sadece giderler için
    const expenseCategoryMap = new Map<string, { name: string; value: number; color: string }>()
    const incomeCategoryMap = new Map<string, { name: string; value: number; color: string }>()

    filteredTransactions.forEach((transaction) => {
      const categoryId = transaction.category_id || "unknown"
      const category = categories.find((c) => c.id === categoryId)
      const categoryName = category?.name || "Bilinmeyen"
      const categoryColor = category?.color || "#888888"

      if (transaction.type === "expense") {
        if (!expenseCategoryMap.has(categoryId)) {
          expenseCategoryMap.set(categoryId, { name: categoryName, value: 0, color: categoryColor })
        }
        const categoryData = expenseCategoryMap.get(categoryId)!
        categoryData.value += transaction.amount
      } else if (transaction.type === "income") {
        if (!incomeCategoryMap.has(categoryId)) {
          incomeCategoryMap.set(categoryId, { name: categoryName, value: 0, color: categoryColor })
        }
        const categoryData = incomeCategoryMap.get(categoryId)!
        categoryData.value += transaction.amount
      }
    })

    // Sadece gider kategorilerini kullan
    const categoryDataArray = Array.from(expenseCategoryMap.values())
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)

    setCategoryData(categoryDataArray)
    setTopCategories(categoryDataArray.slice(0, 5))

    // Aylık veri
    const monthlyMap = new Map<string, MonthlyData>()
    const now = new Date()

    // Tarih filtresine göre aylık veri oluştur
    if (dateFilterType === "next6months") {
      // Gelecek 6 ay için - bugünden başlayarak
      for (let i = 0; i < 6; i++) {
        const date = addMonths(now, i)
        const monthKey = format(date, "yyyy-MM")
        const monthName = format(date, "MMM yyyy", { locale: tr })
        monthlyMap.set(monthKey, { month: monthName, income: 0, expense: 0, balance: 0 })
      }
    } else if (dateFilterType === "all") {
      // Tüm zamanlar için - işlemlerin tarihlerine göre dinamik oluştur
      // Önce boş harita oluştur, sonra işlemlerden dolduracağız
    } else {
      // Diğer filtreler için son 6 ay
      for (let i = 5; i >= 0; i--) {
        const date = subMonths(now, i)
        const monthKey = format(date, "yyyy-MM")
        const monthName = format(date, "MMM yyyy", { locale: tr })
        monthlyMap.set(monthKey, { month: monthName, income: 0, expense: 0, balance: 0 })
      }
    }

    filteredTransactions.forEach((transaction) => {
      const date = new Date(transaction.date)
      const monthKey = format(date, "yyyy-MM")

      if (!monthlyMap.has(monthKey)) {
        // Eğer ay haritada yoksa ve "all" filtresi ise ekle
        if (dateFilterType === "all") {
          const monthName = format(date, "MMM yyyy", { locale: tr })
          monthlyMap.set(monthKey, { month: monthName, income: 0, expense: 0, balance: 0 })
        } else {
          // Diğer filtreler için tarih aralığı dışındaysa atla
          return
        }
      }

      const monthData = monthlyMap.get(monthKey)!
      if (transaction.type === "income") {
        monthData.income += transaction.amount
      } else {
        monthData.expense += transaction.amount
      }
      monthData.balance = monthData.income - monthData.expense
    })

    // Ay sırasına göre sırala
    let monthlyDataArray: MonthlyData[]

    if (dateFilterType === "all") {
      // Tüm zamanlar için tarih sırasına göre sırala
      monthlyDataArray = Array.from(monthlyMap.values()).sort((a, b) => {
        // Ay isimlerini tarihe çevir ve karşılaştır
        const monthNames = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"]
        const [monthA, yearA] = a.month.split(" ")
        const [monthB, yearB] = b.month.split(" ")
        const dateA = new Date(Number.parseInt(yearA), monthNames.indexOf(monthA), 1)
        const dateB = new Date(Number.parseInt(yearB), monthNames.indexOf(monthB), 1)
        return dateA.getTime() - dateB.getTime()
      })
    } else {
      // Diğer filtreler için ay anahtarına göre sırala
      monthlyDataArray = Array.from(monthlyMap.entries())
        .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
        .map(([, value]) => value)
    }

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

  // Özet hesapla
  const calculateSummary = () => {
    let totalIncome = 0
    let totalExpense = 0
    const transactionCount = transactions.length
    const categoryCount = new Set(transactions.map((t) => t.category_id)).size

    transactions.forEach((transaction) => {
      if (transaction.type === "income") {
        totalIncome += transaction.amount
      } else {
        totalExpense += transaction.amount
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

  // Para formatı
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
                Tutar Aralığı: {formatCurrency(amountRange[0])} - {formatCurrency(amountRange[1])}
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
                <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Gelir</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalIncome)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Gider</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalExpense)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Net Bakiye</CardTitle>
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
                <CardTitle>Aylık Gelir/Gider Trendi</CardTitle>
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
                <CardTitle>En Çok Gider Yapılan Kategoriler</CardTitle>
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
                <CardTitle>Kategori Dağılımı</CardTitle>
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
                <CardTitle>Kategori Detayları</CardTitle>
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
              <CardTitle>Aylık Gelir/Gider Trendi</CardTitle>
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
              <CardTitle>Aylık Finansal Veriler</CardTitle>
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
              <CardDescription>Filtrelere göre işlemler</CardDescription>
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
                              {formatCurrency(transaction.amount)}
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
                        <td colSpan={5} className="py-8 text-center text-gray-500">
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
