// GERÇEK ÇALIŞAN API'LERLE FİYAT SERVİSİ
const CACHE_DURATION = 5 * 60 * 1000 // 5 dakika

type CacheItem = {
  price: number
  timestamp: number
}

const priceCache: Record<string, CacheItem> = {}

/**
 * Önbellekten fiyat kontrolü
 */
function getCachedPrice(cacheKey: string): number | null {
  const cachedItem = priceCache[cacheKey]
  if (cachedItem && Date.now() - cachedItem.timestamp < CACHE_DURATION) {
    console.log(`✅ Önbellekten fiyat alındı: ${cacheKey} = ${cachedItem.price}`)
    return cachedItem.price
  }
  return null
}

/**
 * Fiyatı önbelleğe kaydetme
 */
function cachePrice(cacheKey: string, price: number): void {
  priceCache[cacheKey] = {
    price,
    timestamp: Date.now(),
  }
  console.log(`💾 Fiyat önbelleğe kaydedildi: ${cacheKey} = ${price}`)
}

/**
 * Türkiye formatı fiyat parsing
 */
function parsePrice(priceStr: string | number): number | null {
  if (typeof priceStr === "number") return priceStr
  if (!priceStr) return null

  // "6.636,80" formatını parse et
  const cleanPrice = String(priceStr)
    .replace(/\s/g, "") // Boşlukları kaldır
    .replace(/\./g, "") // Binlik ayırıcı noktaları kaldır
    .replace(",", ".") // Virgülü noktaya çevir

  const price = Number.parseFloat(cleanPrice)
  console.log(`🔄 Fiyat parsing: "${priceStr}" → ${price}`)
  return isNaN(price) ? null : price
}

/**
 * TCMB XML API'sinden GERÇEK döviz kurları
 */
async function fetchRealTCMBRates(): Promise<Record<string, number> | null> {
  try {
    console.log("🏦 TCMB XML API'sinden GERÇEK kurlar çekiliyor...")

    const response = await fetch("https://www.tcmb.gov.tr/kurlar/today.xml", {
      next: { revalidate: 300 },
    })

    if (!response.ok) {
      console.log("❌ TCMB XML API hatası:", response.status)
      return null
    }

    const xmlText = await response.text()
    console.log("✅ TCMB XML verisi alındı")

    const rates: Record<string, number> = {}

    // USD kurunu çek
    const usdMatch = xmlText.match(
      /<Currency[^>]*CurrencyCode="USD"[^>]*>[\s\S]*?<ForexSelling>([\d.,]+)<\/ForexSelling>/,
    )
    if (usdMatch) {
      rates.USD = parsePrice(usdMatch[1]) || 0
      console.log(`💰 TCMB USD: ${rates.USD} TL`)
    }

    // EUR kurunu çek
    const eurMatch = xmlText.match(
      /<Currency[^>]*CurrencyCode="EUR"[^>]*>[\s\S]*?<ForexSelling>([\d.,]+)<\/ForexSelling>/,
    )
    if (eurMatch) {
      rates.EUR = parsePrice(eurMatch[1]) || 0
      console.log(`💰 TCMB EUR: ${rates.EUR} TL`)
    }

    // GBP kurunu çek
    const gbpMatch = xmlText.match(
      /<Currency[^>]*CurrencyCode="GBP"[^>]*>[\s\S]*?<ForexSelling>([\d.,]+)<\/ForexSelling>/,
    )
    if (gbpMatch) {
      rates.GBP = parsePrice(gbpMatch[1]) || 0
      console.log(`💰 TCMB GBP: ${rates.GBP} TL`)
    }

    return rates
  } catch (error) {
    console.error("❌ TCMB XML hatası:", error)
    return null
  }
}

/**
 * Finans Truncgil'den GERÇEK altın fiyatları
 */
