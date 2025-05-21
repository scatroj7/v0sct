"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCcw, CheckCircle, XCircle, AlertTriangle } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

type ApiStatus = {
  status: "success" | "error" | "warning" | "info"
  message: string
  data?: any
  info?: string
}

type ApiTestResults = {
  coingecko?: ApiStatus
  exchangerate?: ApiStatus
  alphavantage?: ApiStatus
  truncgil?: ApiStatus
  metalpriceapi?: ApiStatus
}

export default function ApiTestPage() {
  const [results, setResults] = useState<ApiTestResults | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchApiStatus = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/test-api")
      if (!response.ok) throw new Error("API test isteği başarısız oldu")
      const data = await response.json()
      setResults(data)
    } catch (error) {
      console.error("API test hatası:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchApiStatus()
    setRefreshing(false)
  }

  useEffect(() => {
    fetchApiStatus()
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="h-4 w-4 mr-1" /> Çalışıyor
          </Badge>
        )
      case "error":
        return (
          <Badge className="bg-red-500">
            <XCircle className="h-4 w-4 mr-1" /> Hata
          </Badge>
        )
      case "warning":
        return (
          <Badge className="bg-yellow-500">
            <AlertTriangle className="h-4 w-4 mr-1" /> Uyarı
          </Badge>
        )
      case "info":
        return (
          <Badge className="bg-blue-500">
            <AlertTriangle className="h-4 w-4 mr-1" /> Bilgi
          </Badge>
        )
      default:
        return <Badge>Bilinmiyor</Badge>
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">API Durum Testi</h1>
        <Button onClick={handleRefresh} disabled={refreshing}>
          <RefreshCcw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Yenileniyor..." : "Yenile"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CoinGecko API */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>CoinGecko API</CardTitle>
              {!loading && results?.coingecko && getStatusBadge(results.coingecko.status)}
            </div>
            <CardDescription>Kripto para fiyatları için kullanılıyor</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : results?.coingecko ? (
              <div>
                <p className="mb-2">{results.coingecko.message}</p>
                {results.coingecko.data && (
                  <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-32">
                    {JSON.stringify(results.coingecko.data, null, 2)}
                  </pre>
                )}
              </div>
            ) : (
              <p className="text-red-500">API bilgisi alınamadı</p>
            )}
          </CardContent>
          <CardFooter className="text-xs text-gray-500">
            {results?.coingecko?.info || "Ücretsiz planda dakikada 10-30 istek limiti var."}
          </CardFooter>
        </Card>

        {/* ExchangeRate API */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>ExchangeRate API</CardTitle>
              {!loading && results?.exchangerate && getStatusBadge(results.exchangerate.status)}
            </div>
            <CardDescription>Döviz kurları için kullanılıyor</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : results?.exchangerate ? (
              <div>
                <p className="mb-2">{results.exchangerate.message}</p>
                {results.exchangerate.data && (
                  <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-32">
                    {JSON.stringify(results.exchangerate.data, null, 2)}
                  </pre>
                )}
              </div>
            ) : (
              <p className="text-red-500">API bilgisi alınamadı</p>
            )}
          </CardContent>
          <CardFooter className="text-xs text-gray-500">
            {results?.exchangerate?.info || "Ücretsiz planda aylık 1500 istek limiti var."}
          </CardFooter>
        </Card>

        {/* Alpha Vantage API */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Alpha Vantage API</CardTitle>
              {!loading && results?.alphavantage && getStatusBadge(results.alphavantage.status)}
            </div>
            <CardDescription>BIST hisse senetleri için kullanılıyor</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : results?.alphavantage ? (
              <div>
                <p className="mb-2">{results.alphavantage.message}</p>
                {results.alphavantage.data && (
                  <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-32">
                    {JSON.stringify(results.alphavantage.data, null, 2)}
                  </pre>
                )}
              </div>
            ) : (
              <p className="text-red-500">API bilgisi alınamadı</p>
            )}
          </CardContent>
          <CardFooter className="text-xs text-gray-500">
            {results?.alphavantage?.info ||
              "Ücretsiz planda dakikada 5, günde 500 istek limiti var. Veriler 15-20 dakika gecikmeli."}
          </CardFooter>
        </Card>

        {/* Truncgil API */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Truncgil API</CardTitle>
              {!loading && results?.truncgil && getStatusBadge(results.truncgil.status)}
            </div>
            <CardDescription>Altın ve döviz için yedek API olarak kullanılıyor</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : results?.truncgil ? (
              <div>
                <p className="mb-2">{results.truncgil.message}</p>
                {results.truncgil.data && (
                  <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-32">
                    {JSON.stringify(results.truncgil.data, null, 2)}
                  </pre>
                )}
              </div>
            ) : (
              <p className="text-red-500">API bilgisi alınamadı</p>
            )}
          </CardContent>
          <CardFooter className="text-xs text-gray-500">
            {results?.truncgil?.info || "Resmi olmayan bir API. Yedek olarak kullanılıyor."}
          </CardFooter>
        </Card>

        {/* Metal Price API */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Metal Price API</CardTitle>
              {!loading && results?.metalpriceapi && getStatusBadge(results.metalpriceapi.status)}
            </div>
            <CardDescription>Altın fiyatları için alternatif API olarak kullanılıyor</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : results?.metalpriceapi ? (
              <div>
                <p className="mb-2">{results.metalpriceapi.message}</p>
                {results.metalpriceapi.data && (
                  <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-32">
                    {JSON.stringify(results.metalpriceapi.data, null, 2)}
                  </pre>
                )}
              </div>
            ) : (
              <p className="text-red-500">API bilgisi alınamadı</p>
            )}
          </CardContent>
          <CardFooter className="text-xs text-gray-500">
            {results?.metalpriceapi?.info || "Demo anahtar ile sınırlı kullanım."}
          </CardFooter>
        </Card>
      </div>

      <div className="mt-8 bg-gray-100 p-4 rounded-lg">
        <h2 className="text-xl font-bold mb-2">API Kullanım Bilgileri</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>CoinGecko API:</strong> Kripto para fiyatları için kullanılıyor. Ücretsiz planda dakikada 10-30
            istek limiti var.
          </li>
          <li>
            <strong>ExchangeRate API:</strong> Döviz kurları için kullanılıyor. Ücretsiz planda aylık 1500 istek limiti
            var.
          </li>
          <li>
            <strong>Alpha Vantage API:</strong> BIST hisse senetleri için kullanılıyor. Ücretsiz planda dakikada 5,
            günde 500 istek limiti var. Veriler 15-20 dakika gecikmeli.
          </li>
          <li>
            <strong>Truncgil API:</strong> Altın ve döviz için yedek API olarak kullanılıyor. Resmi olmayan bir API.
          </li>
          <li>
            <strong>Metal Price API:</strong> Altın fiyatları için alternatif API olarak kullanılıyor. Demo anahtar ile
            sınırlı kullanım.
          </li>
        </ul>
      </div>
    </div>
  )
}
