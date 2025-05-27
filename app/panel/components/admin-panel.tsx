"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { hybridDataService } from "@/app/lib/hybrid-data-service"
import { getUserFromLocal } from "@/app/lib/simple-auth"

export default function AdminPanel() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [dataSource, setDataSource] = useState<"database" | "local">("local")
  const [userEmail, setUserEmail] = useState("")
  const [isAdmin, setIsAdmin] = useState(false)
  const [result, setResult] = useState<any>(null)

  useEffect(() => {
    // Client-side'da kullanıcı bilgilerini al
    try {
      const user = getUserFromLocal()
      if (user) {
        setUserEmail(user.email || "")
        setIsAdmin(user.email === "huseyin97273@gmail.com")
        setDataSource(hybridDataService.getDataSource())
      }
    } catch (error) {
      console.error("User info error:", error)
    }
  }, [])

  if (!isAdmin) {
    return null // Admin değilse panel gösterme
  }

  const handleMigrateData = async () => {
    setIsLoading(true)
    try {
      console.log("🚀 Veri aktarımı başlatılıyor...")

      const response = await fetch("/api/admin/migrate-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      })

      const data = await response.json()
      console.log("📦 Migration sonucu:", data)
      setResult(data)

      if (data.success) {
        toast({
          title: "Başarılı! 🎉",
          description: "Eski veriler başarıyla aktarıldı",
        })
      } else {
        toast({
          title: "Hata",
          description: data.error || "Veri aktarımı başarısız",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("❌ Migration hatası:", error)
      setResult({
        success: false,
        error: "Veri aktarımı başarısız",
        details: error.message,
      })
      toast({
        title: "Hata",
        description: "Veri aktarımı başarısız",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            👑 Admin Panel
            <Badge variant={dataSource === "database" ? "default" : "secondary"}>
              {dataSource === "database" ? "Database" : "Local Storage"}
            </Badge>
          </CardTitle>
          <CardDescription>Sadece admin kullanıcıları (huseyin97273@gmail.com) için özel işlemler</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Veri Aktarımı</h3>
            <p className="text-sm text-muted-foreground">
              Demo verileri veritabanına aktarır ve mevcut verilerle birleştirir.
            </p>
            <Button onClick={handleMigrateData} disabled={isLoading} className="w-full">
              {isLoading ? "Aktarılıyor..." : "ESKİ VERİLERİ AKTAR"}
            </Button>
          </div>

          {result && (
            <div className="mt-4 p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Sonuç:</h4>
              <pre className="text-sm bg-muted p-2 rounded overflow-auto">{JSON.stringify(result, null, 2)}</pre>
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            <p>• Admin kullanıcıları veritabanından veri çeker</p>
            <p>• Normal kullanıcılar local storage kullanır</p>
            <p>• Veri kaynağı: {dataSource}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
