// Önbellek süresi (milisaniye cinsinden) - 5 dakika
const CACHE_DURATION = 5 * 60 * 1000

// Önbellek
type CacheItem = {
  price: number
  timestamp: number
}

const priceCache: Record<string, CacheItem> = {}

/**
 * Önbellekten fiyat kontrolü
 * @param cacheKey Önbellek anahtarı
 * @returns Önbellekteki fiyat veya null
 */
function getCachedPrice(cacheKey: string): number | null {
  const cachedItem = priceCache[cacheKey]
  if (cachedItem && Date.now() - cachedItem.timestamp < CACHE_DURATION) {
    return cachedItem.price
  }
  return null
}

/**
 * Fiyatı önbelleğe kaydetme
 * @param cacheKey Önbellek anahtarı
 * @param price Fiyat
 */
function cachePrice(cacheKey: string, price: number): void {
  priceCache[cacheKey] = {
    price,
    timestamp: Date.now(),
  }
}

/**
 * CoinGecko API'sinden kripto para fiyatı çekme
 * @param symbol Kripto para sembolü
 * @returns Fiyat (TL cinsinden)
 */
async function fetchCryptoPrice(symbol: string): Promise<number | null> {
  try {
    // Sembolü CoinGecko formatına dönüştür
    const coinId = getCoinGeckoId(symbol.toLowerCase())
    if (!coinId) return null

    const cacheKey = `crypto_${coinId}`
    const cachedPrice = getCachedPrice(cacheKey)
    if (cachedPrice !== null) {
      return cachedPrice
    }

    // CoinGecko API'si için alternatif endpoint
    // Önce USD cinsinden fiyatı çek, sonra TRY'ye çevir
    const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`, {
      headers: {
        Accept: "application/json",
      },
      next: { revalidate: 300 }, // 5 dakika
    })

    if (!response.ok) {
      console.log(`CoinGecko API hatası: ${response.status}. Alternatif API deneniyor...`)
      return await fetchCryptoPriceAlternative(symbol)
    }

    const data = await response.json()
    if (data[coinId] && data[coinId].usd) {
      // USD fiyatını TRY'ye çevir
      const usdPrice = data[coinId].usd
      const tryRate = await getUSDtoTRYRate()

      if (tryRate) {
        const tryPrice = usdPrice * tryRate
        cachePrice(cacheKey, tryPrice)
        return tryPrice
      }
    }

    return await fetchCryptoPriceAlternative(symbol)
  } catch (error) {
    console.error(`Kripto fiyatı çekilirken hata: ${error}`)
    return await fetchCryptoPriceAlternative(symbol)
  }
}

/**
 * Alternatif kaynaklardan kripto para fiyatı çekme
 * @param symbol Kripto para sembolü
 * @returns Fiyat (TL cinsinden)
 */
async function fetchCryptoPriceAlternative(symbol: string): Promise<number | null> {
  try {
    // Binance API'si gibi alternatif bir kaynak kullanılabilir
    // Şimdilik simüle edilmiş veri dönüyoruz
    return getSimulatedPrice("crypto", symbol)
  } catch (error) {
    console.error(`Alternatif kripto fiyatı çekilirken hata: ${error}`)
    return null
  }
}

/**
 * Açık API'den altın fiyatı çekme
 * @param type Altın türü
 * @returns Fiyat (TL cinsinden)
 */
async function fetchGoldPrice(type: string): Promise<number | null> {
  try {
    const cacheKey = `gold_${type}`
    const cachedPrice = getCachedPrice(cacheKey)
    if (cachedPrice !== null) {
      return cachedPrice
    }

    // Altın fiyatları için açık API
    const response = await fetch("https://finans.truncgil.com/today.json", {
      next: { revalidate: 300 }, // 5 dakika
    })

    if (!response.ok) {
      console.log(`Altın API hatası: ${response.status}. Alternatif API deneniyor...`)
      return await fetchGoldPriceAlternative(type)
    }

    const data = await response.json()

    // Altın türüne göre fiyat çekme
    let price: number | null = null

    if (type.includes("24 Ayar Gram") || type.includes("Has Altın")) {
      // 24 Ayar Gram Altın (Has Altın)
      if (data["gram-has-altin"] && data["gram-has-altin"].Alış) {
        const priceStr = data["gram-has-altin"].Alış.replace(".", "").replace(",", ".")
        price = Number.parseFloat(priceStr)
      } else if (data["gram-altin"] && data["gram-altin"].Alış) {
        // Has altın yoksa normal gram altın fiyatını kullan
        const priceStr = data["gram-altin"].Alış.replace(".", "").replace(",", ".")
        price = Number.parseFloat(priceStr)
      }
    } else if (type.includes("22 Ayar Gram")) {
      // 22 Ayar Gram Altın
      if (data["22-ayar-bilezik"] && data["22-ayar-bilezik"].Alış) {
        const priceStr = data["22-ayar-bilezik"].Alış.replace(".", "").replace(",", ".")
        price = Number.parseFloat(priceStr)
      }
    } else if (type.includes("18 Ayar Gram")) {
      // 18 Ayar Gram Altın
      if (data["18-ayar-altin"] && data["18-ayar-altin"].Alış) {
        const priceStr = data["18-ayar-altin"].Alış.replace(".", "").replace(",", ".")
        price = Number.parseFloat(priceStr)
      }
    } else if (type.includes("14 Ayar Gram")) {
      // 14 Ayar Gram Altın
      if (data["14-ayar-altin"] && data["14-ayar-altin"].Alış) {
        const priceStr = data["14-ayar-altin"].Alış.replace(".", "").replace(",", ".")
        price = Number.parseFloat(priceStr)
      }
    } else if (type.includes("Çeyrek")) {
      // Çeyrek altın
      if (data["ceyrek-altin"] && data["ceyrek-altin"].Alış) {
        const priceStr = data["ceyrek-altin"].Alış.replace(".", "").replace(",", ".")
        price = Number.parseFloat(priceStr)
      }
    } else if (type.includes("Yarım")) {
      // Yarım altın
      if (data["yarim-altin"] && data["yarim-altin"].Alış) {
        const priceStr = data["yarim-altin"].Alış.replace(".", "").replace(",", ".")
        price = Number.parseFloat(priceStr)
      }
    } else if (type.includes("Tam") || type.includes("Cumhuriyet")) {
      // Tam altın
      if (data["tam-altin"] && data["tam-altin"].Alış) {
        const priceStr = data["tam-altin"].Alış.replace(".", "").replace(",", ".")
        price = Number.parseFloat(priceStr)
      }
    } else if (type.includes("Ata")) {
      // Ata altın
      if (data["ata-altin"] && data["ata-altin"].Alış) {
        const priceStr = data["ata-altin"].Alış.replace(".", "").replace(",", ".")
        price = Number.parseFloat(priceStr)
      }
    } else if (type.includes("22 Ayar Bilezik")) {
      // 22 Ayar Bilezik
      if (data["22-ayar-bilezik"] && data["22-ayar-bilezik"].Alış) {
        const priceStr = data["22-ayar-bilezik"].Alış.replace(".", "").replace(",", ".")
        price = Number.parseFloat(priceStr)
      }
    } else if (type.includes("Reşat")) {
      // Reşat altın
      if (data["resat-altin"] && data["resat-altin"].Alış) {
        const priceStr = data["resat-altin"].Alış.replace(".", "").replace(",", ".")
        price = Number.parseFloat(priceStr)
      }
    } else {
      // Diğer altın türleri için gram altın fiyatını kullan
      if (data["gram-altin"] && data["gram-altin"].Alış) {
        const priceStr = data["gram-altin"].Alış.replace(".", "").replace(",", ".")
        price = Number.parseFloat(priceStr)
      }
    }

    if (price) {
      cachePrice(cacheKey, price)
      return price
    }

    return await fetchGoldPriceAlternative(type)
  } catch (error) {
    console.error(`Altın fiyatı çekilirken hata: ${error}`)
    return await fetchGoldPriceAlternative(type)
  }
}

/**
 * Alternatif kaynaklardan altın fiyatı çekme
 * @param type Altın türü
 * @returns Fiyat (TL cinsinden)
 */
async function fetchGoldPriceAlternative(type: string): Promise<number | null> {
  try {
    // Alternatif bir API kullanılabilir
    // Şimdilik TCMB'den USD/TRY kuru ve uluslararası altın fiyatı (USD) kullanarak hesaplama yapabiliriz

    // Şimdilik simüle edilmiş veri dönüyoruz
    return getSimulatedPrice("gold", type)
  } catch (error) {
    console.error(`Alternatif altın fiyatı çekilirken hata: ${error}`)
    return null
  }
}

/**
 * Açık API'den döviz kuru çekme
 * @param currency Döviz türü
 * @returns Kur (TL cinsinden)
 */
async function fetchForexRate(currency: string): Promise<number | null> {
  try {
    const cacheKey = `forex_${currency}`
    const cachedPrice = getCachedPrice(cacheKey)
    if (cachedPrice !== null) {
      return cachedPrice
    }

    // Döviz kurları için açık API
    const response = await fetch("https://finans.truncgil.com/today.json", {
      next: { revalidate: 300 }, // 5 dakika
    })

    if (!response.ok) {
      console.log(`Döviz API hatası: ${response.status}. Alternatif API deneniyor...`)
      return await fetchForexRateAlternative(currency)
    }

    const data = await response.json()

    // Döviz türüne göre kur çekme
    let rate: number | null = null

    if (currency.includes("Amerikan Doları")) {
      // USD
      if (data["USD"] && data["USD"].Alış) {
        // Türkçe format: "38,9376" -> "38.9376"
        const rateStr = data["USD"].Alış.replace(",", ".")
        rate = Number.parseFloat(rateStr)
      }
    } else if (currency.includes("Euro")) {
      // EUR
      if (data["EUR"] && data["EUR"].Alış) {
        const rateStr = data["EUR"].Alış.replace(",", ".")
        rate = Number.parseFloat(rateStr)
      }
    } else if (currency.includes("İngiliz Sterlini")) {
      // GBP
      if (data["GBP"] && data["GBP"].Alış) {
        const rateStr = data["GBP"].Alış.replace(",", ".")
        rate = Number.parseFloat(rateStr)
      }
    } else if (currency.includes("İsviçre Frangı")) {
      // CHF
      if (data["CHF"] && data["CHF"].Alış) {
        const rateStr = data["CHF"].Alış.replace(",", ".")
        rate = Number.parseFloat(rateStr)
      }
    } else if (currency.includes("Japon Yeni")) {
      // JPY
      if (data["JPY"] && data["JPY"].Alış) {
        const rateStr = data["JPY"].Alış.replace(",", ".")
        rate = Number.parseFloat(rateStr)
      }
    } else if (currency.includes("Kanada Doları")) {
      // CAD
      if (data["CAD"] && data["CAD"].Alış) {
        const rateStr = data["CAD"].Alış.replace(",", ".")
        rate = Number.parseFloat(rateStr)
      }
    } else if (currency.includes("Avustralya Doları")) {
      // AUD
      if (data["AUD"] && data["AUD"].Alış) {
        const rateStr = data["AUD"].Alış.replace(",", ".")
        rate = Number.parseFloat(rateStr)
      }
    } else {
      // Diğer dövizler için USD kurunu kullan
      if (data["USD"] && data["USD"].Alış) {
        rate = Number.parseFloat(data["USD"].Alış.replace(",", "."))
      }
    }

    if (rate) {
      cachePrice(cacheKey, rate)
      return rate
    }

    return await fetchForexRateAlternative(currency)
  } catch (error) {
    console.error(`Döviz kuru çekilirken hata: ${error}`)
    return await fetchForexRateAlternative(currency)
  }
}

/**
 * Alternatif kaynaklardan döviz kuru çekme
 * @param currency Döviz türü
 * @returns Kur (TL cinsinden)
 */
async function fetchForexRateAlternative(currency: string): Promise<number | null> {
  try {
    // ExchangeRatesAPI kullanarak döviz kurlarını çek
    const currencyCode = getForexCode(currency)
    if (!currencyCode) return null

    let rate: number | null = null
    if (
      currencyCode === "USD" ||
      currencyCode === "EUR" ||
      currencyCode === "GBP" ||
      currencyCode === "CHF" ||
      currencyCode === "JPY" ||
      currencyCode === "CAD" ||
      currencyCode === "AUD"
    ) {
      const response = await fetch("https://finans.truncgil.com/today.json", {
        next: { revalidate: 300 }, // 5 dakika
      })

      if (response.ok) {
        const data = await response.json()
        if (data[currencyCode] && data[currencyCode].Alış) {
          rate = Number.parseFloat(data[currencyCode].Alış.replace(",", "."))
        }
      }
    } else {
      const response = await fetch(`https://open.er-api.com/v6/latest/USD`, {
        next: { revalidate: 300 }, // 5 dakika
      })

      if (response.ok) {
        const data = await response.json()
        if (data.rates && data.rates[currencyCode] && data.rates.TRY) {
          const usdToTry = data.rates.TRY
          const usdToCurrency = data.rates[currencyCode]
          rate = usdToTry / usdToCurrency
          return rate
        }
      }
    }

    // Şimdilik simüle edilmiş veri dönüyoruz
    return getSimulatedPrice("forex", currency)
  } catch (error) {
    console.error(`Alternatif döviz kuru çekilirken hata: ${error}`)
    return null
  }
}