async function fetchRealGoldPrices(): Promise<Record<string, number> | null> {
  try {
    console.log("🥇 Finans Truncgil'den GERÇEK altın fiyatları çekiliyor...")

    const response = await fetch("https://finans.truncgil.com/today.json", {
      next: { revalidate: 300 },
    })

    if (!response.ok) {
      console.log("❌ Finans Truncgil API hatası:", response.status)
      return null
    }

    const data = await response.json()
    console.log("✅ Finans Truncgil verisi alındı")

    const goldPrices: Record<string, number> = {}

    // Çeyrek altın
    if (data["ceyrek-altin"]?.Alış) {
      goldPrices["ceyrek"] = parsePrice(data["ceyrek-altin"].Alış) || 0
      console.log(`💰 Çeyrek Altın: ${goldPrices["ceyrek"]} TL`)
    }

    // Yarım altın
    if (data["yarim-altin"]?.Alış) {
      goldPrices["yarim"] = parsePrice(data["yarim-altin"].Alış) || 0
      console.log(`💰 Yarım Altın: ${goldPrices["yarim"]} TL`)
    }

    // Tam altın
    if (data["tam-altin"]?.Alış) {
      goldPrices["tam"] = parsePrice(data["tam-altin"].Alış) || 0
      console.log(`💰 Tam Altın: ${goldPrices["tam"]} TL`)
    }

    // Gram altın (24 ayar)
    if (data["gram-altin"]?.Alış) {
      goldPrices["gram_24"] = parsePrice(data["gram-altin"].Alış) || 0
      console.log(`💰 Gram Altın (24 ayar): ${goldPrices["gram_24"]} TL`)
    }

    // 22 ayar gram altın hesapla (24 ayarın %91.7'si)
    if (goldPrices["gram_24"]) {
      goldPrices["gram_22"] = Math.round(goldPrices["gram_24"] * 0.917)
      console.log(`💰 Gram Altın (22 ayar): ${goldPrices["gram_22"]} TL`)
    }

    // 18 ayar gram altın hesapla (24 ayarın %75'i)
    if (goldPrices["gram_24"]) {
      goldPrices["gram_18"] = Math.round(goldPrices["gram_24"] * 0.75)
      console.log(`💰 Gram Altın (18 ayar): ${goldPrices["gram_18"]} TL`)
    }

    // 14 ayar gram altın hesapla (24 ayarın %58.3'ü)
    if (goldPrices["gram_24"]) {
      goldPrices["gram_14"] = Math.round(goldPrices["gram_24"] * 0.583)
      console.log(`💰 Gram Altın (14 ayar): ${goldPrices["gram_14"]} TL`)
    }

    return goldPrices
  } catch (error) {
    console.error("❌ Finans Truncgil hatası:", error)
    return null
  }
}

/**
 * CoinGecko'dan GERÇEK kripto fiyatları
 */
async function fetchRealCryptoPrices(): Promise<Record<string, number> | null> {
  try {
    console.log("₿ CoinGecko'dan GERÇEK kripto fiyatları çekiliyor...")

    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,binancecoin,solana,cardano,ripple,dogecoin&vs_currencies=try",
      {
        next: { revalidate: 300 },
      },
    )

    if (!response.ok) {
      console.log("❌ CoinGecko API hatası:", response.status)
      return null
    }

    const data = await response.json()
    console.log("✅ CoinGecko verisi alındı")

    const cryptoPrices: Record<string, number> = {}

    if (data.bitcoin?.try) {
      cryptoPrices["bitcoin"] = data.bitcoin.try
      cryptoPrices["btc"] = data.bitcoin.try
      console.log(`💰 Bitcoin: ${cryptoPrices["bitcoin"]} TL`)
    }

    if (data.ethereum?.try) {
      cryptoPrices["ethereum"] = data.ethereum.try
      cryptoPrices["eth"] = data.ethereum.try
      console.log(`💰 Ethereum: ${cryptoPrices["ethereum"]} TL`)
    }

    if (data.binancecoin?.try) {
      cryptoPrices["bnb"] = data.binancecoin.try
      console.log(`💰 BNB: ${cryptoPrices["bnb"]} TL`)
    }

    if (data.solana?.try) {
      cryptoPrices["solana"] = data.solana.try
      cryptoPrices["sol"] = data.solana.try
      console.log(`💰 Solana: ${cryptoPrices["solana"]} TL`)
    }

    if (data.cardano?.try) {
      cryptoPrices["cardano"] = data.cardano.try
      cryptoPrices["ada"] = data.cardano.try
      console.log(`💰 Cardano: ${cryptoPrices["cardano"]} TL`)
    }

    if (data.ripple?.try) {
      cryptoPrices["xrp"] = data.ripple.try
      console.log(`💰 XRP: ${cryptoPrices["xrp"]} TL`)
    }

    if (data.dogecoin?.try) {
      cryptoPrices["dogecoin"] = data.dogecoin.try
      cryptoPrices["doge"] = data.dogecoin.try
      console.log(`💰 Dogecoin: ${cryptoPrices["dogecoin"]} TL`)
    }

    return cryptoPrices
  } catch (error) {
    console.error("❌ CoinGecko hatası:", error)
    return null
  }
}

