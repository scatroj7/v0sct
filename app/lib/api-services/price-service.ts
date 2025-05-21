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

    // CoinGecko API'si
    const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=try`, {
      headers: {
        Accept: "application/json",
      },
      next: { revalidate: 300 }, // 5 dakika
    })

    if (!response.ok) {
      console.log(`CoinGecko API hatası: ${response.status}. Alternatif yöntem deneniyor...`)
      // USD cinsinden fiyatı çek, sonra TRY'ye çevir
      return await fetchCryptoPriceUSD(coinId)
    }

    const data = await response.json()
    if (data[coinId] && data[coinId].try) {
      const price = data[coinId].try
      cachePrice(cacheKey, price)
      return price
    }

    return await fetchCryptoPriceUSD(coinId)
  } catch (error) {
    console.error(`Kripto fiyatı çekilirken hata: ${error}`)
    return await fetchCryptoPriceUSD(symbol)
  }
}

/**
 * USD üzerinden kripto para fiyatı çekme ve TRY'ye çevirme
 * @param coinId CoinGecko coin ID'si
 * @returns Fiyat (TL cinsinden)
 */
async function fetchCryptoPriceUSD(coinId: string): Promise<number | null> {
  try {
    // USD cinsinden fiyatı çek
    const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`, {
      headers: {
        Accept: "application/json",
      },
      next: { revalidate: 300 }, // 5 dakika
    })

    if (!response.ok) {
      console.log(`CoinGecko USD API hatası: ${response.status}. Simüle edilmiş veri kullanılıyor...`)
      return getSimulatedPrice("crypto", coinId)
    }

    const data = await response.json()
    if (data[coinId] && data[coinId].usd) {
      const usdPrice = data[coinId].usd
      // USD/TRY kurunu çek
      const tryRate = await getUSDtoTRYRate()
      if (tryRate) {
        const tryPrice = usdPrice * tryRate
        cachePrice(`crypto_${coinId}`, tryPrice)
        return tryPrice
      }
    }

    return getSimulatedPrice("crypto", coinId)
  } catch (error) {
    console.error(`USD üzerinden kripto fiyatı çekilirken hata: ${error}`)
    return getSimulatedPrice("crypto", coinId)
  }
}

/**
 * ExchangeRate-API'den döviz kuru çekme
 * @param currency Döviz türü
 * @returns Kur (TL cinsinden)
 */