/**
 * USD/TRY kurunu çekme
 * @returns USD/TRY kuru
 */
async function getUSDtoTRYRate(): Promise<number | null> {
  try {
    // Önce Truncgil API'den dene
    const truncgilResponse = await fetch("https://finans.truncgil.com/today.json", {
      next: { revalidate: 300 }, // 5 dakika
    })

    if (truncgilResponse.ok) {
      const data = await truncgilResponse.json()
      if (data["USD"] && data["USD"].Alış) {
        return Number.parseFloat(data["USD"].Alış.replace(",", "."))
      }
    }

    // Truncgil çalışmazsa ExchangeRatesAPI dene
    const erResponse = await fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: 300 }, // 5 dakika
    })

    if (erResponse.ok) {
      const data = await erResponse.json()
      if (data.rates && data.rates.TRY) {
        return data.rates.TRY
      }
    }

    // Hiçbiri çalışmazsa simüle edilmiş değer dön
    return 32.5 // Simüle edilmiş USD/TRY kuru
  } catch (error) {
    console.error(`USD/TRY kuru çekilirken hata: ${error}`)
    return null
  }
}

/**
 * Yahoo Finance API'sinden hisse senedi fiyatı çekme
 * @param symbol Hisse senedi sembolü
 * @returns Fiyat (TL cinsinden)
 */
