// Frontend'de işlemleri silme fonksiyonları

// Çoklu işlem silme
export async function deleteTransactions(ids: string[]) {
  try {
    console.log("Seçili işlemler siliniyor:", ids)

    const response = await fetch("/api/transactions", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ids }), // ID listesini bir obje içerisinde gönderin
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Sunucu hatası:", response.status, errorText)
      throw new Error(`Sunucu hatası: ${response.status}`)
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error("İşlemler silinirken hata:", error)
    throw error
  }
}

// Tekli işlem silme
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
