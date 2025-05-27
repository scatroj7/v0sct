"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Database, HardDrive, RefreshCw, Download, Upload, Shield, Settings } from "lucide-react"
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

  const handleSetupUsersTable = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/setup-users-table", {
        method: "POST",
      })
      const data = await response.json()

      if (data.success) {
        toast({
          title: "Başarılı! 🎉",
          description: `Users tablosu kuruldu. Toplam kullanıcı: ${data.userCount}`,
        })
        console.log("📊 Users tablo yapısı:", data.tableStructure)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Users tablosu kurulumu başarısız: " + error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSyncLocalToDb = async () => {
    setIsLoading(true)
    try {
      await hybridDataService.syncLocalToDatabase()
      toast({
        title: "Başarılı",
        description: "Local veriler veritabanına senkronize edildi",
      })
    } catch (error) {
      toast({
        title: "Hata",
        description: "Senkronizasyon başarısız",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSyncDbToLocal = async () => {
    setIsLoading(true)
    try {
      const success = await hybridDataService.syncDatabaseToLocal()
      if (success) {
        toast({
          title: "Başarılı",
          description: "Veritabanı verileri local'e senkronize edildi",
        })
      } else {
        throw new Error("Sync failed")
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Senkronizasyon başarısız",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestDbConnection = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/test-connection")
      const data = await response.json()

      if (data.success) {
        toast({
          title: "Başarılı",
          description: "Veritabanı bağlantısı aktif",
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Veritabanı bağlantısı başarısız",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
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
    } catch (error) {
      console.error("❌ Migration hatası:", error)
      setResult({
        success: false,
        error: "Veri aktarımı başarısız",
        details: error.message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCheckData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/check-data")
      const data = await response.json()

      if (data.success) {
        console.log("📊 Veritabanı durumu:", data)
        toast({
          title: "Veri Kontrolü",
          description: `Transactions: ${data.tables.transactions?.count || 0}, Investments: ${data.tables.investments?.count || 0}, Users: ${data.tables.users?.count || 0}`,
        })
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Veri kontrolü başarısız",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
            <Shield className="h-5 w-5" />
            Admin Panel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Admin Kullanıcı</p>
                <p className="text-sm text-gray-600">{userEmail}</p>
              </div>
              <Badge variant="destructive">ADMIN</Badge>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Veri Kaynağı</p>
                <p className="text-sm text-gray-600">
                  {dataSource === "database" ? "Veritabanı (PostgreSQL)" : "Local Storage"}
                </p>
              </div>
              <Badge variant={dataSource === "database" ? "default" : "secondary"}>
                {dataSource === "database" ? (
                  <Database className="h-4 w-4 mr-1" />
                ) : (
                  <HardDrive className="h-4 w-4 mr-1" />
                )}
                {dataSource.toUpperCase()}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

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

      <Card>
        <CardHeader>
          <CardTitle>Veri Yönetimi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={handleTestDbConnection}
              disabled={isLoading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Database className="h-4 w-4" />
              Veritabanı Bağlantısını Test Et
            </Button>

            <Button
              onClick={handleSetupUsersTable}
              disabled={isLoading}
              variant="outline"
              className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100"
            >
              <Settings className="h-4 w-4" />
              Users Tablosunu Kur
            </Button>

            <Button
              onClick={handleSyncDbToLocal}
              disabled={isLoading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              DB → Local Sync
            </Button>

            <Button
              onClick={handleSyncLocalToDb}
              disabled={isLoading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Local → DB Sync
            </Button>

            <Button
              onClick={handleCheckData}
              disabled={isLoading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Database className="h-4 w-4" />
              Veritabanı Verilerini Kontrol Et
            </Button>

            <Button
              onClick={() => window.location.reload()}
              disabled={isLoading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Sayfayı Yenile
            </Button>
          </div>

          {isLoading && (
            <div className="mt-4 text-center">
              <RefreshCw className="h-4 w-4 animate-spin inline mr-2" />
              İşlem devam ediyor...
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sistem Bilgileri</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Kullanıcı Tipi:</span>
              <span className="font-medium">Administrator</span>
            </div>
            <div className="flex justify-between">
              <span>Veri Erişimi:</span>
              <span className="font-medium">Database + Local Storage</span>
            </div>
            <div className="flex justify-between">
              <span>Özel Yetkiler:</span>
              <span className="font-medium">Veri Senkronizasyonu</span>
            </div>
            <div className="flex justify-between">
              <span>Backup Erişimi:</span>
              <span className="font-medium">Tam Erişim</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
