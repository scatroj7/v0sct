"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Pencil, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"

interface Budget {
  id: string
  title: string
  description: string | null
  target_amount: number
  current_amount: number
  category_id: string | null
  category_name: string | null
  priority: string
  target_date: string | null
  status: string
  created_at: string
  updated_at: string
}

interface Category {
  id: string
  name: string
  type: string
}

const BudgetsTab = () => {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])

  // Form state for adding new budget
  const [newBudget, setNewBudget] = useState({
    category: "",
    amount: "",
    start_date: new Date(),
    end_date: new Date(new Date().setMonth(new Date().getMonth() + 1)),
  })

  // Form state for editing budget
  const [editBudget, setEditBudget] = useState<{
    id: string
    category: string
    amount: string
    start_date: Date
    end_date: Date
  }>({
    id: "",
    category: "",
    amount: "",
    start_date: new Date(),
    end_date: new Date(),
  })

  // Fetch budgets
  const fetchBudgets = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/budgets")
      if (!response.ok) {
        throw new Error("Failed to fetch budgets")
      }
      const data = await response.json()

      // Ensure budgets is an array
      let budgetsArray: Budget[] = []

      if (data && data.success && Array.isArray(data.budgets)) {
        budgetsArray = data.budgets
      } else if (data && Array.isArray(data)) {
        budgetsArray = data
      } else {
        console.warn("Unexpected budgets data format:", data)
      }

      setBudgets(budgetsArray)
    } catch (error) {
      console.error("Error fetching budgets:", error)
      toast({
        title: "Error",
        description: "Failed to fetch budgets",
        variant: "destructive",
      })
      setBudgets([]) // Set to empty array on error
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories")
      if (!response.ok) {
        throw new Error("Failed to fetch categories")
      }
      const data = await response.json()

      // Ensure categories is an array
      if (Array.isArray(data)) {
        setCategories(data)
      } else if (data && typeof data === "object") {
        // If data is an object with categories property
        if (Array.isArray(data.categories)) {
          setCategories(data.categories)
        } else {
          // Convert object to array if needed
          const categoryArray = Object.keys(data).map((key) => {
            return { id: key, name: data[key], type: "unknown" }
          })
          setCategories(categoryArray)
        }
      } else {
        // Fallback to empty array
        console.error("Unexpected categories format:", data)
        setCategories([])
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
      setCategories([])
    }
  }

  useEffect(() => {
    fetchBudgets()
    fetchCategories()
  }, [])

  // Handle adding a new budget
  const handleAddBudget = async () => {
    try {
      const response = await fetch("/api/budgets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: newBudget.category, // Using category as title for simplicity
          description: `Budget for ${newBudget.category}`,
          targetAmount: Number.parseFloat(newBudget.amount),
          currentAmount: 0,
          categoryId: newBudget.category,
          priority: "medium",
          targetDate: newBudget.end_date.toISOString(),
          status: "active",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to add budget")
      }

      // Reset form and close dialog
      setNewBudget({
        category: "",
        amount: "",
        start_date: new Date(),
        end_date: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      })
      setIsAddDialogOpen(false)

      // Refresh budgets
      fetchBudgets()

      toast({
        title: "Success",
        description: "Budget added successfully",
      })
    } catch (error) {
      console.error("Error adding budget:", error)
      toast({
        title: "Error",
        description: "Failed to add budget",
        variant: "destructive",
      })
    }
  }

  // Handle editing a budget
  const handleEditBudget = async () => {
    try {
      const response = await fetch(`/api/budgets/${editBudget.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: editBudget.category, // Using category as title for simplicity
          description: `Budget for ${editBudget.category}`,
          targetAmount: Number.parseFloat(editBudget.amount),
          categoryId: editBudget.category,
          priority: "medium",
          targetDate: editBudget.end_date.toISOString(),
          status: "active",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update budget")
      }

      // Close dialog and refresh budgets
      setIsEditDialogOpen(false)
      fetchBudgets()

      toast({
        title: "Success",
        description: "Budget updated successfully",
      })
    } catch (error) {
      console.error("Error updating budget:", error)
      toast({
        title: "Error",
        description: "Failed to update budget",
        variant: "destructive",
      })
    }
  }

  // Handle deleting a budget
  const handleDeleteBudget = async (id: string) => {
    if (!confirm("Are you sure you want to delete this budget?")) {
      return
    }

    try {
      const response = await fetch(`/api/budgets/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete budget")
      }

      // Refresh budgets
      fetchBudgets()

      toast({
        title: "Success",
        description: "Budget deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting budget:", error)
      toast({
        title: "Error",
        description: "Failed to delete budget",
        variant: "destructive",
      })
    }
  }

  // Open edit dialog and populate form
  const openEditDialog = (budget: Budget) => {
    setEditBudget({
      id: budget.id,
      category: budget.category_id || budget.category_name || "",
      amount: budget.target_amount.toString(),
      start_date: new Date(),
      end_date: budget.target_date ? new Date(budget.target_date) : new Date(),
    })
    setIsEditDialogOpen(true)
  }

  // Calculate budget progress percentage
  const calculateProgress = (spent: number, amount: number) => {
    return Math.min(Math.round((spent / amount) * 100), 100)
  }

  // Get progress color based on percentage
  const getProgressColor = (percentage: number) => {
    if (percentage < 70) return "bg-green-500"
    if (percentage < 90) return "bg-yellow-500"
    return "bg-red-500"
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Bütçeler</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>Yeni Bütçe Ekle</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni Bütçe Ekle</DialogTitle>
              <DialogDescription>Yeni bir bütçe eklemek için aşağıdaki formu doldurun.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">
                  Kategori
                </Label>
                <Select
                  value={newBudget.category}
                  onValueChange={(value) => setNewBudget({ ...newBudget, category: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Kategori seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(categories) && categories.length > 0 ? (
                      categories.map((category) => (
                        <SelectItem key={category.id || category.name} value={category.id || category.name}>
                          {category.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="other">Diğer</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount" className="text-right">
                  Tutar
                </Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={newBudget.amount}
                  onChange={(e) =>
                    setNewBudget({
                      ...newBudget,
                      amount: e.target.value,
                    })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="start_date" className="text-right">
                  Başlangıç Tarihi
                </Label>
                <div className="col-span-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(newBudget.start_date, "PPP", { locale: tr })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={newBudget.start_date}
                        onSelect={(date) =>
                          setNewBudget({
                            ...newBudget,
                            start_date: date || new Date(),
                          })
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="end_date" className="text-right">
                  Bitiş Tarihi
                </Label>
                <div className="col-span-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(newBudget.end_date, "PPP", { locale: tr })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={newBudget.end_date}
                        onSelect={(date) =>
                          setNewBudget({
                            ...newBudget,
                            end_date: date || new Date(),
                          })
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleAddBudget} disabled={!newBudget.category || !newBudget.amount}>
                Ekle
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Budgets Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableCaption>
            {isLoading
              ? "Bütçeler yükleniyor..."
              : budgets.length === 0
                ? "Bütçe bulunamadı"
                : `Toplam ${budgets.length} bütçe`}
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Kategori</TableHead>
              <TableHead>Dönem</TableHead>
              <TableHead className="text-right">Bütçe</TableHead>
              <TableHead className="text-right">Harcanan</TableHead>
              <TableHead>İlerleme</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  Yükleniyor...
                </TableCell>
              </TableRow>
            ) : budgets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  Bütçe bulunamadı
                </TableCell>
              </TableRow>
            ) : (
              budgets.map((budget) => {
                const progress = calculateProgress(budget.current_amount, budget.target_amount)
                const progressColor = getProgressColor(progress)

                return (
                  <TableRow key={budget.id}>
                    <TableCell className="font-medium">{budget.category_name || budget.title}</TableCell>
                    <TableCell>
                      {budget.target_date
                        ? format(new Date(budget.target_date), "dd MMM yyyy", {
                            locale: tr,
                          })
                        : "Süresiz"}
                    </TableCell>
                    <TableCell className="text-right">
                      {budget.target_amount.toLocaleString("tr-TR", {
                        minimumFractionDigits: 2,
                      })}{" "}
                      ₺
                    </TableCell>
                    <TableCell className="text-right">
                      {budget.current_amount.toLocaleString("tr-TR", {
                        minimumFractionDigits: 2,
                      })}{" "}
                      ₺
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={progress} className={cn("h-2", progressColor)} />
                        <span className="text-xs">{progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(budget)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteBudget(budget.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Budget Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bütçeyi Düzenle</DialogTitle>
            <DialogDescription>Bütçe bilgilerini güncellemek için aşağıdaki formu doldurun.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-category" className="text-right">
                Kategori
              </Label>
              <Select
                value={editBudget.category}
                onValueChange={(value) => setEditBudget({ ...editBudget, category: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Kategori seçin" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(categories) && categories.length > 0 ? (
                    categories.map((category) => (
                      <SelectItem key={category.id || category.name} value={category.id || category.name}>
                        {category.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="other">Diğer</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-amount" className="text-right">
                Tutar
              </Label>
              <Input
                id="edit-amount"
                type="number"
                step="0.01"
                value={editBudget.amount}
                onChange={(e) =>
                  setEditBudget({
                    ...editBudget,
                    amount: e.target.value,
                  })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-start_date" className="text-right">
                Başlangıç Tarihi
              </Label>
              <div className="col-span-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(editBudget.start_date, "PPP", { locale: tr })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={editBudget.start_date}
                      onSelect={(date) =>
                        setEditBudget({
                          ...editBudget,
                          start_date: date || new Date(),
                        })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-end_date" className="text-right">
                Bitiş Tarihi
              </Label>
              <div className="col-span-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(editBudget.end_date, "PPP", { locale: tr })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={editBudget.end_date}
                      onSelect={(date) =>
                        setEditBudget({
                          ...editBudget,
                          end_date: date || new Date(),
                        })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleEditBudget} disabled={!editBudget.category || !editBudget.amount}>
              Güncelle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default BudgetsTab
