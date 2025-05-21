"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      // Basit doğrulama
      if (!email || !password) {
        setError("E-posta ve şifre gereklidir.")
        setIsLoading(false)
        return
      }

      // Oturum verilerini oluştur
      const sessionData = {
        id: "user-id",
        email: email,
        name: "Kullanıcı",
      }

      // Çerezi güvenli bir şekilde ayarla - encodeURIComponent kullanarak
      const encodedSessionData = encodeURIComponent(JSON.stringify(sessionData))
      document.cookie = `session=${encodedSessionData}; path=/; max-age=86400;`

      // Panel sayfasına yönlendir
      router.push("/panel")
    } catch (error) {
      console.error("Giriş hatası:", error)
      setError("Giriş sırasında bir hata oluştu.")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background dark:bg-gray-950 p-4">
      <Card className="w-full max-w-md dark:bg-gray-900 dark:border-gray-800">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold dark:text-white">Giriş Yap</CardTitle>
          <CardDescription className="dark:text-gray-400">
            Hesabınıza giriş yaparak finanslarınızı takip edin.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}

            <div className="space-y-2">
              <Label htmlFor="email" className="dark:text-gray-300">
                E-posta
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="ornek@mail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="dark:text-gray-300">
                Şifre
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              />
            </div>

            <Button
              type="submit"
              className="w-full dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white"
              disabled={isLoading}
            >
              {isLoading ? "Giriş Yapılıyor..." : "Giriş Yap"}
            </Button>
          </CardContent>
        </form>
        <CardFooter>
          <div className="text-sm text-center w-full dark:text-gray-400">
            Hesabınız yok mu?{" "}
            <Link href="/register" className="text-primary dark:text-blue-400 hover:underline">
              Kayıt Ol
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
