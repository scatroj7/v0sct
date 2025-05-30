"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2 } from "lucide-react"

interface Todo {
  id: string
  text: string
  completed: boolean
  createdAt: string
}

export default function TodosTab() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [newTodo, setNewTodo] = useState("")

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
    if (newTodo.trim() !== "") {
      const newTodoItem: Todo = {
        id: Date.now().toString(),
        text: newTodo.trim(),
        completed: false,
        createdAt: new Date().toISOString(),
      }
      setTodos([...todos, newTodoItem])
      setNewTodo("")
    }
  }

  const handleTodoCompletion = (id: string) => {
    setTodos(todos.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo)))
  }

  const handleRemoveTodo = (id: string) => {
    setTodos(todos.filter((todo) => todo.id !== id))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddTodo()
    }
  }

  const completedTodos = todos.filter((todo) => todo.completed).length
  const totalTodos = todos.length

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Görevler</h2>

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

      {/* Yeni görev ekleme */}
      <Card>
        <CardHeader>
          <CardTitle>Yeni Görev Ekle</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Yeni görev ekle..."
              className="flex-1"
            />
            <Button onClick={handleAddTodo} disabled={!newTodo.trim()}>
              Ekle
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Görev listesi */}
      <div className="space-y-2">
        {todos.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Henüz görev eklenmemiş. Yukarıdaki formu kullanarak yeni bir görev ekleyebilirsiniz.
          </div>
        ) : (
          todos.map((todo) => (
            <Card key={todo.id} className={todo.completed ? "opacity-75" : ""}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Checkbox checked={todo.completed} onCheckedChange={() => handleTodoCompletion(todo.id)} />
                    <span className={`${todo.completed ? "line-through text-gray-500" : ""}`}>{todo.text}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-400">
                      {new Date(todo.createdAt).toLocaleDateString("tr-TR")}
                    </span>
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
    </div>
  )
}
