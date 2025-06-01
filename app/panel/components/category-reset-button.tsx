"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { localStorageManager } from "@/app/lib/local-storage-manager"
import { RefreshCw } from "lucide-react"

export default function CategoryResetButton() {
  const [isResetting, setIsResetting] = useState(false)
  const { toast } = useToast()

  const resetCategories = async () => {
    try {
      setIsResetting(true)

      // Mevcut veriyi al
      const currentData = localStorageManager.loadData()

      // Yeni kategori yapısını al
      const defaultData = localStorageManager.getDefaultData()

      // Sadece kategorileri güncelle, diğer verileri koru
      currentData.categories = defaultData.categories

      // Güncellenmiş veriyi kaydet
      localStorageManager.saveData(currentData)

      toast({
        title: "Başarılı!",
        description: "Kategoriler yeni yapıya güncellendi. Sayfayı yenileyin.",
      })

      // Sayfayı yenile
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error) {
      console.error("Kategori güncelleme hatası:", error)
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Kategoriler güncellenirken bir hata oluştu.",
      })
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <Button onClick={resetCategories} disabled={isResetting} variant="outline" className="flex items-center gap-2">
      <RefreshCw className={`h-4 w-4 ${isResetting ? "animate-spin" : ""}`} />
      {isResetting ? "Güncelleniyor..." : "Kategorileri Güncelle"}
    </Button>
  )
}
