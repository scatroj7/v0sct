// Şu servisleri içeren bir dosyaya (örn: app/services/transaction-service.ts) yerleştirin

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

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Sunucu hatası:", response.status, errorText)
      throw new Error(`Sunucu hatası: ${response.status}`)
    }

    const result = await response.json()
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

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Sunucu hatası:", response.status, errorText)
      throw new Error(`Sunucu hatası: ${response.status}`)
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error("İşlem silinirken hata:", error)
    throw error
  }
}

/**
 * İşlemleri yeniden yükleme
 */
export async function fetchTransactions() {
  try {
    const response = await fetch("/api/transactions", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Sunucu hatası: ${response.status}`)
    }

    const data = await response.json()
    console.log(`${data.transactions?.length || 0} işlem alındı`)
    return data.transactions || []
  } catch (error) {
    console.error("İşlemler yüklenirken hata:", error)
    return []
  }
}
