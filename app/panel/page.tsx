"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { isUserLoggedIn, getUserFromLocal } from "@/app/lib/simple-auth"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield } from "lucide-react"
import TransactionsTab from "./components/transactions-tab"
import BudgetsTab from "./components/budgets-tab"
import InvestmentsTab from "./components/investments-tab"
import TodosTab from "./components/todos-tab"
import SummaryTab from "./components/summary-tab"
import AdminPanel from "./components/admin-panel"

export default function PanelPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Client-side auth kontrolü
    if (!isUserLoggedIn()) {
      router.push("/login")
      return
    }

    const userData = getUserFromLocal()
    if (userData) {
      setUser(userData)
      // Admin kontrolü - sadece huseyin97273@gmail.com
      const adminCheck = userData.email === "huseyin97273@gmail.com"
      setIsAdmin(adminCheck)
      console.log("👤 Kullanıcı:", userData.email, "Admin:", adminCheck)
    }

    setIsLoading(false)
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Yükleniyor...</div>
      </div>
    )
  }

  if (!user) {
    return null // Redirect edilecek
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">ScaTrack Panel</h1>
        <p className="text-gray-600">
          Hoş geldin, {user.name}!{isAdmin && <span className="ml-2 text-orange-600 font-semibold">👑 ADMIN</span>}
        </p>
      </div>

      <Tabs defaultValue="summary" className="space-y-4">
        <TabsList className={`grid w-full ${isAdmin ? "grid-cols-6" : "grid-cols-5"}`}>
          <TabsTrigger value="summary">Özet</TabsTrigger>
          <TabsTrigger value="transactions">İşlemler</TabsTrigger>
          <TabsTrigger value="budgets">Bütçe</TabsTrigger>
          <TabsTrigger value="investments">Yatırımlar</TabsTrigger>
          <TabsTrigger value="todos">Görevler</TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="admin" className="text-orange-600">
              <Shield className="h-4 w-4 mr-1" />
              Admin
            </TabsTrigger>
          )}
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

        {isAdmin && (
          <TabsContent value="admin">
            <AdminPanel />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
