"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Investment {
  id: string
  name: string
  amount: number
  currentValue: number
}

export default function InvestmentsTab() {
  const [investments, setInvestments] = useState<Investment[]>([])
  const [newInvestmentName, setNewInvestmentName] = useState("")
  const [newInvestmentAmount, setNewInvestmentAmount] = useState("")

  useEffect(() => {
    // Load investments from local storage
    const storedInvestments = localStorage.getItem("investments")
    if (storedInvestments) {
      setInvestments(JSON.parse(storedInvestments))
    }
  }, [])

  useEffect(() => {
    // Save investments to local storage
    localStorage.setItem("investments", JSON.stringify(investments))
  }, [investments])

  const handleAddInvestment = () => {
    if (newInvestmentName && newInvestmentAmount) {
      const amount = Number.parseFloat(newInvestmentAmount)
      if (!isNaN(amount) && amount > 0) {
        const newInvestment: Investment = {
          id: Date.now().toString(),
          name: newInvestmentName,
          amount: amount,
          currentValue: amount, // Başlangıçta aynı değer
        }
        setInvestments([...investments, newInvestment])
        setNewInvestmentName("")
        setNewInvestmentAmount("")
      } else {
        alert("Lütfen geçerli bir tutar girin.")
      }
    } else {
      alert("Lütfen tüm alanları doldurun.")
    }
  }

  const handleDeleteInvestment = (id: string) => {
    setInvestments(investments.filter((investment) => investment.id !== id))
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(amount)
  }

  const calculateTotalValue = () => {
    return investments.reduce((total, investment) => total + investment.currentValue, 0)
  }

  const calculateTotalInvestment = () => {
    return investments.reduce((total, investment) => total + investment.amount, 0)
  }

  const calculateTotalGain = () => {
    return calculateTotalValue() - calculateTotalInvestment()
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Yatırımlar</h2>

      {/* Özet kartları */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Yatırım</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(calculateTotalInvestment())}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Güncel Değer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(calculateTotalValue())}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Kar/Zarar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${calculateTotalGain() >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(calculateTotalGain())}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Yeni yatırım ekleme */}
      <Card>
        <CardHeader>
          <CardTitle>Yeni Yatırım Ekle</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              type="text"
              placeholder="Yatırım Adı"
              value={newInvestmentName}
              onChange={(e) => setNewInvestmentName(e.target.value)}
            />
            <Input
              type="number"
              placeholder="Yatırım Tutarı"
              value={newInvestmentAmount}
              onChange={(e) => setNewInvestmentAmount(e.target.value)}
            />
            <Button onClick={handleAddInvestment}>Yatırım Ekle</Button>
          </div>
        </CardContent>
      </Card>

      {/* Yatırım listesi */}
      <div className="space-y-4">
        {investments.map((investment) => {
          const gain = investment.currentValue - investment.amount
          const gainPercentage = ((gain / investment.amount) * 100).toFixed(2)

          return (
            <Card key={investment.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold">{investment.name}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                      <div>
                        <p className="text-sm text-gray-500">Yatırım Tutarı</p>
                        <p className="font-semibold">{formatCurrency(investment.amount)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Güncel Değer</p>
                        <p className="font-semibold">{formatCurrency(investment.currentValue)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Kar/Zarar</p>
                        <p className={`font-semibold ${gain >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {formatCurrency(gain)} ({gainPercentage}%)
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteInvestment(investment.id)}>
                    Sil
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {investments.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Henüz yatırım eklenmemiş. Yukarıdaki formu kullanarak yeni bir yatırım ekleyebilirsiniz.
        </div>
      )}
    </div>
  )
}
