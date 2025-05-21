"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import TransactionsTab from "./components/transactions-tab"
import SummaryTab from "./components/summary-tab"
import TodosTab from "./components/todos-tab"
import BudgetsTab from "./components/budgets-tab"
import InvestmentsTab from "./components/investments-tab"

export default function PanelPage() {
  const [activeTab, setActiveTab] = useState("summary")

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold">Finans Takip Paneli</h1>
      <Card>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-5">
              <TabsTrigger value="summary">Özet</TabsTrigger>
              <TabsTrigger value="transactions">İşlemler</TabsTrigger>
              <TabsTrigger value="todos">Yapılacak İşler</TabsTrigger>
              <TabsTrigger value="budgets">Bütçeler</TabsTrigger>
              <TabsTrigger value="investments">Yatırımlarım</TabsTrigger>
            </TabsList>
            <TabsContent value="summary" className="mt-6">
              <SummaryTab />
            </TabsContent>
            <TabsContent value="transactions" className="mt-6">
              <TransactionsTab />
            </TabsContent>
            <TabsContent value="todos" className="mt-6">
              <TodosTab />
            </TabsContent>
            <TabsContent value="budgets" className="mt-6">
              <BudgetsTab />
            </TabsContent>
            <TabsContent value="investments" className="mt-6">
              <InvestmentsTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
