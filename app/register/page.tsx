"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { registerUser, saveUserToLocal, isEmailRegistered, debugListAllUsers } from "@/app/lib/simple-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"

export default function RegisterPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    // Validasyon
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Tüm alanları doldurun")
      setIsLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError("Şifreler eşleşmiyor")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Şifre en az 6 karakter olmalı")
      setIsLoading(false)
      return
    }

    // Email zaten kayıtlı mı kontrol et
    if (isEmailRegistered(email)) {
      setError("Bu email adresi zaten kayıtlı")
      setIsLoading(false)
      return
    }

    try {
      // Kullanıcıyı kaydet
      const newUser = registerUser(name.trim(), email.trim(), password)

      if (newUser) {
        // Kullanıcıyı local storage'a kaydet ve giriş yap
        saveUserToLocal(newUser)

        console.log("✅ Kayıt başarılı:", newUser)

        // Debug - tüm kullanıcıları listele
        debugListAllUsers()

        // Panel'e yönlendir
        router.push("/panel")
      } else {
        setError("Kayıt sırasında bir hata oluştu")
      }
    } catch (error) {
      console.error("Register error:", error)
      setError("Kayıt sırasında bir hata oluştu")
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Kayıt Ol</CardTitle>
          <CardDescription className="text-center">ScaTrack hesabınızı oluşturun</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="En az 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Şifre Tekrar</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Şifrenizi tekrar girin"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Kayıt Oluşturuluyor..." : "Kayıt Ol"}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            Zaten hesabınız var mı?{" "}
            <Link href="/login" className="text-blue-600 hover:underline">
              Giriş Yap
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
