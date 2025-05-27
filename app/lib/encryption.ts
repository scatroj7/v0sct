import crypto from "crypto"

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "default-key-change-this"
const ALGORITHM = "aes-256-gcm"

// Hassas veriyi şifrele
export function encryptSensitiveData(text: string): string {
  try {
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY)

    let encrypted = cipher.update(text, "utf8", "hex")
    encrypted += cipher.final("hex")

    const authTag = cipher.getAuthTag()

    return iv.toString("hex") + ":" + authTag.toString("hex") + ":" + encrypted
  } catch (error) {
    console.error("Encryption error:", error)
    throw new Error("Veri şifreleme hatası")
  }
}

// Şifreli veriyi çöz
export function decryptSensitiveData(encryptedData: string): string {
  try {
    const parts = encryptedData.split(":")
    if (parts.length !== 3) {
      throw new Error("Geçersiz şifreli veri formatı")
    }

    const iv = Buffer.from(parts[0], "hex")
    const authTag = Buffer.from(parts[1], "hex")
    const encrypted = parts[2]

    const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY)
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(encrypted, "hex", "utf8")
    decrypted += decipher.final("utf8")

    return decrypted
  } catch (error) {
    console.error("Decryption error:", error)
    throw new Error("Veri çözme hatası")
  }
}

// Finansal veri için özel şifreleme
export function encryptFinancialAmount(amount: number): string {
  return encryptSensitiveData(amount.toString())
}

export function decryptFinancialAmount(encryptedAmount: string): number {
  const decrypted = decryptSensitiveData(encryptedAmount)
  return Number.parseFloat(decrypted)
}
