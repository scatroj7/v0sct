"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function DebugPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dbStatus, setDbStatus] = useState<any>(null)
  const [transactions, setTransactions] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [rawDbData, setRawDbData] = useState<any>(null)
  const [setupResult, setSetupResult] = useState<any>(null)
  const [setupError, setSetupError] = useState<string | null>(null)
  const [rawDbError, setRawDbError] = useState<string | null>(null)
  const [connectionTest, setConnectionTest] = useState<any>(null)
  const [connectionError, setConnectionError] = useState<string | null>(null)

  // Oturum kontrolü
  useEffect(() => {
    try {
      // Session cookie'sini kontrol et
      const cookies = document.cookie.split(";").map((cookie) => cookie.trim())
      const sessionCookie = cookies.find((cookie) => cookie.startsWith("session="))

      if (sessionCookie) {
        try {
          // Cookie varsa, manuel olarak parse et ve decode et
          const sessionValue = sessionCookie.split("=")[1]
          const decodedSessionValue = decodeURIComponent(sessionValue)
          const sessionData = JSON.parse(decodedSessionValue)

          if (sessionData && sessionData.id) {
            console.log("Debug sayfası: Oturum bilgisi alındı:", sessionData)
            setUser({
              id: sessionData.id,
              email: sessionData.email || "unknown@example.com",
              name: sessionData.name || "Kullanıcı",
            })
          }
        } catch (cookieError) {
          console.error("Debug sayfası: Cookie parse hatası:", cookieError)
          setError("Oturum bilgisi alınamadı.")
        }
      } else {
        setError("Oturum bulunamadı. Lütfen giriş yapın.")
      }
    } catch (error) {
      console.error("Debug sayfası: Oturum kontrolü sırasında hata:", error)
      setError("Oturum kontrolü sırasında bir hata oluştu.")
    }
  }, [])

  // Tablo yapısını kontrol et fonksiyonu ekle
  const checkTableStructure = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log("Tablo yapıları kontrol ediliyor...")
      const response = await fetch("/api/debug/table-structure")

      // Yanıt metnini al
      const responseText = await response.text()
      console.log("Tablo yapıları yanıtı (ham):", responseText)

      // Yanıt JSON mu kontrol et
      let data
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error("JSON parse hatası:", parseError)
        setError(`Sunucu yanıtı geçersiz: ${responseText}`)
        setLoading(false)
        return
      }

      if (!response.ok) {
        console.error("HTTP hatası:", response.status, data)
        setError(`HTTP hatası: ${response.status} - ${data.message || "Bilinmeyen hata"}`)
        setLoading(false)
        return
      }

      console.log("Tablo yapıları başarıyla alındı:", data)
      alert("Tablo yapıları başarıyla alındı. Konsolu kontrol edin.")
    } catch (error) {
      console.error("Tablo yapıları kontrol edilirken hata:", error)
      setError(
        "Tablo yapıları kontrol edilirken bir hata oluştu: " + (error instanceof Error ? error.message : String(error)),
      )
    } finally {
      setLoading(false)
    }
  }

  // Veritabanı bağlantısını test et
  const testConnection = async () => {
    try {
      setLoading(true)
      setConnectionError(null)

      console.log("Veritabanı bağlantısı test ediliyor...")
      const response = await fetch("/api/test-connection")

      const responseText = await response.text()
      console.log("Ham yanıt:", responseText)

      let data
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error("JSON parse hatası:", parseError)
        setConnectionError(`Sunucu yanıtı geçersiz: ${responseText}`)
        setLoading(false)
        return
      }

      if (!response.ok) {
        console.error("HTTP hatası:", response.status, data)
        setConnectionError(`HTTP hatası: ${response.status} - ${data.message || "Bilinmeyen hata"}`)
        setLoading(false)
        return
      }

      console.log("Bağlantı testi sonucu:", data)
      setConnectionTest(data)
    } catch (error) {
      console.error("Bağlantı testi sırasında hata:", error)
      setConnectionError(
        "Bağlantı testi sırasında bir hata oluştu: " + (error instanceof Error ? error.message : String(error)),
      )
    } finally {
      setLoading(false)
    }
  }

  // Veritabanı durumunu kontrol et
  const checkDbStatus = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/db-status")

      if (!response.ok) {
        throw new Error(`HTTP hatası: ${response.status}`)
      }

      const data = await response.json()

      console.log("Veritabanı durumu:", data)
      setDbStatus(data)
    } catch (error) {
      console.error("Veritabanı durumu kontrol edilirken hata:", error)
      setError(
        "Veritabanı durumu kontrol edilirken bir hata oluştu: " +
          (error instanceof Error ? error.message : String(error)),
      )
    } finally {
      setLoading(false)
    }
  }

  // İşlemleri getir
  const fetchTransactions = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log("Debug: İşlemler getiriliyor...")
      const response = await fetch("/api/debug/transactions")

      // Yanıt metnini al
      const responseText = await response.text()
      console.log("Debug: İşlemler yanıtı (ham):", responseText)

      // Yanıt JSON mu kontrol et
      let data
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error("Debug: JSON parse hatası:", parseError)
        setError(`Geçersiz JSON yanıtı: ${responseText}`)
        setLoading(false)
        return
      }

      if (!response.ok) {
        console.error("Debug: HTTP hatası:", response.status, data)
        setError(`HTTP hatası: ${response.status} - ${data.message || "Bilinmeyen hata"}`)
        setLoading(false)
        return
      }

      console.log("Debug: İşlemler başarıyla alındı:", data)
      setTransactions(data)

      // Veritabanı durumunu da kontrol et
      await checkDbStatus()
    } catch (error) {
      console.error("Debug: İşlemler getirilirken hata:", error)
      setError("İşlemler getirilirken bir hata oluştu: " + (error instanceof Error ? error.message : String(error)))
    } finally {
      setLoading(false)
    }
  }

  // Test işlemleri ekle
  const addTestTransactions = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log("Test işlemleri ekleniyor...")
      const response = await fetch("/api/debug/add-test-transaction")

      // Yanıt metnini al
      const responseText = await response.text()
      console.log("Test işlemleri yanıtı (ham):", responseText)

      // Yanıt JSON mu kontrol et
      let data
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error("JSON parse hatası:", parseError)
        setError(`Sunucu yanıtı geçersiz: ${responseText}`)
        setLoading(false)
        return
      }

      if (!response.ok) {
        console.error("HTTP hatası:", response.status, data)
        setError(`HTTP hatası: ${response.status} - ${data.message || "Bilinmeyen hata"}`)
        setLoading(false)
        return
      }

      console.log("Test işlemleri başarıyla eklendi:", data)
      alert("Test işlemleri başarıyla eklendi: 1 gelir (5000₺) ve 1 gider (150₺)")

      // İşlemleri yenile
      await fetchTransactions()
    } catch (error) {
      console.error("Test işlemleri eklenirken hata:", error)
      setError("Test işlemleri eklenirken bir hata oluştu: " + (error instanceof Error ? error.message : String(error)))
    } finally {
      setLoading(false)
    }
  }

  // Veritabanı tablolarını kontrol et ve güncelle
  const setupDatabase = async () => {
    try {
      setLoading(true)
      setError(null)
      setSetupError(null)

      console.log("Veritabanı tabloları kontrol ediliyor ve güncelleniyor...")
      const response = await fetch("/api/setup-db")

      const responseText = await response.text()
      console.log("Ham yanıt:", responseText)

      let data
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error("JSON parse hatası:", parseError)
        setSetupError(`Sunucu yanıtı geçersiz: ${responseText}`)
        setLoading(false)
        return
      }

      if (!response.ok) {
        console.error("HTTP hatası:", response.status, data)
        setSetupError(`HTTP hatası: ${response.status} - ${data.message || "Bilinmeyen hata"}`)
        setLoading(false)
        return
      }

      console.log("Veritabanı kontrol ve güncelleme sonucu:", data)
      setSetupResult(data)

      // Veritabanı durumunu da kontrol et
      await checkDbStatus()
    } catch (error) {
      console.error("Veritabanı tabloları kontrol edilirken hata:", error)
      setSetupError(
        "Veritabanı tabloları kontrol edilirken bir hata oluştu: " +
          (error instanceof Error ? error.message : String(error)),
      )
    } finally {
      setLoading(false)
    }
  }

  // Ham veritabanı verilerini getir
  const fetchRawDbData = async () => {
    try {
      setLoading(true)
      setError(null)
      setRawDbError(null)

      console.log("Ham veritabanı verileri getiriliyor...")
      const response = await fetch("/api/db-raw")

      const responseText = await response.text()
      console.log("Ham yanıt:", responseText)

      let data
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error("JSON parse hatası:", parseError)
        setRawDbError(`Sunucu yanıtı geçersiz: ${responseText}`)
        setLoading(false)
        return
      }

      if (!response.ok) {
        console.error("HTTP hatası:", response.status, data)
        setRawDbError(`HTTP hatası: ${response.status} - ${data.message || "Bilinmeyen hata"}`)
        setLoading(false)
        return
      }

      console.log("Ham veritabanı verileri:", data)
      setRawDbData(data)
    } catch (error) {
      console.error("Ham veritabanı verileri getirilirken hata:", error)
      setRawDbError(
        "Ham veritabanı verileri getirilirken bir hata oluştu: " +
          (error instanceof Error ? error.message : String(error)),
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background dark:bg-gray-950">
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4 dark:text-white">Debug Sayfası</h1>

        {error && (
          <Alert variant="destructive" className="mb-4 dark:bg-red-900 dark:border-red-800">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Hata</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Card className="dark:bg-gray-900 dark:border-gray-800">
            <CardHeader>
              <CardTitle className="dark:text-white">Oturum Bilgisi</CardTitle>
            </CardHeader>
            <CardContent>
              {user ? (
                <pre className="bg-muted p-2 rounded overflow-auto dark:bg-gray-800 dark:text-gray-300">
                  {JSON.stringify(user, null, 2)}
                </pre>
              ) : (
                <p className="dark:text-gray-400">Oturum bilgisi bulunamadı.</p>
              )}
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-900 dark:border-gray-800">
            <CardHeader>
              <CardTitle className="dark:text-white">Kontroller</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={checkTableStructure}
                disabled={loading}
                className="w-full dark:bg-teal-600 dark:hover:bg-teal-700"
              >
                {loading ? "Kontrol Ediliyor..." : "Tablo Yapılarını Kontrol Et"}
              </Button>
              <Button
                onClick={testConnection}
                disabled={loading}
                className="w-full dark:bg-indigo-600 dark:hover:bg-indigo-700"
              >
                {loading ? "Test Ediliyor..." : "Veritabanı Bağlantısını Test Et"}
              </Button>
              <Button
                onClick={setupDatabase}
                disabled={loading}
                className="w-full dark:bg-purple-600 dark:hover:bg-purple-700"
              >
                {loading ? "Kontrol Ediliyor..." : "Veritabanı Tablolarını Kontrol Et ve Güncelle"}
              </Button>
              <Button
                onClick={checkDbStatus}
                disabled={loading}
                className="w-full dark:bg-blue-600 dark:hover:bg-blue-700"
              >
                {loading ? "Kontrol Ediliyor..." : "Veritabanı Durumunu Kontrol Et"}
              </Button>
              <Button
                onClick={fetchTransactions}
                disabled={loading}
                className="w-full dark:bg-green-600 dark:hover:bg-green-700"
              >
                {loading ? "Getiriliyor..." : "İşlemleri Getir"}
              </Button>
              <Button
                onClick={addTestTransactions}
                disabled={loading}
                className="w-full dark:bg-orange-600 dark:hover:bg-orange-700"
              >
                {loading ? "Ekleniyor..." : "Test İşlemleri Ekle"}
              </Button>
              <Button
                onClick={fetchRawDbData}
                disabled={loading}
                className="w-full dark:bg-yellow-600 dark:hover:bg-yellow-700"
              >
                {loading ? "Getiriliyor..." : "Ham Veritabanı Verilerini Getir"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="connection" className="w-full">
          <TabsList className="mb-4 dark:bg-gray-800">
            <TabsTrigger value="connection" className="dark:data-[state=active]:bg-indigo-600 dark:text-gray-300">
              Bağlantı Testi
            </TabsTrigger>
            <TabsTrigger value="setup" className="dark:data-[state=active]:bg-purple-600 dark:text-gray-300">
              Veritabanı Kurulumu
            </TabsTrigger>
            <TabsTrigger value="db-status" className="dark:data-[state=active]:bg-blue-600 dark:text-gray-300">
              Veritabanı Durumu
            </TabsTrigger>
            <TabsTrigger value="transactions" className="dark:data-[state=active]:bg-green-600 dark:text-gray-300">
              İşlemler
            </TabsTrigger>
            <TabsTrigger value="raw-data" className="dark:data-[state=active]:bg-yellow-600 dark:text-gray-300">
              Ham Veriler
            </TabsTrigger>
          </TabsList>

          <TabsContent value="connection">
            <Card className="dark:bg-gray-900 dark:border-gray-800">
              <CardHeader>
                <CardTitle className="dark:text-white">Veritabanı Bağlantı Testi</CardTitle>
              </CardHeader>
              <CardContent>
                {connectionError && (
                  <Alert variant="destructive" className="mb-4 dark:bg-red-900 dark:border-red-800">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Bağlantı Hatası</AlertTitle>
                    <AlertDescription>{connectionError}</AlertDescription>
                  </Alert>
                )}

                {connectionTest ? (
                  <pre className="bg-muted p-2 rounded overflow-auto dark:bg-gray-800 dark:text-gray-300">
                    {JSON.stringify(connectionTest, null, 2)}
                  </pre>
                ) : (
                  <p className="dark:text-gray-400">
                    Veritabanı bağlantısı henüz test edilmedi. "Veritabanı Bağlantısını Test Et" butonuna tıklayın.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="setup">
            <Card className="dark:bg-gray-900 dark:border-gray-800">
              <CardHeader>
                <CardTitle className="dark:text-white">Veritabanı Kontrol ve Güncelleme Sonucu</CardTitle>
              </CardHeader>
              <CardContent>
                {setupError && (
                  <Alert variant="destructive" className="mb-4 dark:bg-red-900 dark:border-red-800">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Kontrol Hatası</AlertTitle>
                    <AlertDescription>{setupError}</AlertDescription>
                  </Alert>
                )}

                {setupResult ? (
                  <pre className="bg-muted p-2 rounded overflow-auto dark:bg-gray-800 dark:text-gray-300">
                    {JSON.stringify(setupResult, null, 2)}
                  </pre>
                ) : (
                  <p className="dark:text-gray-400">
                    Veritabanı tabloları henüz kontrol edilmedi. "Veritabanı Tablolarını Kontrol Et ve Güncelle"
                    butonuna tıklayın.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="db-status">
            <Card className="dark:bg-gray-900 dark:border-gray-800">
              <CardHeader>
                <CardTitle className="dark:text-white">Veritabanı Durumu</CardTitle>
              </CardHeader>
              <CardContent>
                {dbStatus ? (
                  <pre className="bg-muted p-2 rounded overflow-auto dark:bg-gray-800 dark:text-gray-300">
                    {JSON.stringify(dbStatus, null, 2)}
                  </pre>
                ) : (
                  <p className="dark:text-gray-400">
                    Veritabanı durumu henüz kontrol edilmedi. "Veritabanı Durumunu Kontrol Et" butonuna tıklayın.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions">
            <Card className="dark:bg-gray-900 dark:border-gray-800">
              <CardHeader>
                <CardTitle className="dark:text-white">İşlemler</CardTitle>
              </CardHeader>
              <CardContent>
                {transactions ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium mb-2 dark:text-white">Veritabanı Bilgileri</h3>
                      <pre className="bg-muted p-2 rounded overflow-auto dark:bg-gray-800 dark:text-gray-300">
                        {JSON.stringify(transactions.dbInfo, null, 2)}
                      </pre>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-2 dark:text-white">Ham İşlemler</h3>
                      <pre className="bg-muted p-2 rounded overflow-auto dark:bg-gray-800 dark:text-gray-300">
                        {JSON.stringify(transactions.rawTransactions, null, 2)}
                      </pre>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-2 dark:text-white">Kategoriler</h3>
                      <pre className="bg-muted p-2 rounded overflow-auto dark:bg-gray-800 dark:text-gray-300">
                        {JSON.stringify(transactions.categories, null, 2)}
                      </pre>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-2 dark:text-white">İşlemler ve Kategoriler</h3>
                      <pre className="bg-muted p-2 rounded overflow-auto dark:bg-gray-800 dark:text-gray-300">
                        {JSON.stringify(transactions.transactionsWithCategories, null, 2)}
                      </pre>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-2 dark:text-white">Formatlanmış İşlemler</h3>
                      <pre className="bg-muted p-2 rounded overflow-auto dark:bg-gray-800 dark:text-gray-300">
                        {JSON.stringify(transactions.formattedTransactions, null, 2)}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <p className="dark:text-gray-400">İşlemler henüz getirilmedi. "İşlemleri Getir" butonuna tıklayın.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="raw-data">
            <Card className="dark:bg-gray-900 dark:border-gray-800">
              <CardHeader>
                <CardTitle className="dark:text-white">Ham Veritabanı Verileri</CardTitle>
              </CardHeader>
              <CardContent>
                {rawDbError && (
                  <Alert variant="destructive" className="mb-4 dark:bg-red-900 dark:border-red-800">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Ham Veri Hatası</AlertTitle>
                    <AlertDescription>{rawDbError}</AlertDescription>
                  </Alert>
                )}

                {rawDbData ? (
                  <pre className="bg-muted p-2 rounded overflow-auto dark:bg-gray-800 dark:text-gray-300">
                    {JSON.stringify(rawDbData, null, 2)}
                  </pre>
                ) : (
                  <p className="dark:text-gray-400">
                    Ham veriler henüz getirilmedi. "Ham Veritabanı Verilerini Getir" butonuna tıklayın.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
