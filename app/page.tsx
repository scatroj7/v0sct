"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  useEffect(() => {
    // Sayfa yüklendiğinde log
    console.log("Anasayfa yüklendi")
    console.log("Mevcut URL:", window.location.href)
    console.log("Mevcut Path:", window.location.pathname)
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-background dark:bg-gray-950">
      <header className="border-b border-border dark:border-gray-800 py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold dark:text-white">Finans Takip Uygulaması</h1>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center">
        <div className="container mx-auto px-4 py-12 text-center">
          <h2 className="text-4xl font-bold mb-6 dark:text-white">Kişisel Finanslarınızı Takip Edin</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto text-muted-foreground dark:text-gray-400">
            Gelir ve giderlerinizi kolayca takip edin, bütçenizi planlayın ve finansal hedeflerinize ulaşın.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" className="dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white">
                Giriş Yap
              </Button>
            </Link>
            <Link href="/register">
              <Button
                variant="outline"
                size="lg"
                className="dark:border-blue-600 dark:text-blue-400 dark:hover:bg-blue-900/20"
              >
                Kayıt Ol
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-border dark:border-gray-800 py-4">
        <div className="container mx-auto px-4 text-center text-muted-foreground dark:text-gray-500">
          <p>© {new Date().getFullYear()} Finans Takip Uygulaması. Tüm hakları saklıdır.</p>
        </div>
      </footer>
    </div>
  )
}