async function fetchStockPrice(symbol: string): Promise<number | null> {
  try {
    const cacheKey = `stock_${symbol}`
    const cachedPrice = getCachedPrice(cacheKey)
    if (cachedPrice !== null) {
      return cachedPrice
    }

    // BIST hisseleri için
    if (symbol.includes("BIST") || isBistSymbol(symbol)) {
      return fetchBistPrice(symbol)
    }

    // NASDAQ ve NYSE hisseleri için Yahoo Finance API
    return fetchYahooFinancePrice(symbol)
  } catch (error) {
    console.error(`Hisse senedi fiyatı çekilirken hata: ${error}`)
    return getSimulatedStockPrice(symbol)
  }
}

/**
 * BIST hisse senedi fiyatı çekme (Yahoo Finance)
 * @param symbol BIST hisse senedi sembolü
 * @returns Fiyat (TL cinsinden)
 */
async function fetchBistPrice(symbol: string): Promise<number | null> {
  try {
    const cacheKey = `bist_${symbol}`
    const cachedPrice = getCachedPrice(cacheKey)
    if (cachedPrice !== null) {
      return cachedPrice
    }

    // BIST sembolünü Yahoo Finance formatına çevir
    const yahooSymbol = `${symbol}.IS` // THYAO -> THYAO.IS

    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=1d`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        next: { revalidate: 300 }, // 5 dakika
      },
    )

    if (!response.ok) {
      console.log(`Yahoo Finance BIST API hatası: ${response.status}`)
      return getSimulatedBistPrice(symbol)
    }

    const data = await response.json()

    if (data.chart && data.chart.result && data.chart.result[0]) {
      const result = data.chart.result[0]
      const meta = result.meta

      if (meta && meta.regularMarketPrice) {
        const price = meta.regularMarketPrice
        cachePrice(cacheKey, price)
        console.log(`${symbol} güncel fiyatı: ${price} TL`)
        return price
      }
    }

    console.log(`${symbol} için fiyat bulunamadı, simüle edilmiş fiyat kullanılıyor`)
    return getSimulatedBistPrice(symbol)
  } catch (error) {
    console.error(`BIST hisse senedi fiyatı çekilirken hata: ${error}`)
    return getSimulatedBistPrice(symbol)
  }
}

/**
 * Yahoo Finance API'sinden uluslararası hisse senedi fiyatı çekme
 * @param symbol Hisse senedi sembolü
 * @returns Fiyat (USD cinsinden, TL'ye çevrilecek)
 */
async function fetchYahooFinancePrice(symbol: string): Promise<number | null> {
  try {
    const cacheKey = `yahoo_${symbol}`
    const cachedPrice = getCachedPrice(cacheKey)
    if (cachedPrice !== null) {
      return cachedPrice
    }

    const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      next: { revalidate: 300 }, // 5 dakika
    })

    if (!response.ok) {
      console.log(`Yahoo Finance API hatası: ${response.status}`)
      return getSimulatedStockPrice(symbol)
    }

    const data = await response.json()

    if (data.chart && data.chart.result && data.chart.result[0]) {
      const result = data.chart.result[0]
      const meta = result.meta

      if (meta && meta.regularMarketPrice) {
        const usdPrice = meta.regularMarketPrice

        // USD fiyatını TL'ye çevir
        const usdToTryRate = await getUSDtoTRYRate()
        if (usdToTryRate) {
          const tryPrice = usdPrice * usdToTryRate
          cachePrice(cacheKey, tryPrice)
          console.log(`${symbol} güncel fiyatı: $${usdPrice} (${tryPrice.toFixed(2)} TL)`)
          return tryPrice
        }

        return usdPrice // USD olarak dön
      }
    }

    console.log(`${symbol} için fiyat bulunamadı, simüle edilmiş fiyat kullanılıyor`)
    return getSimulatedStockPrice(symbol)
  } catch (error) {
    console.error(`Yahoo Finance fiyatı çekilirken hata: ${error}`)
    return getSimulatedStockPrice(symbol)
  }
}

/**
 * Ana fiyat çekme fonksiyonu
 * @param category Varlık kategorisi
 * @param symbol Varlık sembolü veya türü
 * @returns Fiyat (TL cinsinden)
 */
export async function fetchLatestPrice(category: string, symbol: string): Promise<{ price: number } | null> {
  try {
    console.log(`${category} kategorisinde ${symbol} için fiyat çekiliyor...`)

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
        price = await fetchStockPrice(symbol)
        break
      default:
        return null
    }

    if (price !== null) {
      return { price }
    }

    // API'den fiyat çekilemezse simüle edilmiş fiyat kullan
    const fallbackPrice = getSimulatedPrice(category, symbol)
    return { price: fallbackPrice }
  } catch (error) {
    console.error(`Fiyat çekilirken hata: ${error}`)

    // Hata durumunda simüle edilmiş fiyat kullan
    const fallbackPrice = getSimulatedPrice(category, symbol)
    return { price: fallbackPrice }
  }
}

/**
 * CoinGecko için kripto para ID'si dönüştürme
 * @param symbol Kripto para sembolü
 * @returns CoinGecko ID'si
 */
function getCoinGeckoId(symbol: string): string | null {
  const coinMap: Record<string, string> = {
    bitcoin: "bitcoin",
    btc: "bitcoin",
    ethereum: "ethereum",
    eth: "ethereum",
    bnb: "binancecoin",
    solana: "solana",
    sol: "solana",
    cardano: "cardano",
    ada: "cardano",
    xrp: "ripple",
    dogecoin: "dogecoin",
    doge: "dogecoin",
    polkadot: "polkadot",
    dot: "polkadot",
    avalanche: "avalanche-2",
    avax: "avalanche-2",
    polygon: "matic-network",
    matic: "matic-network",
  }

  return coinMap[symbol.toLowerCase()] || null
}

/**
 * Döviz kodu dönüştürme
 * @param currency Döviz türü
 * @returns Döviz kodu
 */
function getForexCode(currency: string): string | null {
  if (currency.includes("Amerikan Doları")) return "USD"
  if (currency.includes("Euro")) return "EUR"
  if (currency.includes("İngiliz Sterlini")) return "GBP"
  if (currency.includes("İsviçre Frangı")) return "CHF"
  if (currency.includes("Japon Yeni")) return "JPY"
  if (currency.includes("Kanada Doları")) return "CAD"
  if (currency.includes("Avustralya Doları")) return "AUD"
  if (currency.includes("Çin Yuanı")) return "CNY"
  if (currency.includes("Rus Rublesi")) return "RUB"
  if (currency.includes("Suudi Riyali")) return "SAR"
  return null
}

/**
 * BIST sembolü kontrolü
 * @param symbol Hisse senedi sembolü
 * @returns BIST sembolü mü?
 */
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
  return bistSymbols.includes(symbol)
}

/**
 * Simüle edilmiş BIST hisse senedi fiyatı
 * @param symbol BIST hisse senedi sembolü
 * @returns Simüle edilmiş fiyat
 */
function getSimulatedBistPrice(symbol: string): number {
  const bistPrices: Record<string, number> = {
    THYAO: 170,
    ASELS: 85,
    KCHOL: 120,
    EREGL: 45,
    GARAN: 32,
    AKBNK: 28,
    YKBNK: 18,
    TUPRS: 210,
    SAHOL: 38,
    SISE: 42,
    BIMAS: 145,
    ARCLK: 95,
    TOASO: 180,
    FROTO: 950,
    PETKM: 12,
    DIGER: 100,
  }

  const basePrice = bistPrices[symbol] || 100
  const randomFactor = 0.98 + Math.random() * 0.04
  return Number((basePrice * randomFactor).toFixed(2))
}

/**
 * Simüle edilmiş hisse senedi fiyatı
 * @param symbol Hisse senedi sembolü
 * @returns Simüle edilmiş fiyat
 */
function getSimulatedStockPrice(symbol: string): number {
  const stockPrices: Record<string, number> = {
    // NASDAQ
    AAPL: 5800,
    MSFT: 12500,
    AMZN: 5200,
    GOOGL: 5500,
    META: 4800,
    TSLA: 7200,
    NVDA: 28000,
    NFLX: 2100,
    PYPL: 2300,
    INTC: 1200,
    // NYSE
    JPM: 5900,
    BAC: 1300,
    WMT: 2200,
    PG: 5100,
    JNJ: 5300,
    XOM: 3800,
    V: 8500,
    MA: 14000,
    DIS: 3500,
    KO: 2100,
    // Diğer
    DIGER: 100,
  }

  const basePrice = stockPrices[symbol] || 100
  const randomFactor = 0.98 + Math.random() * 0.04
  return Number((basePrice * randomFactor).toFixed(2))
}

/**
 * Simüle edilmiş fiyat (API'den fiyat çekilemezse)
 * @param category Varlık kategorisi
 * @param symbol Varlık sembolü veya türü
 * @returns Simüle edilmiş fiyat
 */
function getSimulatedPrice(category: string, symbol: string): number {
  const priceData: Record<string, Record<string, number>> = {
    crypto: {
      Bitcoin: 1750000,
      Ethereum: 95000,
      BNB: 12000,
      Solana: 5000,
      Cardano: 15,
      XRP: 20,
      Dogecoin: 5,
      Polkadot: 250,
      Avalanche: 1200,
      Polygon: 40,
      "Diğer Kripto": 100,
    },
    gold: {
      "24 Ayar Gram Altın": 4174,
      "22 Ayar Gram Altın": 3814,
      "18 Ayar Gram Altın": 3052,
      "14 Ayar Gram Altın": 2383,
      "Çeyrek Altın": 6690,
      "Yarım Altın": 13338,
      "Tam Altın": 26761,
      "Cumhuriyet Altını": 27677,
      "Ata Altın": 27597,
      "Reşat Altını": 27597,
      "22 Ayar Bilezik": 3814,
      "Diğer Altın": 4000,
    },
    forex: {
      "Amerikan Doları": 38.94,
      Euro: 44.29,
      "İngiliz Sterlini": 52.82,
      "İsviçre Frangı": 47.29,
      "Japon Yeni": 0.27,
      "Kanada Doları": 28.37,
      "Avustralya Doları": 25.32,
      "Çin Yuanı": 5.42,
      "Rus Rublesi": 0.49,
      "Suudi Riyali": 10.37,
      "Diğer Döviz": 10,
    },
  }

  let basePrice = 100
  if (category !== "stock" && priceData[category] && priceData[category][symbol]) {
    basePrice = priceData[category][symbol]
  }

  const randomFactor = 0.98 + Math.random() * 0.04
  return Number((basePrice * randomFactor).toFixed(2))
}
