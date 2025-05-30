"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Budget {
  id: string
  category: string
  amount: number
  spent: number
}

export default function BudgetsTab() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [newCategory, setNewCategory] = useState("")
  const [newAmount, setNewAmount] = useState("")

  useEffect(() => {
    // Load budgets from local storage
    const storedBudgets = localStorage.getItem("budgets")
    if (storedBudgets) {
      setBudgets(JSON.parse(storedBudgets))
    }
  }, [])

  useEffect(() => {
    // Save budgets to local storage
    localStorage.setItem("budgets", JSON.stringify(budgets))
  }, [budgets])

  const handleAddBudget = () => {
    if (newCategory && newAmount) {
      const amount = Number.parseFloat(newAmount)
      if (!isNaN(amount) && amount > 0) {
        const newBudget: Budget = {
          id: Date.now().toString(),
          category: newCategory,
          amount: amount,
          spent: 0,
        }
        setBudgets([...budgets, newBudget])
        setNewCategory("")
        setNewAmount("")
      } else {
        alert("Lütfen geçerli bir tutar girin.")
      }
    } else {
      alert("Lütfen tüm alanları doldurun.")
    }
  }

  const handleDeleteBudget = (id: string) => {
    setBudgets(budgets.filter((budget) => budget.id !== id))
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Bütçeler</h2>

      {/* Yeni bütçe ekleme */}
      <Card>
        <CardHeader>
          <CardTitle>Yeni Bütçe Ekle</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              type="text"
              placeholder="Kategori"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            />
            <Input type="number" placeholder="Tutar" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} />
            <Button onClick={handleAddBudget}>Bütçe Ekle</Button>
          </div>
        </CardContent>
      </Card>

      {/* Bütçe listesi */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {budgets.map((budget) => (
          <Card key={budget.id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                {budget.category}
                <Button variant="destructive" size="sm" onClick={() => handleDeleteBudget(budget.id)}>
                  Sil
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Bütçe:</span>
                  <span className="font-semibold">{formatCurrency(budget.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Harcanan:</span>
                  <span className="font-semibold">{formatCurrency(budget.spent)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kalan:</span>
                  <span
                    className={`font-semibold ${budget.amount - budget.spent >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {formatCurrency(budget.amount - budget.spent)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${Math.min((budget.spent / budget.amount) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {budgets.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Henüz bütçe eklenmemiş. Yukarıdaki formu kullanarak yeni bir bütçe ekleyebilirsiniz.
        </div>
      )}
    </div>
  )
}
