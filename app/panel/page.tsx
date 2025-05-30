"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { getUserFromLocal, logoutUser } from "@/app/lib/simple-auth"
import { localStorageManager } from "@/app/lib/local-storage-manager"

// Tab bileşenlerini import et
import TransactionsTab from "./components/transactions-tab"
import BudgetsTab from "./components/budgets-tab"
import SummaryTab from "./components/summary-tab"
import TodosTab from "./components/todos-tab"
import InvestmentsTab from "./components/investments-tab"

export default function PanelPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const currentUser = getUserFromLocal()

    if (!currentUser) {
      router.push("/login")
      return
    }

    console.log("👤 Kullanıcı:", currentUser.email, "ID:", currentUser.id)
    setUser(currentUser)

    // Local storage manager'a kullanıcıyı ayarla
    localStorageManager.setCurrentUser(currentUser.id)
    console.log("🔧 Local storage manager kullanıcı ayarlandı:", currentUser.id)

    setLoading(false)
  }, [router])

  const handleLogout = () => {
    logoutUser()
    router.push("/login")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Yükleniyor...</p>
      </div>
    )
  }

  if (!user) {
    return null
  }

  console.log("🔄 Panel render - User:", user.email)

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Finans Takip Paneli</h1>
            <p className="text-muted-foreground">Hoş geldin, {user.name}!</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Çıkış Yap
          </Button>
        </div>

        {/* Ana Tabs */}
        <Tabs defaultValue="summary" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="summary">Özet</TabsTrigger>
            <TabsTrigger value="transactions">İşlemler</TabsTrigger>
            <TabsTrigger value="budgets">Bütçeler</TabsTrigger>
            <TabsTrigger value="investments">Yatırımlar</TabsTrigger>
            <TabsTrigger value="todos">Görevler</TabsTrigger>
          </TabsList>

          <TabsContent value="summary">
            <SummaryTab />
          </TabsContent>

          <TabsContent value="transactions">
            <TransactionsTab />
          </TabsContent>

          <TabsContent value="budgets">
            <BudgetsTab />
          </TabsContent>

          <TabsContent value="investments">
            <InvestmentsTab />
          </TabsContent>

          <TabsContent value="todos">
            <TodosTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
