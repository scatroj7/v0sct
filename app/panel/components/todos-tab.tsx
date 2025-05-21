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
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Pencil, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface Todo {
  id: number
  title: string
  description: string | null
  due_date: string | null
  completed: boolean
  created_at: string
}

const TodosTab = () => {
  const [todos, setTodos] = useState<Todo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  // Form state for adding new todo
  const [newTodo, setNewTodo] = useState({
    title: "",
    description: "",
    due_date: undefined as Date | undefined,
  })

  // Form state for editing todo
  const [editTodo, setEditTodo] = useState<{
    id: number
    title: string
    description: string
    due_date: Date | undefined
    completed: boolean
  }>({
    id: 0,
    title: "",
    description: "",
    due_date: undefined,
    completed: false,
  })

  // Fetch todos
  const fetchTodos = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/todos")
      if (!response.ok) {
        throw new Error("Failed to fetch todos")
      }
      const data = await response.json()

      // Ensure todos is always an array
      let todosArray: Todo[] = []

      if (data && Array.isArray(data)) {
        todosArray = data
      } else if (data && typeof data === "object" && data.todos && Array.isArray(data.todos)) {
        todosArray = data.todos
      } else if (data && typeof data === "object" && data.data && Array.isArray(data.data)) {
        todosArray = data.data
      } else {
        console.warn("Unexpected todos data format:", data)
        todosArray = []
      }

      setTodos(todosArray)
    } catch (error) {
      console.error("Error fetching todos:", error)
      setTodos([]) // Set to empty array on error
      toast({
        title: "Error",
        description: "Failed to fetch todos",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTodos()
  }, [])

  // Handle adding a new todo
  const handleAddTodo = async () => {
    try {
      const response = await fetch("/api/todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: newTodo.title,
          description: newTodo.description || null,
          due_date: newTodo.due_date ? newTodo.due_date.toISOString() : null,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to add todo")
      }

      // Reset form and close dialog
      setNewTodo({
        title: "",
        description: "",
        due_date: undefined,
      })
      setIsAddDialogOpen(false)

      // Refresh todos
      fetchTodos()

      toast({
        title: "Success",
        description: "Todo added successfully",
      })
    } catch (error) {
      console.error("Error adding todo:", error)
      toast({
        title: "Error",
        description: "Failed to add todo",
        variant: "destructive",
      })
    }
  }

  // Handle editing a todo
  const handleEditTodo = async () => {
    try {
      const response = await fetch(`/api/todos/${editTodo.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: editTodo.title,
          description: editTodo.description || null,
          due_date: editTodo.due_date ? editTodo.due_date.toISOString() : null,
          completed: editTodo.completed,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update todo")
      }

      // Close dialog and refresh todos
      setIsEditDialogOpen(false)
      fetchTodos()

      toast({
        title: "Success",
        description: "Todo updated successfully",
      })
    } catch (error) {
      console.error("Error updating todo:", error)
      toast({
        title: "Error",
        description: "Failed to update todo",
        variant: "destructive",
      })
    }
  }

  // Handle deleting a todo
  const handleDeleteTodo = async (id: number) => {
    if (!confirm("Are you sure you want to delete this todo?")) {
      return
    }

    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete todo")
      }

      // Refresh todos
      fetchTodos()

      toast({
        title: "Success",
        description: "Todo deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting todo:", error)
      toast({
        title: "Error",
        description: "Failed to delete todo",
        variant: "destructive",
      })
    }
  }

  // Handle toggling todo completion status
  const handleToggleComplete = async (todo: Todo) => {
    try {
      const response = await fetch(`/api/todos/${todo.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...todo,
          completed: !todo.completed,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update todo")
      }

      // Refresh todos
      fetchTodos()
    } catch (error) {
      console.error("Error updating todo:", error)
      toast({
        title: "Error",
        description: "Failed to update todo",
        variant: "destructive",
      })
    }
  }

  // Open edit dialog and populate form
  const openEditDialog = (todo: Todo) => {
    setEditTodo({
      id: todo.id,
      title: todo.title,
      description: todo.description || "",
      due_date: todo.due_date ? new Date(todo.due_date) : undefined,
      completed: todo.completed,
    })
    setIsEditDialogOpen(true)
  }

  // Ensure todos is always an array before rendering
  const todosArray = Array.isArray(todos) ? todos : []

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Yapılacak İşler</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>Yeni İş Ekle</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni İş Ekle</DialogTitle>
              <DialogDescription>Yeni bir yapılacak iş eklemek için aşağıdaki formu doldurun.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  Başlık
                </Label>
                <Input
                  id="title"
                  value={newTodo.title}
                  onChange={(e) =>
                    setNewTodo({
                      ...newTodo,
                      title: e.target.value,
                    })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Açıklama
                </Label>
                <Input
                  id="description"
                  value={newTodo.description}
                  onChange={(e) =>
                    setNewTodo({
                      ...newTodo,
                      description: e.target.value,
                    })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="due_date" className="text-right">
                  Son Tarih
                </Label>
                <div className="col-span-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !newTodo.due_date && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newTodo.due_date ? format(newTodo.due_date, "PPP", { locale: tr }) : <span>Tarih seçin</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={newTodo.due_date}
                        onSelect={(date) =>
                          setNewTodo({
                            ...newTodo,
                            due_date: date,
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
              <Button type="submit" onClick={handleAddTodo} disabled={!newTodo.title}>
                Ekle
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Todos Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableCaption>
            {isLoading
              ? "Yapılacak işler yükleniyor..."
              : todosArray.length === 0
                ? "Yapılacak iş bulunamadı"
                : `Toplam ${todosArray.length} yapılacak iş`}
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Durum</TableHead>
              <TableHead>Başlık</TableHead>
              <TableHead>Açıklama</TableHead>
              <TableHead>Son Tarih</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  Yükleniyor...
                </TableCell>
              </TableRow>
            ) : todosArray.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  Yapılacak iş bulunamadı
                </TableCell>
              </TableRow>
            ) : (
              todosArray.map((todo) => (
                <TableRow key={todo.id} className={cn(todo.completed && "bg-muted/50")}>
                  <TableCell>
                    <Checkbox
                      checked={todo.completed}
                      onCheckedChange={() => handleToggleComplete(todo)}
                      aria-label={`Mark ${todo.title} as ${todo.completed ? "incomplete" : "complete"}`}
                    />
                  </TableCell>
                  <TableCell className={cn("font-medium", todo.completed && "line-through text-muted-foreground")}>
                    {todo.title}
                  </TableCell>
                  <TableCell className={cn(todo.completed && "text-muted-foreground")}>
                    {todo.description || "-"}
                  </TableCell>
                  <TableCell
                    className={cn(
                      todo.completed && "text-muted-foreground",
                      todo.due_date && new Date(todo.due_date) < new Date() && !todo.completed && "text-red-600",
                    )}
                  >
                    {todo.due_date
                      ? format(new Date(todo.due_date), "dd MMM yyyy", {
                          locale: tr,
                        })
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(todo)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteTodo(todo.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Todo Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>İşi Düzenle</DialogTitle>
            <DialogDescription>Yapılacak iş bilgilerini güncellemek için aşağıdaki formu doldurun.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-title" className="text-right">
                Başlık
              </Label>
              <Input
                id="edit-title"
                value={editTodo.title}
                onChange={(e) =>
                  setEditTodo({
                    ...editTodo,
                    title: e.target.value,
                  })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-description" className="text-right">
                Açıklama
              </Label>
              <Input
                id="edit-description"
                value={editTodo.description}
                onChange={(e) =>
                  setEditTodo({
                    ...editTodo,
                    description: e.target.value,
                  })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-due_date" className="text-right">
                Son Tarih
              </Label>
              <div className="col-span-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !editTodo.due_date && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editTodo.due_date ? format(editTodo.due_date, "PPP", { locale: tr }) : <span>Tarih seçin</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={editTodo.due_date}
                      onSelect={(date) =>
                        setEditTodo({
                          ...editTodo,
                          due_date: date,
                        })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-completed" className="text-right">
                Tamamlandı
              </Label>
              <div className="col-span-3">
                <Checkbox
                  id="edit-completed"
                  checked={editTodo.completed}
                  onCheckedChange={(checked) =>
                    setEditTodo({
                      ...editTodo,
                      completed: checked === true,
                    })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleEditTodo} disabled={!editTodo.title}>
              Güncelle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default TodosTab
