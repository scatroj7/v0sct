"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Hatayı loglama
    console.error("Uygulama hatası:", error)
    console.log("Hata mesajı:", error.message)
    console.log("Hata stack:", error.stack)
    console.log("Hata digest:", error.digest)

    // Mevcut URL ve path
    console.log("Mevcut URL:", window.location.href)
    console.log("Mevcut Path:", window.location.pathname)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center max-w-md p-6">
        <h1 className="text-4xl font-bold mb-4">Bir Hata Oluştu</h1>
        <p className="text-lg mb-6">Üzgünüz, bir şeyler yanlış gitti.</p>

        <div className="mb-8 text-left p-4 bg-muted rounded">
          <p className="font-medium">Hata Detayları:</p>
          <p className="text-sm text-muted-foreground break-words">{error.message}</p>
          {error.digest && <p className="text-xs text-muted-foreground mt-2">Hata Kodu: {error.digest}</p>}
          <p className="text-xs text-muted-foreground mt-2">
            URL: {typeof window !== "undefined" ? window.location.href : "SSR"}
          </p>
        </div>

        <div className="flex justify-center space-x-4">
          <Button onClick={reset} variant="outline">
            Tekrar Dene
          </Button>
          <Link href="/" passHref>
            <Button>Ana Sayfaya Dön</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
