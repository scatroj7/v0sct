"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  useEffect(() => {
    // 404 sayfası yüklendiğinde log
    console.log("404 sayfası yüklendi")
    console.log("Mevcut URL:", window.location.href)
    console.log("Mevcut Path:", window.location.pathname)

    // Routing bilgilerini logla
    console.log("Routing bilgileri:", {
      href: window.location.href,
      host: window.location.host,
      hostname: window.location.hostname,
      pathname: window.location.pathname,
      protocol: window.location.protocol,
      origin: window.location.origin,
    })
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404 - Sayfa Bulunamadı</h1>
        <p className="text-lg mb-6">Aradığınız sayfa bulunamadı.</p>

        <div className="mb-8">
          <p className="text-muted-foreground">URL: {typeof window !== "undefined" ? window.location.href : "SSR"}</p>
          <p className="text-muted-foreground">
            Path: {typeof window !== "undefined" ? window.location.pathname : "SSR"}
          </p>
        </div>

        <div className="space-y-4">
          <Link href="/" className="block">
            <Button>Ana Sayfaya Dön</Button>
          </Link>
          <Link href="/login" className="block">
            <Button variant="outline">Giriş Sayfasına Git</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
