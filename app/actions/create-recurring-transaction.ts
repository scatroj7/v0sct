"use server"

import { getClient } from "@/app/lib/db-server"
import { revalidatePath } from "next/cache"
import { v4 as uuidv4 } from "uuid"
import { getUserIdFromSession } from "@/app/lib/auth"

// Frequency types that correspond to the UI options
type FrequencyType = "once" | "monthly" | "every2months" | "every3months" | "yearly" | "custom"

// Interval in months for each frequency type
const frequencyIntervals: Record<FrequencyType, number> = {
  once: 0,
  monthly: 1,
  every2months: 2,
  every3months: 3,
  yearly: 12,
  custom: 0, // Özel taksit için varsayılan değer
}

// Taksit sayıları - UI'daki seçeneklere karşılık gelen değerler
const installmentCounts: Record<FrequencyType, number> = {
  once: 1, // Tek çekim
  monthly: 2, // 2 taksit
  every2months: 3, // 3 taksit
  every3months: 6, // 6 taksit
  yearly: 12, // 12 taksit
  custom: 0, // Özel taksit sayısı
}

export async function createRecurringTransaction(formData: FormData) {
  const type = formData.get("type") as string
  const categoryId = formData.get("categoryId") as string
  const amount = Number.parseFloat(formData.get("amount") as string)
  const date = new Date(formData.get("date") as string)
  const userDescription = formData.get("description") as string
  const frequency = formData.get("frequency") as FrequencyType
  const userId = (formData.get("userId") as string) || getUserIdFromSession()

  // Özel taksit sayısı
  let customInstallmentCount = 0
  const customInstallmentCountStr = formData.get("customInstallmentCount") as string
  if (customInstallmentCountStr) {
    customInstallmentCount = Number.parseInt(customInstallmentCountStr)
  }

  if (!userId) {
    throw new Error("Kullanıcı ID'si bulunamadı")
  }

  console.log("Tekrarlanan işlem oluşturuluyor:", {
    type,
    categoryId,
    amount,
    date: date.toISOString(),
    userDescription,
    frequency,
    customInstallmentCount,
    userId,
  })

  // Kategori adını bulalım
  let categoryName = ""
  try {
    const client = getClient()
    const categoryQuery = `SELECT name FROM categories WHERE id = $1`
    const categoryResult = await client.query(categoryQuery, [categoryId])
    if (categoryResult.length > 0) {
      categoryName = categoryResult[0].name
    }
  } catch (error) {
    console.error("Kategori adı alınırken hata:", error)
  }

  // Ay adları
  const months = [
    "Ocak",
    "Şubat",
    "Mart",
    "Nisan",
    "Mayıs",
    "Haziran",
    "Temmuz",
    "Ağustos",
    "Eylül",
    "Ekim",
    "Kasım",
    "Aralık",
  ]

  // Açıklama oluşturma fonksiyonu - her işlem için kendi tarihine göre
  const generateDescription = (transactionDate: Date, installmentInfo = "") => {
    const monthName = months[transactionDate.getMonth()]

    // Kullanıcı açıklaması varsa
    if (userDescription && userDescription.trim() !== "") {
      // Kullanıcının açıklamasında ay adları var mı kontrol et
      const containsMonthName = months.some((month) =>
        userDescription.toLowerCase().includes(month.toLowerCase() + " ayı"),
      )

      // Eğer kullanıcının açıklamasında zaten ay adı varsa, sadece taksit bilgisini ekle
      if (containsMonthName) {
        return `${installmentInfo}${userDescription.trim()}`
      }

      // Yoksa ay adını ekle
      return `${installmentInfo}${monthName} ayı ${userDescription.trim()}`
    }

    // Kullanıcı açıklama girmediyse, ay adı + kategori adı
    if (categoryName) {
      return `${installmentInfo}${monthName} ayı ${categoryName.toLowerCase()}`
    }

    // Hiçbir bilgi yoksa sadece ay adı
    return `${installmentInfo}${monthName} ayı işlem`
  }

  // For one-time transactions, just create a single entry
  if (frequency === "once") {
    const finalDescription = generateDescription(date)
    await createSingleTransaction(type, categoryId, amount, date, finalDescription, userId)

    revalidatePath("/panel")
    return { success: true }
  }

  // For custom installments, create entries based on the custom count
  if (frequency === "custom" && customInstallmentCount > 0) {
    const transactionPromises = []

    // Create transactions for each installment - tutarı bölmeden
    for (let i = 0; i < customInstallmentCount; i++) {
      const installmentDate = new Date(date)
      installmentDate.setMonth(date.getMonth() + i)

      // Taksit bilgisini ekle
      const installmentInfo = `${i + 1}/${customInstallmentCount} `

      // Her işlem için kendi tarihine göre açıklama oluştur
      const installmentDescription = generateDescription(installmentDate, installmentInfo)

      transactionPromises.push(
        createSingleTransaction(type, categoryId, amount, installmentDate, installmentDescription, userId),
      )
    }

    await Promise.all(transactionPromises)

    revalidatePath("/panel")
    return { success: true }
  }

  // İşlem türü kontrolü - Gider ve taksit seçeneği ise
  if (type === "expense" && frequency !== "once") {
    // Taksit sayısını belirle
    const installmentCount = installmentCounts[frequency]
    const transactionPromises = []

    // Taksit sayısı kadar işlem oluştur
    for (let i = 0; i < installmentCount; i++) {
      const installmentDate = new Date(date)
      installmentDate.setMonth(date.getMonth() + i)

      // Taksit bilgisini ekle
      const installmentInfo = `${i + 1}/${installmentCount} `

      // Her işlem için kendi tarihine göre açıklama oluştur
      const installmentDescription = generateDescription(installmentDate, installmentInfo)

      transactionPromises.push(
        createSingleTransaction(type, categoryId, amount, installmentDate, installmentDescription, userId),
      )
    }

    await Promise.all(transactionPromises)

    revalidatePath("/panel")
    return { success: true }
  }

  // For recurring income transactions, create entries until the end of the year
  const currentYear = new Date().getFullYear()
  const endOfYear = new Date(currentYear, 11, 31) // December 31st of current year

  const intervalMonths = frequencyIntervals[frequency]
  const transactionPromises = []

  // Create the initial transaction
  const initialDescription = generateDescription(date)
  transactionPromises.push(createSingleTransaction(type, categoryId, amount, date, initialDescription, userId))

  // Create future transactions until the end of the year
  let nextDate = new Date(date)
  while (true) {
    // Add months based on the frequency interval
    nextDate = new Date(nextDate)
    nextDate.setMonth(nextDate.getMonth() + intervalMonths)

    // Stop if we've gone past the end of the year
    if (nextDate > endOfYear) {
      break
    }

    // Her işlem için kendi tarihine göre açıklama oluştur
    const recurringDescription = generateDescription(nextDate)

    // Create the transaction for this date
    transactionPromises.push(createSingleTransaction(type, categoryId, amount, nextDate, recurringDescription, userId))
  }

  // Wait for all transactions to be created
  await Promise.all(transactionPromises)

  revalidatePath("/panel")
  return { success: true }
}

async function createSingleTransaction(
  type: string,
  categoryId: string,
  amount: number,
  date: Date,
  description: string,
  userId: string,
) {
  const id = uuidv4()
  const formattedDate = date.toISOString().split("T")[0]

  try {
    console.log("Tekil işlem oluşturuluyor:", {
      id,
      userId,
      type,
      categoryId,
      amount,
      date: formattedDate,
      description,
    })

    // SQL client'ı al
    const client = getClient()

    // İşlemi oluştur
    const insertQuery = `
      INSERT INTO transactions (
        id, user_id, type, category_id, amount, date, description, created_at, updated_at
      ) VALUES (
        $1, $2::TEXT, $3, $4, $5, $6, $7, NOW(), NOW()
      )
      RETURNING id
    `

    const result = await client.query(insertQuery, [id, userId, type, categoryId, amount, formattedDate, description])

    console.log("İşlem başarıyla oluşturuldu, ID:", result[0]?.id || id)
    return { success: true, id: result[0]?.id || id }
  } catch (error) {
    console.error("İşlem oluşturulurken hata:", error)
    throw error
  }
}
