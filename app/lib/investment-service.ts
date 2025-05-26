// Yatırım kategorileri
export const investmentCategories = [
  { value: "crypto", label: "Kripto Para" },
  { value: "gold", label: "Altın" },
  { value: "forex", label: "Döviz" },
  { value: "stock", label: "Hisse Senedi" },
]

// Yatırım türleri (kategoriye göre)
export const investmentTypes = {
  crypto: [
    { value: "Bitcoin", label: "Bitcoin (BTC)" },
    { value: "Ethereum", label: "Ethereum (ETH)" },
    { value: "BNB", label: "Binance Coin (BNB)" },
    { value: "Solana", label: "Solana (SOL)" },
    { value: "Cardano", label: "Cardano (ADA)" },
    { value: "XRP", label: "XRP (XRP)" },
    { value: "Dogecoin", label: "Dogecoin (DOGE)" },
    { value: "Polkadot", label: "Polkadot (DOT)" },
    { value: "Avalanche", label: "Avalanche (AVAX)" },
    { value: "Polygon", label: "Polygon (MATIC)" },
    { value: "Diğer Kripto", label: "Diğer Kripto Para" },
  ],
  gold: [
    { value: "24 Ayar Gram Altın", label: "24 Ayar Gram Altın (Has Altın)" },
    { value: "22 Ayar Gram Altın", label: "22 Ayar Gram Altın" },
    { value: "18 Ayar Gram Altın", label: "18 Ayar Gram Altın" },
    { value: "14 Ayar Gram Altın", label: "14 Ayar Gram Altın" },
    { value: "Çeyrek Altın", label: "Çeyrek Altın" },
    { value: "Yarım Altın", label: "Yarım Altın" },
    { value: "Tam Altın", label: "Tam Altın" },
    { value: "Cumhuriyet Altını", label: "Cumhuriyet Altını" },
    { value: "Ata Altın", label: "Ata Altın" },
    { value: "Reşat Altını", label: "Reşat Altını" },
    { value: "22 Ayar Bilezik", label: "22 Ayar Bilezik" },
    { value: "Diğer Altın", label: "Diğer Altın" },
  ],
  forex: [
    { value: "Amerikan Doları", label: "Amerikan Doları (USD)" },
    { value: "Euro", label: "Euro (EUR)" },
    { value: "İngiliz Sterlini", label: "İngiliz Sterlini (GBP)" },
    { value: "İsviçre Frangı", label: "İsviçre Frangı (CHF)" },
    { value: "Japon Yeni", label: "Japon Yeni (JPY)" },
    { value: "Kanada Doları", label: "Kanada Doları (CAD)" },
    { value: "Avustralya Doları", label: "Avustralya Doları (AUD)" },
    { value: "Çin Yuanı", label: "Çin Yuanı (CNY)" },
    { value: "Rus Rublesi", label: "Rus Rublesi (RUB)" },
    { value: "Suudi Riyali", label: "Suudi Riyali (SAR)" },
    { value: "Diğer Döviz", label: "Diğer Döviz" },
  ],
  stock: [
    { value: "BIST", label: "Borsa İstanbul (BIST)" },
    { value: "NASDAQ", label: "NASDAQ" },
    { value: "NYSE", label: "New York Borsası (NYSE)" },
    { value: "Diğer Borsa", label: "Diğer Borsa" },
  ],
}

