"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { tr } from "date-fns/locale"
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

interface Transaction {
  id: string
  amount: number
  description: string
  type: string
  category_name?: string
  date: string
  created_at: string
}

interface CategorySummary {
  name: string
  value: number
  type: string
}

const SummaryTab = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Tarih filtresi
  const [dateFilterType, setDateFilterType] = useState("thisMonth")
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)

  // Tarih filtresi seçenekleri
  const dateFilterOptions = [
    { value: "all", label: "Tüm Zamanlar" },
    { value: "today", label: "Bugün" },
    { value: "yesterday", label: "Dün" },
    { value: "thisMonth", label: "Bu Ay" },
    { value: "lastMonth", label: "Geçen Ay" },
    { value: "nextMonth", label: "Sonraki Ay" },
    { value: "last3Months", label: "Son 3 Ay" },
    { value: "last6Months", label: "Son 6 Ay" },
    { value: "next6Months", label: "Gelecek 6 Ay" },
    { value: "thisYear", label: "Bu Yıl" },
    { value: "lastYear", label: "Geçen Yıl" },
    { value: "custom", label: "Özel Tarih Aralığı" },
  ]

  // Grafik verileri
  const [monthlyData, setMonthlyData] = useState<any[]>([])
  const [categoryData, setCategoryData] = useState<CategorySummary[]>([])

  // Para formatı
  const formatCurrency = (amount: number) => {
    if (isNaN(amount)) return "₺0,00"

    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(amount)
  }

  // Veritabanı bağlantısını test et
  const testDatabaseConnection = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log("Veritabanı bağlantısı test ediliyor...")
      const response = await fetch("/api/test-connection")

      if (!response.ok) {
        // Backend'den gelen hata yanıtının gövdesini okumaya çalış
        const errorBody = await response.json()
        // Backend'in döndürdüğü detaylı hata mesajını kullan
        const backendErrorMessage =
          errorBody.error || errorBody.message || `HTTP Durum: ${response.status} ${response.statusText}`
        throw new Error(`Veritabanı bağlantısı başarısız: ${backendErrorMessage}`)
      }

      const data = await response.json()

      if (data.success) {
        alert("Veritabanı bağlantısı başarılı!")
      } else {
        setError(`Veritabanı bağlantısı başarısız: ${data.error || "Bilinmeyen hata"}`)
      }
    } catch (err) {
      console.error("Veritabanı bağlantısı test edilirken hata:", err)
      setError(
        `Veritabanı bağlantısı test edilirken bir hata oluştu: ${err instanceof Error ? err.message : String(err)}`,
      )
    } finally {
      setLoading(false)
    }
  }

  // Tarih filtresi için tarih aralığı hesapla
  const getDateRangeForFilter = (filter: string) => {
    const now = new Date()
    let start: Date | null = null
    let end: Date | null = null

    switch (filter) {
      case "today":
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
        break
      case "yesterday":
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999)
        break
      case "thisMonth":
        start = startOfMonth(now)
        end = endOfMonth(now)
        break
      case "lastMonth":
        start = startOfMonth(subMonths(now, 1))
        end = endOfMonth(subMonths(now, 1))
        break
      case "nextMonth":
        start = startOfMonth(addMonths(now, 1))
        end = endOfMonth(addMonths(now, 1))
        break
      case "last3Months":
        start = startOfMonth(subMonths(now, 2))
        end = endOfMonth(now)
        break
      case "last6Months":
        start = startOfMonth(subMonths(now, 5))
        end = endOfMonth(now)
        break
      case "next6Months":
        start = startOfMonth(now)
        end = endOfMonth(addMonths(now, 5))
        break
      case "thisYear":
        start = startOfYear(now)
        end = endOfYear(now)
        break
      case "lastYear":
        start = startOfYear(new Date(now.getFullYear() - 1, 0, 1))
        end = endOfYear(new Date(now.getFullYear() - 1, 0, 1))
        break
      case "custom":
        start = startDate
        end = endDate
        break
      case "all":
      default:
        // Tüm zamanlar için filtre yok
        break
    }

    return { start, end }
  }

  // İşlemleri getir (Geliştirilmiş Hata Yönetimi ile)
  const fetchTransactions = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log("İşlemler getiriliyor...")
      const response = await fetch("/api/transactions")

      if (!response.ok) {
        // Backend'den gelen hata yanıtının gövdesini okumaya çalış
        const errorBody = await response.json()
        // Backend'in döndürdüğü detaylı hata mesajını kullan
        const backendErrorMessage =
          errorBody.error || errorBody.message || `HTTP Durum: ${response.status} ${response.statusText}`
        throw new Error(`API Hatası: ${backendErrorMessage}`)
      }

      const data = await response.json()

      // Backend'in success: false dönme durumunu da kontrol et (HTTP 200 olsa bile)
      if (data.success && data.transactions) {
        // Sayısal değerleri doğru şekilde dönüştür
        const parsedTransactions = data.transactions.map((transaction: any) => ({
          ...transaction,
          amount: Number.parseFloat(transaction.amount) || 0,
        }))

        setAllTransactions(parsedTransactions)
        filterTransactions(parsedTransactions)
        console.log(`${parsedTransactions.length} işlem alındı`)

        // Grafik verilerini hazırla
        prepareChartData(parsedTransactions)
      } else {
        // Backend success: false döndüyse, backend'den gelen mesajı göster
        const backendErrorMessage = data.error || data.message || "İşlemler beklenmeyen bir formatta alındı."
        setError(`İşlemler alınırken bir sorun oluştu: ${backendErrorMessage}`)
        console.error("Beklenmeyen veya hatalı API yanıt formatı:", data)
      }
    } catch (err) {
      console.error("İşlemler getirilirken hata:", err)
      setError(`İşlemler yüklenirken bir hata oluştu: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setLoading(false)
    }
  }

  // Grafik verilerini hazırla
  const prepareChartData = (transactions: Transaction[]) => {
    // Aylık gelir/gider grafiği için veri hazırla
    const monthlyDataMap = new Map<string, { month: string; income: number; expense: number }>()

    // Kategori bazlı harcama grafiği için veri hazırla
    const categoryDataMap = new Map<string, { name: string; value: number; type: string }>()

    transactions.forEach((transaction) => {
      // Aylık veri için
      const date = new Date(transaction.date)
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`
      const monthName = format(date, "LLL yyyy", { locale: tr })

      if (!monthlyDataMap.has(monthKey)) {
        monthlyDataMap.set(monthKey, { month: monthName, income: 0, expense: 0 })
      }

      const monthData = monthlyDataMap.get(monthKey)!
      if (transaction.type === "income") {
        monthData.income += transaction.amount
      } else {
        monthData.expense += transaction.amount
      }

      // Kategori verisi için
      if (transaction.category_name) {
        const categoryKey = `${transaction.type}-${transaction.category_name}`

        if (!categoryDataMap.has(categoryKey)) {
          categoryDataMap.set(categoryKey, {
            name: transaction.category_name,
            value: 0,
            type: transaction.type,
          })
        }

        const categoryData = categoryDataMap.get(categoryKey)!
        categoryData.value += transaction.amount
      }
    })

    // Map'leri dizilere dönüştür ve sırala
    const monthlyDataArray = Array.from(monthlyDataMap.values())

    // Tarih filtresine göre sıralama yap
    if (dateFilterType.includes("next")) {
      // Gelecek tarihler için artan sıralama (bugünden ileriye)
      monthlyDataArray.sort((a, b) => {
        const dateA = new Date(a.month)
        const dateB = new Date(b.month)
        return dateA.getTime() - dateB.getTime()
      })
    } else {
      // Geçmiş tarihler için artan sıralama (eskiden yeniye)
      monthlyDataArray.sort((a, b) => {
        const dateA = new Date(a.month)
        const dateB = new Date(b.month)
        return dateA.getTime() - dateB.getTime()
      })
    }

    const categoryDataArray = Array.from(categoryDataMap.values()).sort((a, b) => b.value - a.value)

    setMonthlyData(monthlyDataArray)
    setCategoryData(categoryDataArray)
  }

  // İşlemleri filtrele
  const filterTransactions = (transactionsToFilter = allTransactions) => {
    const { start, end } = getDateRangeForFilter(dateFilterType)

    let filtered = [...transactionsToFilter]

    // Tarih filtreleme
    if (start && end) {
      filtered = filtered.filter((transaction) => {
        const transactionDate = new Date(transaction.date)
        return transactionDate >= start && transactionDate <= end
      })
    }

    setTransactions(filtered)

    // Filtrelenmiş veriler için grafikleri güncelle
    prepareChartData(filtered)
  }

  // Filtreleri sıfırla
  const resetFilters = () => {
    setDateFilterType("all")
    setStartDate(null)
    setEndDate(null)
    filterTransactions()
  }

  // Özet verilerini hesapla
  const calculateSummary = () => {
    if (!transactions || transactions.length === 0) {
      return { totalIncome: 0, totalExpense: 0, balance: 0 }
    }

    let totalIncome = 0
    let totalExpense = 0

    transactions.forEach((transaction) => {
      // Sayısal değer kontrolü yap
      const amount = Number.parseFloat(transaction.amount as any) || 0

      if (transaction.type === "income") {
        totalIncome += amount
      } else {
        totalExpense += amount
      }
    })

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
    }
  }

  // İlk yükleme
  useEffect(() => {
    fetchTransactions()
  }, [])

  // Filtreler değiştiğinde işlemleri filtrele
  useEffect(() => {
    filterTransactions()
  }, [dateFilterType, startDate, endDate])

  const summary = calculateSummary()

  // Pasta grafik için renkler
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D", "#FF6B6B", "#6B66FF"]

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Hata</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <p>{error}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <Button onClick={testDatabaseConnection} variant="outline" className="w-fit">
                Veritabanı bağlantısını test et
              </Button>
              <Button onClick={fetchTransactions} disabled={loading} variant="outline" className="w-fit">
                {loading ? "Yükleniyor..." : "İşlemleri yeniden getir"}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="mb-6">
        {/* Filtreler */}
        <div className="mb-6 p-4 bg-card rounded-lg border">
          <h3 className="text-lg font-medium mb-4">Filtreler</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Label htmlFor="dateFilterType" className="mb-2 block">
                Tarih Filtresi
              </Label>
              <Select value={dateFilterType} onValueChange={setDateFilterType}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Tarih Filtresi Seçin" />
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
          </div>

          {dateFilterType === "custom" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <Label htmlFor="startDate" className="mb-2 block">
                  Başlangıç Tarihi
                </Label>
                <DatePicker selected={startDate} onSelect={setStartDate} locale={tr} className="w-full" />
              </div>
              <div>
                <Label htmlFor="endDate" className="mb-2 block">
                  Bitiş Tarihi
                </Label>
                <DatePicker selected={endDate} onSelect={setEndDate} locale={tr} className="w-full" />
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={resetFilters} variant="outline" className="w-fit">
              Filtreleri Sıfırla
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Toplam Gelir</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalIncome)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Toplam Gider</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalExpense)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Bakiye</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(summary.balance)}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-lg">Veriler yükleniyor...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Aylık Gelir/Gider Grafiği */}
          <Card>
            <CardHeader>
              <CardTitle>Aylık Gelir ve Gider</CardTitle>
              <CardDescription>
                {dateFilterType !== "all"
                  ? dateFilterOptions.find((opt) => opt.value === dateFilterType)?.label + " dönemi"
                  : "Tüm zamanlar"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 w-full">
                {monthlyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={monthlyData}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip
                        formatter={(value) => formatCurrency(Number(value))}
                        labelFormatter={(label) => `${label}`}
                      />
                      <Legend />
                      <Bar dataKey="income" name="Gelir" fill="#4ade80" />
                      <Bar dataKey="expense" name="Gider" fill="#f87171" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-lg text-gray-500">Grafik için yeterli veri yok</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Kategori Bazlı Harcama Grafiği */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Kategori Bazlı Giderler</CardTitle>
                <CardDescription>
                  {dateFilterType !== "all"
                    ? dateFilterOptions.find((opt) => opt.value === dateFilterType)?.label + " dönemi"
                    : "Tüm zamanlar"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 w-full">
                  {categoryData.filter((cat) => cat.type === "expense").length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData.filter((cat) => cat.type === "expense")}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {categoryData
                            .filter((cat) => cat.type === "expense")
                            .map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-lg text-gray-500">Grafik için yeterli veri yok</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Kategori Bazlı Gelirler</CardTitle>
                <CardDescription>
                  {dateFilterType !== "all"
                    ? dateFilterOptions.find((opt) => opt.value === dateFilterType)?.label + " dönemi"
                    : "Tüm zamanlar"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 w-full">
                  {categoryData.filter((cat) => cat.type === "income").length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData.filter((cat) => cat.type === "income")}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {categoryData
                            .filter((cat) => cat.type === "income")
                            .map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-lg text-gray-500">Grafik için yeterli veri yok</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>İşlemler</CardTitle>
              <CardDescription>
                {dateFilterType !== "all"
                  ? dateFilterOptions.find((opt) => opt.value === dateFilterType)?.label + " İşlemleri"
                  : "Tüm İşlemleriniz"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Tarih</th>
                      <th className="text-left p-2">Açıklama</th>
                      <th className="text-left p-2">Kategori</th>
                      <th className="text-right p-2">Tutar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.slice(0, 5).map((transaction) => (
                      <tr key={transaction.id} className="border-b">
                        <td className="p-2">{new Date(transaction.date).toLocaleDateString("tr-TR")}</td>
                        <td className="p-2">{transaction.description || "-"}</td>
                        <td className="p-2">{transaction.category_name || "-"}</td>
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
        </div>
      )}
    </div>
  )
}

export default SummaryTab