async function fetchForexRate(currency: string): Promise<number | null> {
  try {
    const currencyCode = getForexCode(currency)
    if (!currencyCode) return null

    const cacheKey = `forex_${currencyCode}`
    const cachedPrice = getCachedPrice(cacheKey)
    if (cachedPrice !== null) {
      return cachedPrice
    }

    // ExchangeRate-API (ücretsiz sürüm)
    const response = await fetch(`https://open.er-api.com/v6/latest/${currencyCode}`, {
      next: { revalidate: 300 }, // 5 dakika
    })

    if (!response.ok) {
      console.log(`ExchangeRate-API hatası: ${response.status}. Alternatif yöntem deneniyor...`)
      return await fetchForexRateAlternative(currency)
    }

    const data = await response.json()
    if (data.rates && data.rates.TRY) {
      const rate = data.rates.TRY
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
    const currencyCode = getForexCode(currency)
    if (!currencyCode) return null

    // Truncgil API'yi alternatif olarak kullan
    const response = await fetch("https://finans.truncgil.com/today.json", {
      next: { revalidate: 300 }, // 5 dakika
    })

    if (!response.ok) {
      console.log(`Truncgil API hatası: ${response.status}. Simüle edilmiş veri kullanılıyor...`)
      return getSimulatedPrice("forex", currency)
    }

    const data = await response.json()

    // Döviz türüne göre kur çekme
    let rate: number | null = null

    if (currencyCode === "USD") {
      if (data["USD"] && data["USD"].Alış) {
        rate = Number.parseFloat(data["USD"].Alış.replace(",", "."))
      }
    } else if (currencyCode === "EUR") {
      if (data["EUR"] && data["EUR"].Alış) {
        rate = Number.parseFloat(data["EUR"].Alış.replace(",", "."))
      }
    } else if (currencyCode === "GBP") {
      if (data["GBP"] && data["GBP"].Alış) {
        rate = Number.parseFloat(data["GBP"].Alış.replace(",", "."))
      }
    } else if (currencyCode === "CHF") {
      if (data["CHF"] && data["CHF"].Alış) {
        rate = Number.parseFloat(data["CHF"].Alış.replace(",", "."))
      }
    } else {
      // Diğer dövizler için USD kurunu kullan ve çapraz kur hesapla
      if (data["USD"] && data["USD"].Alış) {
        const usdRate = Number.parseFloat(data["USD"].Alış.replace(",", "."))
        // USD üzerinden çapraz kur hesapla
        const crossRate = await getCrossRate(currencyCode)
        if (crossRate) {
          rate = usdRate / crossRate
        }
      }
    }

    if (rate) {
      cachePrice(`forex_${currencyCode}`, rate)
      return rate
    }

    return getSimulatedPrice("forex", currency)
  } catch (error) {
    console.error(`Alternatif döviz kuru çekilirken hata: ${error}`)
    return getSimulatedPrice("forex", currency)
  }
}

/**
 * USD üzerinden çapraz kur hesaplama
 * @param currencyCode Döviz kodu
 * @returns USD/Döviz kuru
 */
async function getCrossRate(currencyCode: string): Promise<number | null> {
  try {
    const response = await fetch(`https://open.er-api.com/v6/latest/USD`, {
      next: { revalidate: 300 }, // 5 dakika
    })

    if (!response.ok) return null

    const data = await response.json()
    if (data.rates && data.rates[currencyCode]) {
      return data.rates[currencyCode]
    }

    return null
  } catch (error) {
    console.error(`Çapraz kur hesaplanırken hata: ${error}`)
    return null
  }
}

/**
 * Altın fiyatı çekme
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

    // Truncgil API'den altın fiyatlarını çek
    const response = await fetch("https://finans.truncgil.com/today.json", {
      next: { revalidate: 300 }, // 5 dakika
    })

    if (!response.ok) {
      console.log(`Truncgil API hatası: ${response.status}. Alternatif yöntem deneniyor...`)
      return await fetchGoldPriceAlternative(type)
    }

    const data = await response.json()

    // Altın türüne göre fiyat çekme
    let price: number | null = null

    if (type.includes("Gram")) {
      // Gram altın
      if (data["Gram Altın"] && data["Gram Altın"].Alış) {
        price = Number.parseFloat(data["Gram Altın"].Alış.replace(",", "."))
      }
    } else if (type.includes("Çeyrek")) {
      // Çeyrek altın
      if (data["Çeyrek Altın"] && data["Çeyrek Altın"].Alış) {
        price = Number.parseFloat(data["Çeyrek Altın"].Alış.replace(",", "."))
      }
    } else if (type.includes("Yarım")) {
      // Yarım altın
      if (data["Yarım Altın"] && data["Yarım Altın"].Alış) {
        price = Number.parseFloat(data["Yarım Altın"].Alış.replace(",", "."))
      }
    } else if (type.includes("Tam") || type.includes("Cumhuriyet")) {
      // Tam altın
      if (data["Tam Altın"] && data["Tam Altın"].Alış) {
        price = Number.parseFloat(data["Tam Altın"].Alış.replace(",", "."))
      }
    } else if (type.includes("Ata")) {
      // Ata altın
      if (data["Ata Altın"] && data["Ata Altın"].Alış) {
        price = Number.parseFloat(data["Ata Altın"].Alış.replace(",", "."))
      }
    } else if (type.includes("22 Ayar")) {
      // 22 Ayar
      if (data["22 Ayar Bilezik"] && data["22 Ayar Bilezik"].Alış) {
        price = Number.parseFloat(data["22 Ayar Bilezik"].Alış.replace(",", "."))
      }
    } else if (type.includes("14 Ayar")) {
      // 14 Ayar
      if (data["14 Ayar Altın"] && data["14 Ayar Altın"].Alış) {
        price = Number.parseFloat(data["14 Ayar Altın"].Alış.replace(",", "."))
      }
    } else if (type.includes("18 Ayar")) {
      // 18 Ayar
      if (data["18 Ayar Altın"] && data["18 Ayar Altın"].Alış) {
        price = Number.parseFloat(data["18 Ayar Altın"].Alış.replace(",", "."))
      }
    } else if (type.includes("Reşat")) {
      // Reşat altın
      if (data["Reşat Altın"] && data["Reşat Altın"].Alış) {
        price = Number.parseFloat(data["Reşat Altın"].Alış.replace(",", "."))
      }
    } else {
      // Diğer altın türleri için gram altın fiyatını kullan
      if (data["Gram Altın"] && data["Gram Altın"].Alış) {
        price = Number.parseFloat(data["Gram Altın"].Alış.replace(",", "."))
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
    // Uluslararası altın fiyatı (XAU/USD) ve USD/TRY kuru üzerinden hesaplama
    // 1 ons = 31.1034768 gram
    const response = await fetch("https://api.metalpriceapi.com/v1/latest?api_key=demo&base=XAU&currencies=USD", {
      next: { revalidate: 300 }, // 5 dakika
    })

    if (!response.ok) {
      console.log(`Metal Price API hatası: ${response.status}. Simüle edilmiş veri kullanılıyor...`)
      return getSimulatedPrice("gold", type)
    }

    const data = await response.json()
    if (data.rates && data.rates.USD) {
      const xauUsdRate = data.rates.USD // 1 ons altın = X USD
      const usdTryRate = await getUSDtoTRYRate() // 1 USD = Y TRY

      if (usdTryRate) {
        // 1 ons altın fiyatı (TRY)
        const xauTryRate = xauUsdRate * usdTryRate
        // 1 gram altın fiyatı (TRY)
        const gramGoldPrice = xauTryRate / 31.1034768

        // Altın türüne göre fiyat hesaplama
        let price: number | null = null

        if (type.includes("Gram")) {
          price = gramGoldPrice
        } else if (type.includes("Çeyrek")) {
          price = gramGoldPrice * 1.75 // Yaklaşık 1.75 gram
        } else if (type.includes("Yarım")) {
          price = gramGoldPrice * 3.5 // Yaklaşık 3.5 gram
        } else if (type.includes("Tam") || type.includes("Cumhuriyet")) {
          price = gramGoldPrice * 7 // Yaklaşık 7 gram
        } else if (type.includes("Ata")) {
          price = gramGoldPrice * 7.2 // Yaklaşık 7.2 gram
        } else if (type.includes("22 Ayar")) {
          price = gramGoldPrice * 0.916 // 22/24 saflık
        } else if (type.includes("14 Ayar")) {
          price = gramGoldPrice * 0.585 // 14/24 saflık
        } else if (type.includes("18 Ayar")) {
          price = gramGoldPrice * 0.75 // 18/24 saflık
        } else if (type.includes("Reşat")) {
          price = gramGoldPrice * 7.2 // Yaklaşık 7.2 gram
        } else {
          price = gramGoldPrice // Varsayılan olarak gram altın
        }

        if (price) {
          cachePrice(`gold_${type}`, price)
          return price
        }
      }
    }

    return getSimulatedPrice("gold", type)
  } catch (error) {
    console.error(`Alternatif altın fiyatı çekilirken hata: ${error}`)
    return getSimulatedPrice("gold", type)
  }
}

/**
 * Alpha Vantage API'sinden hisse senedi fiyatı çekme
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
      return await fetchBistPrice(symbol)
    }

    // Diğer borsalar için simüle edilmiş fiyat
    // Gerçek uygulamada burada Alpha Vantage veya başka bir API kullanılabilir
    const simulatedPrice = getSimulatedStockPrice(symbol)
    if (simulatedPrice) {
      cachePrice(cacheKey, simulatedPrice)
    }
    return simulatedPrice
  } catch (error) {
    console.error(`Hisse senedi fiyatı çekilirken hata: ${error}`)
    return null
  }
}

/**
 * Alpha Vantage API'sinden BIST hisse senedi fiyatı çekme
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

    // Alpha Vantage API anahtarı (ücretsiz sürüm)
    // Not: Gerçek uygulamada bu değer bir çevre değişkeninden alınmalıdır
    const apiKey = "demo" // Gerçek bir API anahtarı ile değiştirilmelidir

    // BIST hisseleri için ".IS" son eki eklenir
    const formattedSymbol = symbol.includes(".IS") ? symbol : `${symbol}.IS`

    const response = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${formattedSymbol}&apikey=${apiKey}`,
      {
        next: { revalidate: 900 }, // 15 dakika (ücretsiz sürüm 15-20 dakika gecikmeli veri sunar)
      },
    )

    if (!response.ok) {
      console.log(`Alpha Vantage API hatası: ${response.status}. Simüle edilmiş veri kullanılıyor...`)
      return getSimulatedBistPrice(symbol)
    }

    const data = await response.json()
    if (data["Global Quote"] && data["Global Quote"]["05. price"]) {
      const price = Number.parseFloat(data["Global Quote"]["05. price"])
      cachePrice(cacheKey, price)
      return price
    }

    // API limiti aşıldıysa veya veri yoksa simüle edilmiş fiyat kullan
    return getSimulatedBistPrice(symbol)
  } catch (error) {
    console.error(`BIST hisse senedi fiyatı çekilirken hata: ${error}`)
    return getSimulatedBistPrice(symbol)
  }
}

/**
 * USD/TRY kurunu çekme
 * @returns USD/TRY kuru
 */
async function getUSDtoTRYRate(): Promise<number | null> {
  try {
    const cacheKey = "forex_USD"
    const cachedPrice = getCachedPrice(cacheKey)
    if (cachedPrice !== null) {
      return cachedPrice
    }

    // ExchangeRate-API'den USD/TRY kurunu çek
    const response = await fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: 300 }, // 5 dakika
    })

    if (!response.ok) {
      // Alternatif olarak Truncgil API'yi dene
      return await getUSDtoTRYRateAlternative()
    }

    const data = await response.json()
    if (data.rates && data.rates.TRY) {
      const rate = data.rates.TRY
      cachePrice(cacheKey, rate)
      return rate
    }

    return await getUSDtoTRYRateAlternative()
  } catch (error) {
    console.error(`USD/TRY kuru çekilirken hata: ${error}`)
    return await getUSDtoTRYRateAlternative()
  }
}

