"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Edit, Plus, Trash2 } from "lucide-react"
import { DatePicker } from "@/components/ui/date-picker"

interface Todo {
  id: string
  title: string
  description: string
  dueDate: string | null
  priority: "low" | "medium" | "high" | "critical"
  status: "pending" | "in-progress" | "completed"
  completed: boolean
  createdAt: string
}

const priorityColors = {
  low: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  critical: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
}

const statusColors = {
  pending: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
  "in-progress": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
}

export default function TodosTab() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [currentTodo, setCurrentTodo] = useState<Todo | null>(null)
  const [newTodo, setNewTodo] = useState({
    title: "",
    description: "",
    dueDate: null as Date | null,
    priority: "medium" as "low" | "medium" | "high" | "critical",
    status: "pending" as "pending" | "in-progress" | "completed",
  })

  useEffect(() => {
    // Load todos from local storage
    const storedTodos = localStorage.getItem("todos")
    if (storedTodos) {
      try {
        setTodos(JSON.parse(storedTodos))
      } catch (error) {
        console.error("Error parsing todos from localStorage:", error)
        setTodos([])
      }
    }
  }, [])

  useEffect(() => {
    // Save todos to local storage
    try {
      localStorage.setItem("todos", JSON.stringify(todos))
    } catch (error) {
      console.error("Error saving todos to localStorage:", error)
    }
  }, [todos])

  const handleAddTodo = () => {
    if (newTodo.title.trim() === "") return

    if (isEditMode && currentTodo) {
      // Edit existing todo
      setTodos(
        todos.map((todo) =>
          todo.id === currentTodo.id
            ? {
                ...todo,
                title: newTodo.title,
                description: newTodo.description,
                dueDate: newTodo.dueDate ? newTodo.dueDate.toISOString() : null,
                priority: newTodo.priority,
                status: newTodo.status,
                completed: newTodo.status === "completed",
              }
            : todo,
        ),
      )
    } else {
      // Add new todo
      const newTodoItem: Todo = {
        id: Date.now().toString(),
        title: newTodo.title,
        description: newTodo.description,
        dueDate: newTodo.dueDate ? newTodo.dueDate.toISOString() : null,
        priority: newTodo.priority,
        status: newTodo.status,
        completed: newTodo.status === "completed",
        createdAt: new Date().toISOString(),
      }
      setTodos([...todos, newTodoItem])
    }

    // Reset form and close dialog
    resetForm()
    setIsDialogOpen(false)
  }

  const handleEditTodo = (todo: Todo) => {
    setCurrentTodo(todo)
    setNewTodo({
      title: todo.title,
      description: todo.description,
      dueDate: todo.dueDate ? new Date(todo.dueDate) : null,
      priority: todo.priority,
      status: todo.status,
    })
    setIsEditMode(true)
    setIsDialogOpen(true)
  }

  const handleTodoCompletion = (id: string) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id
          ? {
              ...todo,
              completed: !todo.completed,
              status: !todo.completed ? "completed" : "pending",
            }
          : todo,
      ),
    )
  }

  const handleRemoveTodo = (id: string) => {
    setTodos(todos.filter((todo) => todo.id !== id))
  }

  const resetForm = () => {
    setNewTodo({
      title: "",
      description: "",
      dueDate: null,
      priority: "medium",
      status: "pending",
    })
    setCurrentTodo(null)
    setIsEditMode(false)
  }

  const openNewTodoDialog = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  const completedTodos = todos.filter((todo) => todo.completed).length
  const totalTodos = todos.length

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Görevler</h2>
        <Button onClick={openNewTodoDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Yeni Görev
        </Button>
      </div>

      {/* İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Görev</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTodos}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tamamlanan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedTodos}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Kalan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{totalTodos - completedTodos}</div>
          </CardContent>
        </Card>
      </div>

      {/* Görev listesi */}
      <div className="space-y-2">
        {todos.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Henüz görev eklenmemiş. "Yeni Görev" butonunu kullanarak yeni bir görev ekleyebilirsiniz.
          </div>
        ) : (
          todos.map((todo) => (
            <Card key={todo.id} className={todo.completed ? "opacity-75" : ""}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      checked={todo.completed}
                      onCheckedChange={() => handleTodoCompletion(todo.id)}
                      className="mt-1"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${todo.completed ? "line-through text-gray-500" : ""}`}>
                          {todo.title}
                        </span>
                        <Badge className={priorityColors[todo.priority]}>
                          {todo.priority === "low" && "Düşük"}
                          {todo.priority === "medium" && "Orta"}
                          {todo.priority === "high" && "Yüksek"}
                          {todo.priority === "critical" && "Kritik"}
                        </Badge>
                        <Badge className={statusColors[todo.status]}>
                          {todo.status === "pending" && "Beklemede"}
                          {todo.status === "in-progress" && "Devam Ediyor"}
                          {todo.status === "completed" && "Tamamlandı"}
                        </Badge>
                      </div>
                      {todo.description && (
                        <p
                          className={`text-sm mt-1 ${todo.completed ? "line-through text-gray-500" : "text-gray-600"}`}
                        >
                          {todo.description}
                        </p>
                      )}
                      {todo.dueDate && (
                        <p className="text-xs mt-1 text-gray-500">
                          Bitiş: {new Date(todo.dueDate).toLocaleDateString("tr-TR")}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEditTodo(todo)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleRemoveTodo(todo.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Görev Ekleme/Düzenleme Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Görevi Düzenle" : "Yeni Görev Ekle"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Başlık</Label>
              <Input
                id="title"
                value={newTodo.title}
                onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
                placeholder="Görev başlığı"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Açıklama</Label>
              <Textarea
                id="description"
                value={newTodo.description}
                onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
                placeholder="Görev açıklaması (opsiyonel)"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dueDate">Bitiş Tarihi</Label>
                <DatePicker
                  date={newTodo.dueDate}
                  onSelect={(date) => setNewTodo({ ...newTodo, dueDate: date })}
                  placeholder="Bitiş tarihi seçin"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Öncelik</Label>
                <Select
                  value={newTodo.priority}
                  onValueChange={(value: "low" | "medium" | "high" | "critical") =>
                    setNewTodo({ ...newTodo, priority: value })
                  }
                >
                  <SelectTrigger id="priority">
                    <SelectValue placeholder="Öncelik seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Düşük</SelectItem>
                    <SelectItem value="medium">Orta</SelectItem>
                    <SelectItem value="high">Yüksek</SelectItem>
                    <SelectItem value="critical">Kritik</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Durum</Label>
              <Select
                value={newTodo.status}
                onValueChange={(value: "pending" | "in-progress" | "completed") =>
                  setNewTodo({ ...newTodo, status: value })
                }
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Durum seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Beklemede</SelectItem>
                  <SelectItem value="in-progress">Devam Ediyor</SelectItem>
                  <SelectItem value="completed">Tamamlandı</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleAddTodo} disabled={!newTodo.title.trim()}>
              {isEditMode ? "Güncelle" : "Ekle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
