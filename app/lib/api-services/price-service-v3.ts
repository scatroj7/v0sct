// Gelişmiş fiyat servisi - Gerçek API'lerden fiyat çekme
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
    console.log(`Önbellekten fiyat alındı: ${cacheKey} = ${cachedItem.price}`)
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
  console.log(`Fiyat önbelleğe kaydedildi: ${cacheKey} = ${price}`)
}

/**
 * CoinGecko API'sinden kripto para fiyatı çekme
 */
async function fetchCryptoPrice(symbol: string): Promise<number | null> {
  try {
    const coinId = getCoinGeckoId(symbol.toLowerCase())
    if (!coinId) {
      console.log(`CoinGecko ID bulunamadı: ${symbol}`)
      return null
    }

    const cacheKey = `crypto_${coinId}`
    const cachedPrice = getCachedPrice(cacheKey)
    if (cachedPrice !== null) {
      return cachedPrice
    }

    console.log(`CoinGecko'dan ${coinId} fiyatı çekiliyor...`)

    // CoinGecko API'si - TRY cinsinden direkt fiyat
    const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=try`, {
      headers: {
        Accept: "application/json",
      },
      next: { revalidate: 300 },
    })

    if (!response.ok) {
      console.log(`CoinGecko API hatası: ${response.status}`)
      return await fetchCryptoPriceAlternative(symbol)
    }

    const data = await response.json()
    console.log(`CoinGecko yanıtı:`, data)

    if (data[coinId] && data[coinId].try) {
      const price = data[coinId].try
      cachePrice(cacheKey, price)
      console.log(`${symbol} güncel fiyatı: ${price} TL`)
      return price
    }

    return await fetchCryptoPriceAlternative(symbol)
  } catch (error) {
    console.error(`Kripto fiyatı çekilirken hata: ${error}`)
    return await fetchCryptoPriceAlternative(symbol)
  }
}

/**
 * Alternatif kripto fiyat kaynağı
 */
async function fetchCryptoPriceAlternative(symbol: string): Promise<number | null> {
  try {
    // Binance API'si TRY paritesi
    const binanceSymbol = getBinanceSymbol(symbol)
    if (!binanceSymbol) return null

    console.log(`Binance'den ${binanceSymbol} fiyatı çekiliyor...`)

    const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${binanceSymbol}`, {
      next: { revalidate: 300 },
    })

    if (response.ok) {
      const data = await response.json()
      if (data.price) {
        const price = Number.parseFloat(data.price)
        console.log(`${symbol} Binance fiyatı: ${price} TL`)
        return price
      }
    }

    return null
  } catch (error) {
    console.error(`Alternatif kripto fiyatı çekilirken hata: ${error}`)
    return null
  }
}

/**
 * TCMB ve diğer kaynaklardan altın fiyatı çekme
 */
async function fetchGoldPrice(type: string): Promise<number | null> {
  try {
    const cacheKey = `gold_${type}`
    const cachedPrice = getCachedPrice(cacheKey)
    if (cachedPrice !== null) {
      return cachedPrice
    }

    console.log(`Altın fiyatı çekiliyor: ${type}`)

    // Finans API'si
    const response = await fetch("https://finans.truncgil.com/today.json", {
      next: { revalidate: 300 },
    })

    if (!response.ok) {
      console.log(`Altın API hatası: ${response.status}`)
      return await fetchGoldPriceAlternative(type)
    }

    const data = await response.json()
    console.log("Altın API yanıtı alındı")

    let price: number | null = null

    // Altın türüne göre fiyat eşleştirme
    if (type.includes("24 Ayar") || type.includes("Has Altın")) {
      if (data["gram-has-altin"]?.Alış) {
        price = parsePrice(data["gram-has-altin"].Alış)
      } else if (data["gram-altin"]?.Alış) {
        price = parsePrice(data["gram-altin"].Alış)
      }
    } else if (type.includes("22 Ayar")) {
      if (data["22-ayar-bilezik"]?.Alış) {
        price = parsePrice(data["22-ayar-bilezik"].Alış)
      }
    } else if (type.includes("18 Ayar")) {
      if (data["18-ayar-altin"]?.Alış) {
        price = parsePrice(data["18-ayar-altin"].Alış)
      }
    } else if (type.includes("14 Ayar")) {
      if (data["14-ayar-altin"]?.Alış) {
        price = parsePrice(data["14-ayar-altin"].Alış)
      }
    } else if (type.includes("Çeyrek")) {
      if (data["ceyrek-altin"]?.Alış) {
        price = parsePrice(data["ceyrek-altin"].Alış)
      }
    } else if (type.includes("Yarım")) {
      if (data["yarim-altin"]?.Alış) {
        price = parsePrice(data["yarim-altin"].Alış)
      }
    } else if (type.includes("Tam") || type.includes("Cumhuriyet")) {
      if (data["tam-altin"]?.Alış) {
        price = parsePrice(data["tam-altin"].Alış)
      }
    } else if (type.includes("Ata")) {
      if (data["ata-altin"]?.Alış) {
        price = parsePrice(data["ata-altin"].Alış)
      }
    } else if (type.includes("Reşat")) {
      if (data["resat-altin"]?.Alış) {
        price = parsePrice(data["resat-altin"].Alış)
      }
    } else {
      // Varsayılan olarak gram altın
      if (data["gram-altin"]?.Alış) {
        price = parsePrice(data["gram-altin"].Alış)
      }
    }

    if (price) {
      cachePrice(cacheKey, price)
      console.log(`${type} güncel fiyatı: ${price} TL`)
      return price
    }

    return await fetchGoldPriceAlternative(type)
  } catch (error) {
    console.error(`Altın fiyatı çekilirken hata: ${error}`)
    return await fetchGoldPriceAlternative(type)
  }
}

/**
 * Alternatif altın fiyat kaynağı
 */
async function fetchGoldPriceAlternative(type: string): Promise<number | null> {
  try {
    // TCMB'den USD/TRY kuru ve uluslararası altın fiyatı
    console.log(`Alternatif altın fiyatı çekiliyor: ${type}`)

    const usdTryRate = await getUSDtoTRYRate()
    if (!usdTryRate) return null

    // Uluslararası altın fiyatı (USD/ons)
    const goldResponse = await fetch("https://api.metals.live/v1/spot/gold", {
      next: { revalidate: 300 },
    })

    if (goldResponse.ok) {
      const goldData = await goldResponse.json()
      if (goldData.price) {
        // USD/ons'tan TL/gram'a çevir (1 ons = 31.1035 gram)
        const goldPricePerGram = (goldData.price / 31.1035) * usdTryRate

        // Altın türüne göre ayar hesaplaması
        let adjustedPrice = goldPricePerGram
        if (type.includes("22 Ayar")) {
          adjustedPrice = goldPricePerGram * (22 / 24)
        } else if (type.includes("18 Ayar")) {
          adjustedPrice = goldPricePerGram * (18 / 24)
        } else if (type.includes("14 Ayar")) {
          adjustedPrice = goldPricePerGram * (14 / 24)
        }

        console.log(`${type} alternatif fiyatı: ${adjustedPrice} TL`)
        return adjustedPrice
      }
    }

    return null
  } catch (error) {
    console.error(`Alternatif altın fiyatı çekilirken hata: ${error}`)
    return null
  }
}

/**
 * Döviz kuru çekme
 */
async function fetchForexRate(currency: string): Promise<number | null> {
  try {
    const cacheKey = `forex_${currency}`
    const cachedPrice = getCachedPrice(cacheKey)
    if (cachedPrice !== null) {
      return cachedPrice
    }

    console.log(`Döviz kuru çekiliyor: ${currency}`)

    // TCMB API'si
    const response = await fetch("https://finans.truncgil.com/today.json", {
      next: { revalidate: 300 },
    })

    if (!response.ok) {
      console.log(`Döviz API hatası: ${response.status}`)
      return await fetchForexRateAlternative(currency)
    }

    const data = await response.json()
    console.log("Döviz API yanıtı alındı")

    let rate: number | null = null

    if (currency.includes("Amerikan Doları") || currency.includes("USD")) {
      rate = parsePrice(data["USD"]?.Alış)
    } else if (currency.includes("Euro") || currency.includes("EUR")) {
      rate = parsePrice(data["EUR"]?.Alış)
    } else if (currency.includes("İngiliz Sterlini") || currency.includes("GBP")) {
      rate = parsePrice(data["GBP"]?.Alış)
    } else if (currency.includes("İsviçre Frangı") || currency.includes("CHF")) {
      rate = parsePrice(data["CHF"]?.Alış)
    } else if (currency.includes("Japon Yeni") || currency.includes("JPY")) {
      rate = parsePrice(data["JPY"]?.Alış)
    } else if (currency.includes("Kanada Doları") || currency.includes("CAD")) {
      rate = parsePrice(data["CAD"]?.Alış)
    } else if (currency.includes("Avustralya Doları") || currency.includes("AUD")) {
      rate = parsePrice(data["AUD"]?.Alış)
    }

    if (rate) {
      cachePrice(cacheKey, rate)
      console.log(`${currency} güncel kuru: ${rate} TL`)
      return rate
    }

    return await fetchForexRateAlternative(currency)
  } catch (error) {
    console.error(`Döviz kuru çekilirken hata: ${error}`)
    return await fetchForexRateAlternative(currency)
  }
}

/**
 * Alternatif döviz kuru kaynağı
 */
async function fetchForexRateAlternative(currency: string): Promise<number | null> {
  try {
    const currencyCode = getForexCode(currency)
    if (!currencyCode) return null

    console.log(`Alternatif döviz kuru çekiliyor: ${currencyCode}`)

    // ExchangeRates API
    const response = await fetch(`https://open.er-api.com/v6/latest/USD`, {
      next: { revalidate: 300 },
    })

    if (response.ok) {
      const data = await response.json()
      if (data.rates && data.rates[currencyCode] && data.rates.TRY) {
        const usdToTry = data.rates.TRY
        const usdToCurrency = data.rates[currencyCode]
        const rate = usdToTry / usdToCurrency
        console.log(`${currency} alternatif kuru: ${rate} TL`)
        return rate
      }
    }

    return null
  } catch (error) {
    console.error(`Alternatif döviz kuru çekilirken hata: ${error}`)
    return null
  }
}