/**
 * Alternatif kaynaklardan USD/TRY kurunu çekme
 * @returns USD/TRY kuru
 */
async function getUSDtoTRYRateAlternative(): Promise<number | null> {
  try {
    // Truncgil API'den USD/TRY kurunu çek
    const response = await fetch("https://finans.truncgil.com/today.json", {
      next: { revalidate: 300 }, // 5 dakika
    })

    if (!response.ok) {
      return 32.5 // Simüle edilmiş USD/TRY kuru
    }

    const data = await response.json()
    if (data["USD"] && data["USD"].Alış) {
      return Number.parseFloat(data["USD"].Alış.replace(",", "."))
    }

    return 32.5 // Simüle edilmiş USD/TRY kuru
  } catch (error) {
    console.error(`Alternatif USD/TRY kuru çekilirken hata: ${error}`)
    return 32.5 // Simüle edilmiş USD/TRY kuru
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
    tron: "tron",
    trx: "tron",
    litecoin: "litecoin",
    ltc: "litecoin",
    chainlink: "chainlink",
    link: "chainlink",
    uniswap: "uniswap",
    uni: "uniswap",
    stellar: "stellar",
    xlm: "stellar",
    cosmos: "cosmos",
    atom: "cosmos",
    monero: "monero",
    xmr: "monero",
    tezos: "tezos",
    xtz: "tezos",
    aave: "aave",
    maker: "maker",
    mkr: "maker",
    compound: "compound-governance-token",
    comp: "compound-governance-token",
    yearn: "yearn-finance",
    yfi: "yearn-finance",
    sushiswap: "sushi",
    sushi: "sushi",
    pancakeswap: "pancakeswap-token",
    cake: "pancakeswap-token",
    algorand: "algorand",
    algo: "algorand",
    filecoin: "filecoin",
    fil: "filecoin",
    theta: "theta-token",
    vechain: "vechain",
    vet: "vechain",
    eos: "eos",
    iota: "iota",
    miota: "iota",
    neo: "neo",
    kusama: "kusama",
    ksm: "kusama",
    dash: "dash",
    zcash: "zcash",
    zec: "zcash",
    decentraland: "decentraland",
    mana: "decentraland",
    the: "the-sandbox",
    sand: "the-sandbox",
    axie: "axie-infinity",
    axs: "axie-infinity",
    shiba: "shiba-inu",
    shib: "shiba-inu",
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
      bitcoin: 1750000,
      ethereum: 95000,
      binancecoin: 12000,
      solana: 5000,
      cardano: 15,
      ripple: 20,
      dogecoin: 5,
      polkadot: 250,
      "avalanche-2": 1200,
      "matic-network": 40,
      tron: 30,
      litecoin: 3500,
      chainlink: 500,
      uniswap: 250,
      stellar: 15,
      cosmos: 450,
      monero: 2000,
      tezos: 100,
      aave: 3000,
      maker: 60000,
      "compound-governance-token": 2000,
      "yearn-finance": 300000,
      sushi: 100,
      "pancakeswap-token": 150,
      algorand: 80,
      filecoin: 1500,
      "theta-token": 300,
      vechain: 10,
      eos: 300,
      iota: 100,
      neo: 500,
      kusama: 1000,
      dash: 1500,
      zcash: 1200,
      decentraland: 15,
      "the-sandbox": 20,
      "axie-infinity": 250,
      "shiba-inu": 0.001,
    },
    gold: {
      "Gram Altın": 2400,
      "Çeyrek Altın": 9800,
      "Yarım Altın": 19600,
      "Tam Altın": 39200,
      "Cumhuriyet Altını": 40000,
      "Ata Altın": 39500,
      "Reşat Altını": 41000,
      "22 Ayar Bilezik": 2200,
      "14 Ayar Altın": 1400,
      "18 Ayar Altın": 1800,
      "Diğer Altın": 2300,
    },
    forex: {
      "Amerikan Doları": 32.5,
      Euro: 35.2,
      "İngiliz Sterlini": 41.8,
      "İsviçre Frangı": 36.5,
      "Japon Yeni": 0.21,
      "Kanada Doları": 23.8,
      "Avustralya Doları": 21.5,
      "Çin Yuanı": 4.5,
      "Rus Rublesi": 0.35,
      "Suudi Riyali": 8.65,
      "Diğer Döviz": 10,
    },
  }

  let basePrice = 100

  if (category === "crypto") {
    // Kripto para için CoinGecko ID'sini kullan
    const coinId = getCoinGeckoId(symbol.toLowerCase())
    if (coinId && priceData.crypto[coinId]) {
      basePrice = priceData.crypto[coinId]
    }
  } else if (category !== "stock" && priceData[category] && priceData[category][symbol]) {
    basePrice = priceData[category][symbol]
  }

  const randomFactor = 0.98 + Math.random() * 0.04
  return Number((basePrice * randomFactor).toFixed(2))
}
