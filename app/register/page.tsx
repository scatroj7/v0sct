"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { registerUser, saveUserToLocal, isEmailRegistered } from "@/app/lib/simple-auth"

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      if (password.length < 6) {
        setError("Şifre en az 6 karakter olmalıdır.")
        setIsLoading(false)
        return
      }

      if (isEmailRegistered(email)) {
        setError("Bu email adresi zaten kayıtlı.")
        setIsLoading(false)
        return
      }

      const user = registerUser(name, email, password)
      if (user) {
        saveUserToLocal(user)
        router.push("/panel")
      } else {
        setError("Kayıt sırasında bir hata oluştu.")
      }
    } catch (error) {
      console.error("Register hatası:", error)
      setError("Kayıt sırasında bir hata oluştu.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background dark:bg-gray-950 p-4">
      <Card className="w-full max-w-md dark:bg-gray-900 dark:border-gray-800">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold dark:text-white">Kayıt Ol</CardTitle>
          <CardDescription className="dark:text-gray-400">
            Yeni hesap oluşturarak finanslarınızı takip etmeye başlayın.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleRegister}>
          <CardContent className="space-y-4">
            {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}

            <div className="space-y-2">
              <Label htmlFor="name" className="dark:text-gray-300">
                Ad Soyad
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Adınızı girin"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              />
            </div>

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
                placeholder="En az 6 karakter"
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
              {isLoading ? "Kayıt Oluşturuluyor..." : "Kayıt Ol"}
            </Button>
          </CardContent>
        </form>
        <CardFooter>
          <div className="text-sm text-center w-full dark:text-gray-400">
            Zaten hesabınız var mı?{" "}
            <Link href="/login" className="text-primary dark:text-blue-400 hover:underline">
              Giriş Yap
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
