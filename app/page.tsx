"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AnimatedStars } from "@/components/animated-stars"

export default function Home() {
  useEffect(() => {
    // Sayfa yüklendiğinde log
    console.log("Anasayfa yüklendi")
    console.log("Mevcut URL:", window.location.href)
    console.log("Mevcut Path:", window.location.pathname)
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-background dark:bg-gray-950 relative overflow-hidden">
      {/* Animasyonlu yıldızlar arka planı */}
      <AnimatedStars />

      <header className="border-b border-border dark:border-gray-800 py-4 relative z-10">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold dark:text-white flex items-center">
            <span className="text-blue-950 dark:text-blue-200">ScaTrack</span>
          </h1>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center relative z-10">
        <div className="container mx-auto px-4 py-12 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 dark:text-white bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-800">
            Finansal Geleceğinizi Kontrol Edin
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto text-muted-foreground dark:text-gray-300">
            Gelir ve giderlerinizi analizlerle yönetin. Akıllı bütçeleme, gerçek zamanlı öngörüler ve füturistik bir
            deneyim ile finansal gücünüzü artırın.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-500 to-blue-800 hover:from-blue-600 hover:to-blue-900 text-white border-0 min-w-[150px] rounded-full transition-all duration-300"
              >
                Giriş Yap
              </Button>
            </Link>
            <Link href="/register">
              <Button
                variant="outline"
                size="lg"
                className="border-blue-500 text-blue-500 dark:border-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 min-w-[150px] rounded-full transition-all duration-300"
              >
                Kayıt Ol
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-border dark:border-gray-800 py-4 relative z-10">
        <div className="container mx-auto px-4 text-center text-muted-foreground dark:text-gray-500">
          <p>© {new Date().getFullYear()} ScaTrack. Tüm hakları saklıdır.</p>
        </div>
      </footer>
    </div>
  )
}
