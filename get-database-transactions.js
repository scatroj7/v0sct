// Veritabanındaki işlemleri getir
async function getDatabaseTransactions() {
  try {
    console.log("Veritabanından işlemler getiriliyor...")

    // Debug endpoint'ini çağır
    const response = await fetch("https://finans-takip-uygulamasi.vercel.app/api/debug/transactions")

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    if (data.success) {
      console.log("✅ Veritabanı bağlantısı başarılı")
      console.log(`📊 Toplam ${data.formattedTransactions.length} işlem bulundu\n`)

      // İşlemleri listele
      data.formattedTransactions.forEach((transaction, index) => {
        console.log(`${index + 1}. İşlem:`)
        console.log(`   📅 Tarih: ${transaction.date}`)
        console.log(`   📝 Açıklama: ${transaction.description}`)
        console.log(`   💰 Tutar: ${transaction.amount} TL`)
        console.log(`   📂 Kategori: ${transaction.categoryName || "Bilinmeyen"}`)
        console.log(`   🔄 Tip: ${transaction.type === "income" ? "Gelir" : "Gider"}`)
        console.log(`   🆔 ID: ${transaction.id}`)
        console.log("   ─────────────────────────────────")
      })

      // Özet bilgiler
      const totalIncome = data.formattedTransactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0)

      const totalExpense = data.formattedTransactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0)

      console.log("\n📈 ÖZET BİLGİLER:")
      console.log(`💚 Toplam Gelir: ${totalIncome} TL`)
      console.log(`❌ Toplam Gider: ${totalExpense} TL`)
      console.log(`💰 Net Durum: ${totalIncome - totalExpense} TL`)

      // Kategorilere göre grupla
      const categoryGroups = {}
      data.formattedTransactions.forEach((t) => {
        const category = t.categoryName || "Bilinmeyen"
        if (!categoryGroups[category]) {
          categoryGroups[category] = { count: 0, total: 0 }
        }
        categoryGroups[category].count++
        categoryGroups[category].total += t.amount
      })

      console.log("\n📂 KATEGORİLERE GÖRE DAĞILIM:")
      Object.entries(categoryGroups).forEach(([category, data]) => {
        console.log(`   ${category}: ${data.count} işlem, ${data.total} TL`)
      })
    } else {
      console.error("❌ Veritabanından veri alınamadı:", data.message)
    }
  } catch (error) {
    console.error("❌ Hata oluştu:", error.message)
    console.log("\n💡 Olası nedenler:")
    console.log("   - Veritabanı bağlantısı yok")
    console.log("   - API endpoint çalışmıyor")
    console.log("   - Tablolar oluşturulmamış")
  }
}

// Fonksiyonu çalıştır
getDatabaseTransactions()