/**
 * Yahoo Finance'dan GERÇEK hisse fiyatları
 */
async function fetchRealStockPrice(symbol: string): Promise<number | null> {
  try {
    console.log(`📈 Yahoo Finance'dan ${symbol} fiyatı çekiliyor...`)

    // BIST hisseleri için .IS eki ekle
    const yahooSymbol = isBistSymbol(symbol) ? `${symbol}.IS` : symbol

    const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}`, {
      next: { revalidate: 300 },
    })

    if (!response.ok) {
      console.log(`❌ Yahoo Finance ${symbol} hatası:`, response.status)
      return null
    }

    const data = await response.json()
    const price = data.chart?.result?.[0]?.meta?.regularMarketPrice

    if (price && price > 0) {
      // US hisseleri için USD'yi TL'ye çevir
      if (!isBistSymbol(symbol)) {
        const tcmbRates = await fetchRealTCMBRates()
        const usdToTry = tcmbRates?.USD || 39.13
        const tryPrice = price * usdToTry
        console.log(`💰 ${symbol}: $${price} → ${tryPrice.toFixed(2)} TL`)
        return tryPrice
      } else {
        console.log(`💰 ${symbol}: ${price} TL`)
        return price
      }
    }

    return null
  } catch (error) {
    console.error(`❌ Yahoo Finance ${symbol} hatası:`, error)
    return null
  }
}

/**
 * Altın fiyatı çekme - GERÇEK API'lerle
 */
async function fetchGoldPrice(type: string): Promise<number | null> {
  try {
    const cacheKey = `gold_${type}`
    const cachedPrice = getCachedPrice(cacheKey)
    if (cachedPrice !== null) {
      return cachedPrice
    }

    console.log(`🥇 GERÇEK altın fiyatı çekiliyor: ${type}`)

    const goldPrices = await fetchRealGoldPrices()
    if (!goldPrices) {
      console.log("❌ Altın fiyatları çekilemedi")
      return null
    }

    const lowerType = type.toLowerCase()
    let price: number | null = null

    // Çeyrek altın
    if (lowerType.includes("çeyrek")) {
      price = goldPrices["ceyrek"]
    }
    // Yarım altın
    else if (lowerType.includes("yarım")) {
      price = goldPrices["yarim"]
    }
    // Tam altın
    else if (lowerType.includes("tam")) {
      price = goldPrices["tam"]
    }
    // 22 ayar gram
    else if (lowerType.includes("22 ayar") && lowerType.includes("gram")) {
      price = goldPrices["gram_22"]
    }
    // 18 ayar gram
    else if (lowerType.includes("18 ayar") && lowerType.includes("gram")) {
      price = goldPrices["gram_18"]
    }
    // 14 ayar gram
    else if (lowerType.includes("14 ayar") && lowerType.includes("gram")) {
      price = goldPrices["gram_14"]
    }
    // 24 ayar gram veya has altın
    else if (lowerType.includes("24 ayar") || lowerType.includes("has altın") || lowerType.includes("gram altın")) {
      price = goldPrices["gram_24"]
    }
    // Varsayılan: 24 ayar gram
    else {
      price = goldPrices["gram_24"]
    }

    if (price && price > 0) {
      cachePrice(cacheKey, price)
      console.log(`✅ ${type} GERÇEK fiyatı: ${price} TL`)
      return price
    }

    return null
  } catch (error) {
    console.error(`❌ Altın fiyatı çekilirken hata: ${error}`)
    return null
  }
}

/**
 * Kripto fiyatı çekme - GERÇEK API'lerle
 */
async function fetchCryptoPrice(symbol: string): Promise<number | null> {
  try {
    const cacheKey = `crypto_${symbol}`
    const cachedPrice = getCachedPrice(cacheKey)
    if (cachedPrice !== null) {
      return cachedPrice
    }

    console.log(`₿ GERÇEK kripto fiyatı çekiliyor: ${symbol}`)

    const cryptoPrices = await fetchRealCryptoPrices()
    if (!cryptoPrices) {
      console.log("❌ Kripto fiyatları çekilemedi")
      return null
    }

    const price = cryptoPrices[symbol.toLowerCase()]
    if (price && price > 0) {
      cachePrice(cacheKey, price)
      console.log(`✅ ${symbol} GERÇEK fiyatı: ${price} TL`)
      return price
    }

    return null
  } catch (error) {
    console.error(`❌ Kripto fiyatı çekilirken hata: ${error}`)
    return null
  }
}

/**
 * Döviz kuru çekme - GERÇEK API'lerle
 */
async function fetchForexRate(currency: string): Promise<number | null> {
  try {
    const cacheKey = `forex_${currency}`
    const cachedPrice = getCachedPrice(cacheKey)
    if (cachedPrice !== null) {
      return cachedPrice
    }

    console.log(`💱 GERÇEK döviz kuru çekiliyor: ${currency}`)

    const tcmbRates = await fetchRealTCMBRates()
    if (!tcmbRates) {
      console.log("❌ TCMB kurları çekilemedi")
      return null
    }

    let rate: number | null = null

    if (currency.includes("USD") || currency.includes("Amerikan")) {
      rate = tcmbRates.USD
    } else if (currency.includes("EUR") || currency.includes("Euro")) {
      rate = tcmbRates.EUR
    } else if (currency.includes("GBP") || currency.includes("İngiliz")) {
      rate = tcmbRates.GBP
    }

    if (rate && rate > 0) {
      cachePrice(cacheKey, rate)
      console.log(`✅ ${currency} GERÇEK kuru: ${rate} TL`)
      return rate
    }

    return null
  } catch (error) {
    console.error(`❌ Döviz kuru çekilirken hata: ${error}`)
    return null
  }
}

/**
 * Ana fiyat çekme fonksiyonu - GERÇEK API'lerle
 */
export async function fetchLatestPrice(category: string, symbol: string): Promise<{ price: number } | null> {
  try {
    console.log(`🚀 === GERÇEK FİYAT ÇEKME BAŞLADI: ${category} - ${symbol} ===`)

    let price: number | null = null

    switch (category) {
      case "crypto":
        price = await fetchCryptoPrice(symbol)
        break
      case "gold":
        price = await fetchGoldPrice(symbol)
        break
      case "forex":
        price = await fetchForexRate(symbol)
        break
      case "stock":
        price = await fetchRealStockPrice(symbol)
        break
      default:
        console.log(`❌ Bilinmeyen kategori: ${category}`)
        return null
    }

    if (price !== null && price > 0) {
      console.log(`✅ === GERÇEK FİYAT BAŞARIYLA ÇEKİLDİ: ${price} TL ===`)
      return { price }
    }

    console.log(`❌ === GERÇEK FİYAT ÇEKİLEMEDİ ===`)
    return null
  } catch (error) {
    console.error(`❌ Fiyat çekilirken hata: ${error}`)
    return null
  }
}

// Yardımcı fonksiyonlar
function isBistSymbol(symbol: string): boolean {
  const bistSymbols = [
    "THYAO",
    "ASELS",
    "KCHOL",
    "EREGL",
    "GARAN",
    "AKBNK",
    "YKBNK",
    "TUPRS",
    "SAHOL",
    "SISE",
    "BIMAS",
    "ARCLK",
    "TOASO",
    "FROTO",
    "PETKM",
  ]
  return bistSymbols.includes(symbol.toUpperCase())
}
