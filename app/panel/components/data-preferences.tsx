"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Cloud, HardDrive, Smartphone, Wifi, WifiOff, RefreshCw, AlertTriangle } from "lucide-react"
import { hybridDataManager, type StorageMode, type DataSyncStatus } from "@/app/lib/hybrid-data-manager"
import { useToast } from "@/components/ui/use-toast"

export default function DataPreferences() {
  const { toast } = useToast()
  const [preferences, setPreferences] = useState({
    storageMode: "hybrid" as StorageMode,
    autoSync: true,
    encryptLocal: true,
    syncInterval: 5,
    offlineMode: false,
  })
  const [syncStatus, setSyncStatus] = useState<DataSyncStatus | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    loadPreferences()
    loadSyncStatus()
  }, [])

  const loadPreferences = async () => {
    try {
      const prefs = await hybridDataManager.getUserPreferences()
      setPreferences(prefs)
    } catch (error) {
      console.error("Error loading preferences:", error)
    }
  }

  const loadSyncStatus = async () => {
    try {
      const status = await hybridDataManager.getSyncStatus()
      setSyncStatus(status)
    } catch (error) {
      console.error("Error loading sync status:", error)
    }
  }

  const savePreferences = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/user/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      })

      if (response.ok) {
        toast({
          title: "Başarılı",
          description: "Tercihleriniz kaydedildi",
        })
      } else {
        throw new Error("Kaydetme hatası")
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Tercihler kaydedilemedi",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const performManualSync = async () => {
    setIsSyncing(true)
    try {
      const result = await hybridDataManager.manualSync()

      if (result.success) {
        toast({
          title: "Senkronizasyon Tamamlandı",
          description: "Verileriniz başarıyla senkronize edildi",
        })
        loadSyncStatus()
      } else if (result.conflicts && result.conflicts.length > 0) {
        toast({
          title: "Senkronizasyon Çakışması",
          description: `${result.conflicts.length} çakışma tespit edildi`,
          variant: "destructive",
        })
      } else {
        throw new Error("Senkronizasyon başarısız")
      }
    } catch (error) {
      toast({
        title: "Senkronizasyon Hatası",
        description: "Veriler senkronize edilemedi",
        variant: "destructive",
      })
    } finally {
      setIsSyncing(false)
    }
  }

  const getStorageModeIcon = (mode: StorageMode) => {
    switch (mode) {
      case "local":
        return <HardDrive className="h-4 w-4" />
      case "cloud":
        return <Cloud className="h-4 w-4" />
      case "hybrid":
        return <Smartphone className="h-4 w-4" />
    }
  }

  const getStorageModeDescription = (mode: StorageMode) => {
    switch (mode) {
      case "local":
        return "Veriler sadece cihazınızda saklanır. Hızlı erişim, internet gerektirmez."
      case "cloud":
        return "Veriler bulutta saklanır. Çoklu cihaz erişimi, otomatik yedekleme."
      case "hybrid":
        return "Veriler hem cihazda hem bulutta saklanır. En iyi performans ve güvenlik."
    }
  }

  const formatDate = (date: Date | null) => {
    if (!date) return "Hiçbir zaman"
    return new Intl.DateTimeFormat("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Veri Saklama Tercihleri
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Storage Mode */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Veri Saklama Modu</label>
            <Select
              value={preferences.storageMode}
              onValueChange={(value: StorageMode) => setPreferences({ ...preferences, storageMode: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="local">
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4" />
                    Sadece Cihazda (Local)
                  </div>
                </SelectItem>
                <SelectItem value="cloud">
                  <div className="flex items-center gap-2">
                    <Cloud className="h-4 w-4" />
                    Sadece Bulutta (Cloud)
                  </div>
                </SelectItem>
                <SelectItem value="hybrid">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    Hibrit (Önerilen)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-600">{getStorageModeDescription(preferences.storageMode)}</p>
          </div>

          {/* Auto Sync */}
          {preferences.storageMode !== "local" && (
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <label className="text-sm font-medium">Otomatik Senkronizasyon</label>
                <p className="text-sm text-gray-600">Veriler otomatik olarak senkronize edilsin</p>
              </div>
              <Switch
                checked={preferences.autoSync}
                onCheckedChange={(checked) => setPreferences({ ...preferences, autoSync: checked })}
              />
            </div>
          )}

          {/* Encrypt Local */}
          {(preferences.storageMode === "local" || preferences.storageMode === "hybrid") && (
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <label className="text-sm font-medium">Yerel Şifreleme</label>
                <p className="text-sm text-gray-600">Cihazda saklanan veriler şifrelensin</p>
              </div>
              <Switch
                checked={preferences.encryptLocal}
                onCheckedChange={(checked) => setPreferences({ ...preferences, encryptLocal: checked })}
              />
            </div>
          )}

          {/* Sync Interval */}
          {preferences.autoSync && preferences.storageMode !== "local" && (
            <div className="space-y-3">
              <label className="text-sm font-medium">Senkronizasyon Aralığı</label>
              <Select
                value={preferences.syncInterval.toString()}
                onValueChange={(value) => setPreferences({ ...preferences, syncInterval: Number.parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 dakika</SelectItem>
                  <SelectItem value="5">5 dakika</SelectItem>
                  <SelectItem value="15">15 dakika</SelectItem>
                  <SelectItem value="30">30 dakika</SelectItem>
                  <SelectItem value="60">1 saat</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Offline Mode */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <label className="text-sm font-medium">Çevrimdışı Mod</label>
              <p className="text-sm text-gray-600">İnternet bağlantısı olmadan çalış</p>
            </div>
            <Switch
              checked={preferences.offlineMode}
              onCheckedChange={(checked) => setPreferences({ ...preferences, offlineMode: checked })}
            />
          </div>

          <Button onClick={savePreferences} disabled={isLoading} className="w-full">
            {isLoading ? "Kaydediliyor..." : "Tercihleri Kaydet"}
          </Button>
        </CardContent>
      </Card>

      {/* Sync Status */}
      {preferences.storageMode !== "local" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Senkronizasyon Durumu
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {syncStatus && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4" />
                    <span className="text-sm font-medium">Son Yerel Güncelleme</span>
                  </div>
                  <p className="text-sm text-gray-600">{formatDate(syncStatus.lastLocalUpdate)}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Cloud className="h-4 w-4" />
                    <span className="text-sm font-medium">Son Bulut Güncelleme</span>
                  </div>
                  <p className="text-sm text-gray-600">{formatDate(syncStatus.lastCloudUpdate)}</p>
                </div>
              </div>
            )}

            {syncStatus?.pendingSync && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>Bekleyen senkronizasyon var. Manuel senkronizasyon yapabilirsiniz.</AlertDescription>
              </Alert>
            )}

            <div className="flex items-center gap-2">
              <Button onClick={performManualSync} disabled={isSyncing} variant="outline">
                {isSyncing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Senkronize Ediliyor...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Manuel Senkronizasyon
                  </>
                )}
              </Button>

              <div className="flex items-center gap-2">
                {preferences.offlineMode ? (
                  <Badge variant="secondary">
                    <WifiOff className="h-3 w-3 mr-1" />
                    Çevrimdışı
                  </Badge>
                ) : (
                  <Badge variant="default">
                    <Wifi className="h-3 w-3 mr-1" />
                    Çevrimiçi
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