// Hisse senedi sembolleri (borsaya göre)
export const stockSymbols = {
  BIST: [
    { value: "THYAO", label: "Türk Hava Yolları (THYAO)" },
    { value: "ASELS", label: "Aselsan (ASELS)" },
    { value: "KCHOL", label: "Koç Holding (KCHOL)" },
    { value: "EREGL", label: "Ereğli Demir Çelik (EREGL)" },
    { value: "GARAN", label: "Garanti Bankası (GARAN)" },
    { value: "AKBNK", label: "Akbank (AKBNK)" },
    { value: "YKBNK", label: "Yapı Kredi Bankası (YKBNK)" },
    { value: "TUPRS", label: "Tüpraş (TUPRS)" },
    { value: "SAHOL", label: "Sabancı Holding (SAHOL)" },
    { value: "SISE", label: "Şişecam (SISE)" },
    { value: "BIMAS", label: "BİM (BIMAS)" },
    { value: "ARCLK", label: "Arçelik (ARCLK)" },
    { value: "TOASO", label: "Tofaş (TOASO)" },
    { value: "FROTO", label: "Ford Otosan (FROTO)" },
    { value: "PETKM", label: "Petkim (PETKM)" },
    { value: "DIGER", label: "Diğer BIST Hissesi" },
  ],
  NASDAQ: [
    { value: "AAPL", label: "Apple Inc. (AAPL)" },
    { value: "MSFT", label: "Microsoft Corp. (MSFT)" },
    { value: "AMZN", label: "Amazon.com Inc. (AMZN)" },
    { value: "GOOGL", label: "Alphabet Inc. (GOOGL)" },
    { value: "META", label: "Meta Platforms Inc. (META)" },
    { value: "TSLA", label: "Tesla Inc. (TSLA)" },
    { value: "NVDA", label: "NVIDIA Corp. (NVDA)" },
    { value: "NFLX", label: "Netflix Inc. (NFLX)" },
    { value: "PYPL", label: "PayPal Holdings Inc. (PYPL)" },
    { value: "INTC", label: "Intel Corp. (INTC)" },
    { value: "DIGER", label: "Diğer NASDAQ Hissesi" },
  ],
  NYSE: [
    { value: "JPM", label: "JPMorgan Chase & Co. (JPM)" },
    { value: "BAC", label: "Bank of America Corp. (BAC)" },
    { value: "WMT", label: "Walmart Inc. (WMT)" },
    { value: "PG", label: "Procter & Gamble Co. (PG)" },
    { value: "JNJ", label: "Johnson & Johnson (JNJ)" },
    { value: "XOM", label: "Exxon Mobil Corp. (XOM)" },
    { value: "V", label: "Visa Inc. (V)" },
    { value: "MA", label: "Mastercard Inc. (MA)" },
    { value: "DIS", label: "Walt Disney Co. (DIS)" },
    { value: "KO", label: "Coca-Cola Co. (KO)" },
    { value: "DIGER", label: "Diğer NYSE Hissesi" },
  ],
  "Diğer Borsa": [{ value: "DIGER", label: "Diğer Hisse Senedi" }],
}

// Fiyat verileri (gerçekçi değerler)
const priceData = {
  crypto: {
    Bitcoin: 1750000, // TL cinsinden
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
    "24 Ayar Gram Altın": 4174, // Has altın (en saf)
    "22 Ayar Gram Altın": 3814, // 22 ayar bilezik fiyatı
    "18 Ayar Gram Altın": 3052, // 18 ayar
    "14 Ayar Gram Altın": 2383, // 14 ayar
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
  stock: {
    // BIST
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
  },
}

// Güncel fiyat çekme fonksiyonu (simüle edilmiş)
export async function fetchLatestPrice(category: string, symbol: string): Promise<{ price: number } | null> {
  try {
    console.log(`${category} kategorisinde ${symbol} için fiyat çekiliyor...`)

    // Simüle edilmiş gecikme
    await new Promise((resolve) => setTimeout(resolve, 300))

    let basePrice = 0

    // Kategori ve sembol/tür bazında fiyat belirle
    switch (category) {
      case "crypto":
        // Kripto para için sembol kullanılır
        basePrice = priceData.crypto[symbol as keyof typeof priceData.crypto] || 100
        break
      case "gold":
        // Altın için tür kullanılır (sembol = tür)
        basePrice = priceData.gold[symbol as keyof typeof priceData.gold] || 4000
        break
      case "forex":
        // Döviz için tür kullanılır (sembol = tür)
        basePrice = priceData.forex[symbol as keyof typeof priceData.forex] || 10
        break
      case "stock":
        // Hisse senedi için sembol kullanılır
        basePrice = priceData.stock[symbol as keyof typeof priceData.stock] || 100
        break
      default:
        basePrice = 100
    }

    // %2 rastgele değişim ekle (daha gerçekçi dalgalanma)
    const randomFactor = 0.98 + Math.random() * 0.04
    const price = basePrice * randomFactor

    return { price: Number(price.toFixed(2)) }
  } catch (error) {
    console.error(`Fiyat çekilirken hata: ${error}`)
    return null
  }
}
