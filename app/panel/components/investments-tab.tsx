"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, Pencil, Trash2, TrendingUp, DollarSign, BarChart3 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
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

type Investment = {
  id: number
  name: string
  amount: number
  type: string
  date: string
  notes: string | null
  current_value: number | null
  return_rate: number | null
  user_id: number
}

export default function InvestmentsTab() {
  const { toast } = useToast()
  const [investments, setInvestments] = useState<Investment[]>([])
  const [loading, setLoading] = useState(true)
  const [openAddDialog, setOpenAddDialog] = useState(false)
  const [openEditDialog, setOpenEditDialog] = useState(false)
  const [currentInvestment, setCurrentInvestment] = useState<Investment | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    type: "hisse_senedi",
    notes: "",
    current_value: "",
    return_rate: "",
  })
  const [totalInvestment, setTotalInvestment] = useState(0)
  const [totalCurrentValue, setTotalCurrentValue] = useState(0)
  const [totalReturn, setTotalReturn] = useState(0)

  const investmentTypes = [
    { value: "hisse_senedi", label: "Hisse Senedi" },
    { value: "doviz", label: "Döviz" },
    { value: "altin", label: "Altın" },
    { value: "kripto", label: "Kripto Para" },
    { value: "fon", label: "Yatırım Fonu" },
    { value: "tahvil_bono", label: "Tahvil/Bono" },
    { value: "gayrimenkul", label: "Gayrimenkul" },
    { value: "diger", label: "Diğer" },
  ]

  useEffect(() => {
    fetchInvestments()
  }, [])

  useEffect(() => {
    if (investments.length > 0) {
      const totalInv = investments.reduce((sum, inv) => sum + inv.amount, 0)
      const totalCurr = investments.reduce((sum, inv) => sum + (inv.current_value || inv.amount), 0)

      setTotalInvestment(totalInv)
      setTotalCurrentValue(totalCurr)
      setTotalReturn(totalCurr - totalInv)
    }
  }, [investments])

  const fetchInvestments = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/investments")
      if (!response.ok) throw new Error("Yatırımlar yüklenirken bir hata oluştu")

      const data = await response.json()
      setInvestments(data)
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleTypeChange = (value: string) => {
    setFormData((prev) => ({ ...prev, type: value }))
  }

  const resetForm = () => {
    setFormData({
      name: "",
      amount: "",
      type: "hisse_senedi",
      notes: "",
      current_value: "",
      return_rate: "",
    })
  }

  const handleAddInvestment = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const payload = {
        name: formData.name,
        amount: Number.parseFloat(formData.amount),
        type: formData.type,
        notes: formData.notes || null,
        current_value: formData.current_value ? Number.parseFloat(formData.current_value) : null,
        return_rate: formData.return_rate ? Number.parseFloat(formData.return_rate) : null,
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
      const payload = {
        name: formData.name,
        amount: Number.parseFloat(formData.amount),
        type: formData.type,
        notes: formData.notes || null,
        current_value: formData.current_value ? Number.parseFloat(formData.current_value) : null,
        return_rate: formData.return_rate ? Number.parseFloat(formData.return_rate) : null,
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

  const handleDeleteInvestment = async (id: number) => {
    try {
      const response = await fetch(`/api/investments/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Yatırım silinirken bir hata oluştu")

      await fetchInvestments()

      toast({
        title: "Başarılı",
        description: "Yatırım başarıyla silindi",
      })
    } catch (error) {
      console.error("Yatırım silinirken hata:", error)
      toast({
        title: "Hata",
        description: "Yatırım silinirken bir sorun oluştu",
        variant: "destructive",
      })
    }
  }

  const openEditForm = (investment: Investment) => {
    setCurrentInvestment(investment)
    setFormData({
      name: investment.name,
      amount: investment.amount.toString(),
      type: investment.type,
      notes: investment.notes || "",
      current_value: investment.current_value ? investment.current_value.toString() : "",
      return_rate: investment.return_rate ? investment.return_rate.toString() : "",
    })
    setOpenEditDialog(true)
  }

  const getInvestmentTypeName = (type: string) => {
    return investmentTypes.find((t) => t.value === type)?.label || type
  }

  const calculateReturnRate = (investment: Investment) => {
    if (!investment.current_value) return 0
    return ((investment.current_value - investment.amount) / investment.amount) * 100
  }

  const getReturnColor = (rate: number) => {
    if (rate > 0) return "text-green-600"
    if (rate < 0) return "text-red-600"
    return "text-gray-600"
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Yatırımlarım</h2>
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
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Yeni Yatırım Ekle</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddInvestment} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Yatırım Adı</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Yatırım Tutarı (₺)</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Yatırım Türü</Label>
                <Select value={formData.type} onValueChange={handleTypeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Yatırım türü seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {investmentTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="current_value">Güncel Değer (₺) (Opsiyonel)</Label>
                <Input
                  id="current_value"
                  name="current_value"
                  type="number"
                  step="0.01"
                  value={formData.current_value}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="return_rate">Getiri Oranı (%) (Opsiyonel)</Label>
                <Input
                  id="return_rate"
                  name="return_rate"
                  type="number"
                  step="0.01"
                  value={formData.return_rate}
                  onChange={handleInputChange}
                />
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Yatırım</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <DollarSign className="mr-2 h-4 w-4 text-muted-foreground" />
              <div className="text-2xl font-bold">
                {loading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(totalInvestment)
                )}
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
                {loading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(totalCurrentValue)
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Getiri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <TrendingUp className="mr-2 h-4 w-4 text-muted-foreground" />
              <div className={`text-2xl font-bold ${getReturnColor(totalReturn)}`}>
                {loading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <>
                    {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(totalReturn)}
                    {totalInvestment > 0 && (
                      <span className="text-sm ml-2">({((totalReturn / totalInvestment) * 100).toFixed(2)}%)</span>
                    )}
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
          ) : investments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Henüz yatırım kaydınız bulunmuyor. Yeni bir yatırım eklemek için "Yeni Yatırım Ekle" butonunu
              kullanabilirsiniz.
            </div>
          ) : (
            <div className="space-y-4">
              {investments.map((investment) => (
                <div
                  key={investment.id}
                  className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border rounded-lg"
                >
                  <div className="space-y-1 mb-2 md:mb-0">
                    <div className="font-medium flex items-center">
                      {investment.name}
                      <Badge variant="outline" className="ml-2">
                        {getInvestmentTypeName(investment.type)}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Yatırım:{" "}
                      {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(investment.amount)}
                    </div>
                    {investment.current_value && (
                      <div className="text-sm">
                        Güncel Değer:{" "}
                        {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(
                          investment.current_value,
                        )}
                        <span className={`ml-2 ${getReturnColor(calculateReturnRate(investment))}`}>
                          ({calculateReturnRate(investment).toFixed(2)}%)
                        </span>
                      </div>
                    )}
                    {investment.notes && <div className="text-xs text-muted-foreground">{investment.notes}</div>}
                  </div>
                  <div className="flex space-x-2 w-full md:w-auto justify-end">
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
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Yatırım Düzenle</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditInvestment} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Yatırım Adı</Label>
              <Input id="edit-name" name="name" value={formData.name} onChange={handleInputChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-amount">Yatırım Tutarı (₺)</Label>
              <Input
                id="edit-amount"
                name="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-type">Yatırım Türü</Label>
              <Select value={formData.type} onValueChange={handleTypeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Yatırım türü seçin" />
                </SelectTrigger>
                <SelectContent>
                  {investmentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-current_value">Güncel Değer (₺) (Opsiyonel)</Label>
              <Input
                id="edit-current_value"
                name="current_value"
                type="number"
                step="0.01"
                value={formData.current_value}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-return_rate">Getiri Oranı (%) (Opsiyonel)</Label>
              <Input
                id="edit-return_rate"
                name="return_rate"
                type="number"
                step="0.01"
                value={formData.return_rate}
                onChange={handleInputChange}
              />
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
