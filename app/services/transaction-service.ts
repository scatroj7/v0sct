/**
 * İşlemleri yeniden yükleme
 */
export async function fetchTransactions() {
  try {
    console.log("İşlemler getiriliyor...")

    const response = await fetch("/api/transactions", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    // Yanıt metnini al
    const responseText = await response.text()
    console.log("İşlemler yanıtı (ham):", responseText)

    // Yanıt JSON mu kontrol et
    let data
    try {
      data = JSON.parse(responseText)
    } catch (parseError) {
      console.error("Yanıt JSON olarak parse edilemedi:", parseError)
      throw new Error(`Geçersiz JSON yanıtı: ${responseText}`)
    }

    if (!response.ok) {
      console.error("Sunucu hatası:", response.status, data)
      throw new Error(data.message || `Sunucu hatası: ${response.status}`)
    }

    console.log(`${data.transactions?.length || 0} işlem alındı`)
    return data.transactions || []
  } catch (error) {
    console.error("İşlemler yüklenirken hata:", error)
    throw error // Hatayı yukarı fırlat
  }
}

/**
 * Çoklu işlem silme - batch-delete endpoint'ini kullanır
 */
export async function deleteTransactions(ids: string[]) {
  try {
    console.log("Seçili işlemler siliniyor:", ids)

    // Bu endpoint yerine batch-delete kullanıyoruz
    const response = await fetch("/api/transactions/batch-delete", {
      method: "POST", // DELETE yerine POST kullanıyoruz
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ids }),
    })

    // Yanıt metnini al
    const responseText = await response.text()
    console.log("Silme yanıtı (ham):", responseText)

    // Yanıt JSON mu kontrol et
    let result
    try {
      result = JSON.parse(responseText)
    } catch (parseError) {
      console.error("Yanıt JSON olarak parse edilemedi:", parseError)
      throw new Error(`Sunucu yanıtı geçersiz: ${responseText}`)
    }

    if (!response.ok) {
      console.error("Sunucu hatası:", response.status, result)
      throw new Error(result.message || `Sunucu hatası: ${response.status}`)
    }

    console.log("Silme işlemi sonucu:", result)
    return result
  } catch (error) {
    console.error("İşlemler silinirken hata:", error)
    throw error
  }
}

/**
 * Tekli işlem silme - [id] endpoint'ini kullanır
 */
export async function deleteTransaction(id: string) {
  try {
    console.log("İşlem siliniyor:", id)

    const response = await fetch(`/api/transactions/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    })

    // Yanıt metnini al
    const responseText = await response.text()
    console.log("Silme yanıtı (ham):", responseText)

    // Yanıt JSON mu kontrol et
    let result
    try {
      result = JSON.parse(responseText)
    } catch (parseError) {
      console.error("Yanıt JSON olarak parse edilemedi:", parseError)
      throw new Error(`Sunucu yanıtı geçersiz: ${responseText}`)
    }

    if (!response.ok) {
      console.error("Sunucu hatası:", response.status, result)
      throw new Error(result.message || `Sunucu hatası: ${response.status}`)
    }

    console.log("Silme işlemi sonucu:", result)
    return result
  } catch (error) {
    console.error("İşlem silinirken hata:", error)
    throw error
  }
}

/**
 * Veritabanı durumunu kontrol et
 */
export async function checkDatabaseStatus() {
  try {
    const response = await fetch("/api/db-status", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Sunucu hatası: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Veritabanı durumu kontrol edilirken hata:", error)
    throw error
  }
}
