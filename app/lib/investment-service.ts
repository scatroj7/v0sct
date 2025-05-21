// Alpha Vantage API için ücretsiz bir anahtar alınmalı
// https://www.alphavantage.co/support/#api-key
const ALPHA_VANTAGE_API_KEY = "demo" // Gerçek uygulamada çevre değişkeni olarak saklanmalı

// Yatırım türlerine göre sembol formatları
const formatSymbol = (type: string, symbol: string): string => {
  switch (type) {
    case "stock":
      // Türk hisseleri için BIST. ekle
      if (symbol.length <= 5 && !symbol.includes(".")) {
        return `BIST.${symbol}`
      }
      return symbol
    case "forex":
      // Forex için para birimi çiftini kontrol et
      if (!symbol.includes("/")) {
        return `${symbol}/TRY` // Varsayılan olarak TRY ile eşleştir
      }
      return symbol
    case "crypto":
      // Kripto için BTC gibi sembolleri BTC/USD formatına dönüştür
      if (!symbol.includes("/")) {
        return `${symbol}/USD` // Varsayılan olarak USD ile eşleştir
      }
      return symbol
    case "gold":
      // Altın için XAU/USD veya XAU/TRY formatını kullan
      if (symbol.toLowerCase() === "gold" || symbol.toLowerCase() === "xau") {
        return "XAU/USD"
      }
      if (symbol.toLowerCase() === "gram" || symbol.toLowerCase() === "gram altın") {
        return "XAU/TRY"
      }
      return symbol
    default:
      return symbol
  }
}

// Alpha Vantage API'dan güncel fiyat çekme
export const fetchLatestPrice = async (
  investmentType: string,
  symbol: string,
): Promise<{ price: number; timestamp: string } | null> => {
  try {
    const formattedSymbol = formatSymbol(investmentType, symbol)
    console.log(`${formattedSymbol} için fiyat çekiliyor...`)

    let apiUrl = ""
    let responseHandler: (data: any) => { price: number; timestamp: string } | null

    switch (investmentType) {
      case "stock":
        // Hisse senedi için Global Quote API'ını kullan
        apiUrl = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${formattedSymbol}&apikey=${ALPHA_VANTAGE_API_KEY}`
        responseHandler = (data) => {
          if (data["Global Quote"] && data["Global Quote"]["05. price"]) {
            return {
              price: Number.parseFloat(data["Global Quote"]["05. price"]),
              timestamp: new Date().toISOString(),
            }
          }
          return null
        }
        break

      case "forex":
        // Döviz için Currency Exchange Rate API'ını kullan
        const [fromCurrency, toCurrency] = formattedSymbol.split("/")
        apiUrl = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${fromCurrency}&to_currency=${toCurrency}&apikey=${ALPHA_VANTAGE_API_KEY}`
        responseHandler = (data) => {
          if (data["Realtime Currency Exchange Rate"] && data["Realtime Currency Exchange Rate"]["5. Exchange Rate"]) {
            return {
              price: Number.parseFloat(data["Realtime Currency Exchange Rate"]["5. Exchange Rate"]),
              timestamp: data["Realtime Currency Exchange Rate"]["6. Last Refreshed"] || new Date().toISOString(),
            }
          }
          return null
        }
        break

      case "crypto":
        // Kripto için Digital Currency Exchange Rate API'ını kullan
        const [cryptoSymbol, marketCurrency] = formattedSymbol.split("/")
        apiUrl = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${cryptoSymbol}&to_currency=${marketCurrency}&apikey=${ALPHA_VANTAGE_API_KEY}`
        responseHandler = (data) => {
          if (data["Realtime Currency Exchange Rate"] && data["Realtime Currency Exchange Rate"]["5. Exchange Rate"]) {
            return {
              price: Number.parseFloat(data["Realtime Currency Exchange Rate"]["5. Exchange Rate"]),
              timestamp: data["Realtime Currency Exchange Rate"]["6. Last Refreshed"] || new Date().toISOString(),
            }
          }
          return null
        }
        break

      case "gold":
        // Altın için XAU/USD veya XAU/TRY döviz kuru API'ını kullan
        const [goldSymbol, goldCurrency] = formattedSymbol.split("/")
        apiUrl = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${goldSymbol}&to_currency=${goldCurrency}&apikey=${ALPHA_VANTAGE_API_KEY}`
        responseHandler = (data) => {
          if (data["Realtime Currency Exchange Rate"] && data["Realtime Currency Exchange Rate"]["5. Exchange Rate"]) {
            return {
              price: Number.parseFloat(data["Realtime Currency Exchange Rate"]["5. Exchange Rate"]),
              timestamp: data["Realtime Currency Exchange Rate"]["6. Last Refreshed"] || new Date().toISOString(),
            }
          }
          return null
        }
        break

      case "fund":
        // Yatırım fonları için Time Series API'ını kullan (not: ücretsiz API'da sınırlı destek var)
        apiUrl = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${formattedSymbol}&apikey=${ALPHA_VANTAGE_API_KEY}`
        responseHandler = (data) => {
          if (data["Time Series (Daily)"]) {
            // En son günün verilerini al
            const dates = Object.keys(data["Time Series (Daily)"]).sort().reverse()
            if (dates.length > 0) {
              const latestDate = dates[0]
              const latestData = data["Time Series (Daily)"][latestDate]
              return {
                price: Number.parseFloat(latestData["4. close"]),
                timestamp: latestDate,
              }
            }
          }
          return null
        }
        break

      default:
        console.error(`Bilinmeyen yatırım türü: ${investmentType}`)
        return null
    }

    // API isteği gönder
    const response = await fetch(apiUrl)
    if (!response.ok) {
      throw new Error(`API yanıtı başarısız: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    // API limiti aşıldı mı kontrol et
    if (data.Note && data.Note.includes("API call frequency")) {
      console.warn("Alpha Vantage API çağrı limiti aşıldı:", data.Note)
      return null
    }

    // API hatası var mı kontrol et
    if (data.Error) {
      console.error("Alpha Vantage API hatası:", data.Error)
      return null
    }

    // Veriyi işle
    const result = responseHandler(data)
    if (result) {
      console.log(`${formattedSymbol} için fiyat başarıyla çekildi:`, result.price)
      return result
    } else {
      console.warn(`${formattedSymbol} için fiyat bulunamadı:`, data)
      return null
    }
  } catch (error) {
    console.error(`Fiyat çekilirken hata: ${error}`)
    return null
  }
}

// Yatırım türleri
export const investmentTypes = [
  { value: "stock", label: "Hisse Senedi" },
  { value: "forex", label: "Döviz" },
  { value: "crypto", label: "Kripto Para" },
  { value: "gold", label: "Altın" },
  { value: "fund", label: "Yatırım Fonu" },
]

// Örnek semboller (kullanıcıya yardımcı olmak için)
export const exampleSymbols = {
  stock: ["EREGL", "TUPRS", "THYAO", "AAPL", "MSFT", "GOOGL"],
  forex: ["USD/TRY", "EUR/TRY", "EUR/USD", "GBP/USD"],
  crypto: ["BTC/USD", "ETH/USD", "BNB/USD", "XRP/USD"],
  gold: ["XAU/USD", "XAU/TRY", "GRAM", "ONS"],
  fund: ["AFT", "TI1", "TTE", "IST"],
}
