"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { InlineDatePicker } from "@/components/ui/inline-date-picker"
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns"
import { tr } from "date-fns/locale"
import { localStorageManager } from "@/app/lib/local-storage-manager"
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

interface SummaryData {
  totalIncome: number
  totalExpense: number
  balance: number
  transactionCount: number
  categoryCount: number
  investmentValue: number
}

export default function SummaryTab() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([])
  const [dateFilterType, setDateFilterType] = useState("thisMonth")
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [monthlyData, setMonthlyData] = useState<any[]>([])
  const [categoryData, setCategoryData] = useState<CategorySummary[]>([])

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

  const prepareChartData = (transactions: Transaction[]) => {
    const monthlyDataMap = new Map<string, { month: string; income: number; expense: number; sortKey: string }>()
    const categoryDataMap = new Map<string, { name: string; value: number; type: string }>()

    transactions.forEach((transaction) => {
      const date = new Date(transaction.date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      const monthName = format(date, "LLL yyyy", { locale: tr })
      const sortKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`

      if (!monthlyDataMap.has(monthKey)) {
        monthlyDataMap.set(monthKey, { month: monthName, income: 0, expense: 0, sortKey })
      }

      const monthData = monthlyDataMap.get(monthKey)!
      if (transaction.type === "income") {
        monthData.income += transaction.amount
      } else {
        monthData.expense += transaction.amount
      }

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

    // Ayları kronolojik sıraya göre sırala (soldan sağa)
    const monthlyDataArray = Array.from(monthlyDataMap.values()).sort((a, b) => {
      return a.sortKey.localeCompare(b.sortKey)
    })

    const categoryDataArray = Array.from(categoryDataMap.values()).sort((a, b) => b.value - a.value)

    setMonthlyData(monthlyDataArray)
    setCategoryData(categoryDataArray)
  }

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
        break
    }

    return { start, end }
  }

  const filterTransactions = (transactionsToFilter = allTransactions) => {
    const { start, end } = getDateRangeForFilter(dateFilterType)
    let filtered = [...transactionsToFilter]

    if (start && end) {
      filtered = filtered.filter((transaction) => {
        const transactionDate = new Date(transaction.date)
        return transactionDate >= start && transactionDate <= end
      })
    }

    setTransactions(filtered)
    prepareChartData(filtered)
  }

  useEffect(() => {
    const transactions = localStorageManager.getTransactions()
    const categories = localStorageManager.getCategories()

    const transactionsWithCategories = transactions.map((transaction) => ({
      ...transaction,
      category_name: categories.find((cat) => cat.id === transaction.category_id)?.name || "Bilinmeyen",
      category_color: categories.find((cat) => cat.id === transaction.category_id)?.color,
    }))

    setAllTransactions(transactionsWithCategories)
    filterTransactions(transactionsWithCategories)
  }, [dateFilterType, startDate, endDate])

  const calculateSummary = () => {
    if (!transactions || transactions.length === 0) {
      return { totalIncome: 0, totalExpense: 0, balance: 0, transactionCount: 0, categoryCount: 0, investmentValue: 0 }
    }

    let totalIncome = 0
    let totalExpense = 0
    let categoryCount = new Set<string>().size
    let investmentValue = 0

    transactions.forEach((transaction) => {
      const amount = Number.parseFloat(transaction.amount as any) || 0

      if (transaction.type === "income") {
        totalIncome += amount
      } else {
        totalExpense += amount
      }

      if (transaction.category_name) {
        categoryCount++
      }

      if (transaction.type === "investment") {
        investmentValue += amount
      }
    })

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      transactionCount: transactions.length,
      categoryCount,
      investmentValue,
    }
  }

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D", "#FF6B6B", "#6B66FF"]

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(amount)
  }

  // Özel Tooltip bileşeni
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Finansal Özet</h2>

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
              <InlineDatePicker value={startDate} onChange={setStartDate} className="w-full" />
            </div>
            <div>
              <Label htmlFor="endDate" className="mb-2 block">
                Bitiş Tarihi
              </Label>
              <InlineDatePicker value={endDate} onChange={setEndDate} className="w-full" />
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <Button
            onClick={() => {
              setDateFilterType("thisMonth")
              setStartDate(null)
              setEndDate(null)
            }}
            variant="outline"
            className="w-fit"
          >
            Filtreleri Uygula
          </Button>
        </div>
      </div>

      {/* Özet Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Gelir</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(calculateSummary().totalIncome)}</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Gider</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(calculateSummary().totalExpense)}</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net Bakiye</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${calculateSummary().balance >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {formatCurrency(calculateSummary().balance)}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">İşlem Sayısı</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calculateSummary().transactionCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Aylık Gelir/Gider Grafiği */}
      <Card className="hover:shadow-md transition-shadow duration-200">
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
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" className="text-xs" tick={{ fontSize: 12 }} />
                  <YAxis className="text-xs" tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar
                    dataKey="income"
                    name="Gelir"
                    fill="#4ade80"
                    radius={[2, 2, 0, 0]}
                    className="hover:opacity-80 transition-opacity duration-200"
                  />
                  <Bar
                    dataKey="expense"
                    name="Gider"
                    fill="#f87171"
                    radius={[2, 2, 0, 0]}
                    className="hover:opacity-80 transition-opacity duration-200"
                  />
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

      {/* Kategori Bazlı Harcama Grafikleri */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="hover:shadow-md transition-shadow duration-200">
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
                      className="hover:opacity-80 transition-opacity duration-200"
                    >
                      {categoryData
                        .filter((cat) => cat.type === "expense")
                        .map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                            className="hover:opacity-80 transition-opacity duration-200 cursor-pointer"
                          />
                        ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value))}
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                    />
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

        <Card className="hover:shadow-md transition-shadow duration-200">
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
                      className="hover:opacity-80 transition-opacity duration-200"
                    >
                      {categoryData
                        .filter((cat) => cat.type === "income")
                        .map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                            className="hover:opacity-80 transition-opacity duration-200 cursor-pointer"
                          />
                        ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value))}
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                    />
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
    </div>
  )
}
