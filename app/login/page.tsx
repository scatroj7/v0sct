"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { validateCredentials, saveUserToLocal, registerUser, isEmailRegistered } from "@/app/lib/simple-auth"
import { AnimatedStars } from "@/components/animated-stars"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [isRegisterMode, setIsRegisterMode] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      if (isRegisterMode) {
        // Kayıt işlemi
        if (password.length < 6) {
          setError("Şifre en az 6 karakter olmalıdır")
          setLoading(false)
          return
        }

        if (isEmailRegistered(email)) {
          setError("Bu email adresi zaten kayıtlı")
          setLoading(false)
          return
        }

        const newUser = registerUser(name, email, password)
        if (newUser) {
          saveUserToLocal(newUser)
          router.push("/panel")
        } else {
          setError("Kayıt sırasında bir hata oluştu")
        }
      } else {
        // Giriş işlemi
        const user = validateCredentials(email, password)
        if (user) {
          saveUserToLocal(user)
          router.push("/panel")
        } else {
          setError("Geçersiz email veya şifre")
        }
      }
    } catch (error) {
      console.error("Auth error:", error)
      setError("Bir hata oluştu")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background dark:bg-gray-950 relative overflow-hidden">
      {/* Animasyonlu yıldızlar arka planı */}
      <AnimatedStars />

      <Card className="w-full max-w-md relative z-10">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">ScaTrack</CardTitle>
          <CardDescription className="text-center">
            {isRegisterMode ? "Yeni hesap oluşturun" : "Hesabınıza giriş yapın"}
            {!isRegisterMode && (
              <div className="mt-2 text-xs text-gray-500">Admin: huseyin97273@gmail.com / huseyin97273@gmail.com</div>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegisterMode && (
              <div className="space-y-2">
                <Label htmlFor="name">Ad Soyad</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Adınızı girin"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Şifre</Label>
              <Input
                id="password"
                type="password"
                placeholder={isRegisterMode ? "En az 6 karakter" : "Şifrenizi girin"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && <div className="text-red-500 text-sm text-center">{error}</div>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "İşleniyor..." : isRegisterMode ? "Hesap Oluştur" : "Giriş Yap"}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(!isRegisterMode)
                setError("")
                setName("")
                setEmail("")
                setPassword("")
              }}
              className="text-sm text-blue-600 hover:underline"
            >
              {isRegisterMode ? "Zaten hesabınız var mı? Giriş yapın" : "Hesabınız yok mu? Kayıt olun"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
