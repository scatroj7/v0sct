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
import { Pencil, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { NexusDatePicker } from "@/components/ui/nexus-date-picker"
import { localStorageManager } from "@/app/lib/local-storage-manager"

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
    due_date: null as Date | null,
  })

  // Form state for editing todo
  const [editTodo, setEditTodo] = useState<{
    id: number
    title: string
    description: string
    due_date: Date | null
    completed: boolean
  }>({
    id: 0,
    title: "",
    description: "",
    due_date: null,
    completed: false,
  })

  // Fetch todos
  const fetchTodos = async () => {
    setIsLoading(true)
    try {
      const data = localStorageManager.loadData()
      setTodos(data.todos || [])
    } catch (error) {
      console.error("Error fetching todos:", error)
      setTodos([])
      toast({
        title: "Hata",
        description: "Yapılacak işler getirilirken hata oluştu",
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
      const newTodoItem = localStorageManager.addTodo({
        title: newTodo.title,
        description: newTodo.description || null,
        due_date: newTodo.due_date ? newTodo.due_date.toISOString() : null,
        completed: false,
      })

      setNewTodo({
        title: "",
        description: "",
        due_date: null,
      })
      setIsAddDialogOpen(false)
      fetchTodos()

      toast({
        title: "Başarılı",
        description: "Yapılacak iş başarıyla eklendi",
      })
    } catch (error) {
      console.error("Error adding todo:", error)
      toast({
        title: "Hata",
        description: "Yapılacak iş eklenirken hata oluştu",
        variant: "destructive",
      })
    }
  }

  // Handle editing a todo
  const handleEditTodo = async () => {
    try {
      localStorageManager.updateTodo({
        id: editTodo.id,
        title: editTodo.title,
        description: editTodo.description || null,
        due_date: editTodo.due_date ? editTodo.due_date.toISOString() : null,
        completed: editTodo.completed,
      })

      setIsEditDialogOpen(false)
      fetchTodos()

      toast({
        title: "Başarılı",
        description: "Yapılacak iş başarıyla güncellendi",
      })
    } catch (error) {
      console.error("Error updating todo:", error)
      toast({
        title: "Hata",
        description: "Yapılacak iş güncellenirken hata oluştu",
        variant: "destructive",
      })
    }
  }

  // Handle deleting a todo
  const handleDeleteTodo = async (id: number) => {
    if (!confirm("Bu yapılacak işi silmek istediğinize emin misiniz?")) {
      return
    }

    try {
      localStorageManager.deleteTodo(id)

      fetchTodos()

      toast({
        title: "Başarılı",
        description: "Yapılacak iş başarıyla silindi",
      })
    } catch (error) {
      console.error("Error deleting todo:", error)
      toast({
        title: "Hata",
        description: "Yapılacak iş silinirken hata oluştu",
        variant: "destructive",
      })
    }
  }

  // Handle toggling todo completion status
  const handleToggleComplete = async (todo: Todo) => {
    try {
      localStorageManager.updateTodo({
        ...todo,
        completed: !todo.completed,
      })

      fetchTodos()
    } catch (error) {
      console.error("Error updating todo:", error)
      toast({
        title: "Hata",
        description: "Yapılacak iş güncellenirken hata oluştu",
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
      due_date: todo.due_date ? new Date(todo.due_date) : null,
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
                  <NexusDatePicker
                    value={newTodo.due_date}
                    onChange={(date) => {
                      console.log("New date selected:", date)
                      setNewTodo({
                        ...newTodo,
                        due_date: date,
                      })
                    }}
                    label=""
                  />
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
                <NexusDatePicker
                  value={editTodo.due_date}
                  onChange={(date) => {
                    console.log("Edit date selected:", date)
                    setEditTodo({
                      ...editTodo,
                      due_date: date,
                    })
                  }}
                  label=""
                />
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