/**
 * Hisse senedi fiyatı çekme
 */
async function fetchStockPrice(symbol: string): Promise<number | null> {
  try {
    const cacheKey = `stock_${symbol}`
    const cachedPrice = getCachedPrice(cacheKey)
    if (cachedPrice !== null) {
      return cachedPrice
    }

    console.log(`Hisse senedi fiyatı çekiliyor: ${symbol}`)

    // BIST hisseleri için
    if (isBistSymbol(symbol)) {
      return await fetchBistPrice(symbol)
    }

    // Uluslararası hisseler için Yahoo Finance
    return await fetchYahooFinancePrice(symbol)
  } catch (error) {
    console.error(`Hisse senedi fiyatı çekilirken hata: ${error}`)
    return null
  }
}

/**
 * BIST hisse senedi fiyatı çekme
 */
async function fetchBistPrice(symbol: string): Promise<number | null> {
  try {
    const cacheKey = `bist_${symbol}`
    const cachedPrice = getCachedPrice(cacheKey)
    if (cachedPrice !== null) {
      return cachedPrice
    }

    console.log(`BIST fiyatı çekiliyor: ${symbol}`)

    // Yahoo Finance BIST
    const yahooSymbol = `${symbol}.IS`
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=1d`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        next: { revalidate: 300 },
      },
    )

    if (!response.ok) {
      console.log(`Yahoo Finance BIST API hatası: ${response.status}`)
      return null
    }

    const data = await response.json()

    if (data.chart?.result?.[0]?.meta?.regularMarketPrice) {
      const price = data.chart.result[0].meta.regularMarketPrice
      cachePrice(cacheKey, price)
      console.log(`${symbol} BIST fiyatı: ${price} TL`)
      return price
    }

    return null
  } catch (error) {
    console.error(`BIST fiyatı çekilirken hata: ${error}`)
    return null
  }
}

/**
 * Yahoo Finance uluslararası hisse fiyatı çekme
 */
async function fetchYahooFinancePrice(symbol: string): Promise<number | null> {
  try {
    const cacheKey = `yahoo_${symbol}`
    const cachedPrice = getCachedPrice(cacheKey)
    if (cachedPrice !== null) {
      return cachedPrice
    }

    console.log(`Yahoo Finance fiyatı çekiliyor: ${symbol}`)

    const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      next: { revalidate: 300 },
    })

    if (!response.ok) {
      console.log(`Yahoo Finance API hatası: ${response.status}`)
      return null
    }

    const data = await response.json()

    if (data.chart?.result?.[0]?.meta?.regularMarketPrice) {
      const usdPrice = data.chart.result[0].meta.regularMarketPrice

      // USD fiyatını TL'ye çevir
      const usdToTryRate = await getUSDtoTRYRate()
      if (usdToTryRate) {
        const tryPrice = usdPrice * usdToTryRate
        cachePrice(cacheKey, tryPrice)
        console.log(`${symbol} fiyatı: $${usdPrice} (${tryPrice.toFixed(2)} TL)`)
        return tryPrice
      }

      return usdPrice
    }

    return null
  } catch (error) {
    console.error(`Yahoo Finance fiyatı çekilirken hata: ${error}`)
    return null
  }
}

/**
 * USD/TRY kurunu çekme
 */
async function getUSDtoTRYRate(): Promise<number | null> {
  try {
    // TCMB'den USD/TRY kuru
    const response = await fetch("https://finans.truncgil.com/today.json", {
      next: { revalidate: 300 },
    })

    if (response.ok) {
      const data = await response.json()
      if (data["USD"]?.Alış) {
        return parsePrice(data["USD"].Alış)
      }
    }

    // Alternatif kaynak
    const altResponse = await fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: 300 },
    })

    if (altResponse.ok) {
      const data = await altResponse.json()
      if (data.rates?.TRY) {
        return data.rates.TRY
      }
    }

    return 32.5 // Fallback değer
  } catch (error) {
    console.error(`USD/TRY kuru çekilirken hata: ${error}`)
    return 32.5
  }
}

/**
 * Ana fiyat çekme fonksiyonu
 */
export async function fetchLatestPrice(category: string, symbol: string): Promise<{ price: number } | null> {
  try {
    console.log(`=== Fiyat çekme başladı: ${category} - ${symbol} ===`)

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
        console.log(`Bilinmeyen kategori: ${category}`)
        return null
    }

    if (price !== null && price > 0) {
      console.log(`=== Fiyat başarıyla çekildi: ${price} TL ===`)
      return { price }
    }

    console.log(`=== Fiyat çekilemedi, fallback kullanılacak ===`)
    return null
  } catch (error) {
    console.error(`Fiyat çekilirken hata: ${error}`)
    return null
  }
}

// Yardımcı fonksiyonlar
function parsePrice(priceStr: string): number | null {
  if (!priceStr) return null
  const cleanPrice = priceStr.replace(/\./g, "").replace(",", ".")
  const price = Number.parseFloat(cleanPrice)
  return isNaN(price) ? null : price
}

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

function getBinanceSymbol(symbol: string): string | null {
  const binanceMap: Record<string, string> = {
    bitcoin: "BTCTRY",
    btc: "BTCTRY",
    ethereum: "ETHTRY",
    eth: "ETHTRY",
    bnb: "BNBTRY",
    solana: "SOLTRY",
    sol: "SOLTRY",
    cardano: "ADATRY",
    ada: "ADATRY",
    xrp: "XRPTRY",
    dogecoin: "DOGETRY",
    doge: "DOGETRY",
  }
  return binanceMap[symbol.toLowerCase()] || null
}

function getForexCode(currency: string): string | null {
  if (currency.includes("Amerikan Doları") || currency.includes("USD")) return "USD"
  if (currency.includes("Euro") || currency.includes("EUR")) return "EUR"
  if (currency.includes("İngiliz Sterlini") || currency.includes("GBP")) return "GBP"
  if (currency.includes("İsviçre Frangı") || currency.includes("CHF")) return "CHF"
  if (currency.includes("Japon Yeni") || currency.includes("JPY")) return "JPY"
  if (currency.includes("Kanada Doları") || currency.includes("CAD")) return "CAD"
  if (currency.includes("Avustralya Doları") || currency.includes("AUD")) return "AUD"
  return null
}

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
