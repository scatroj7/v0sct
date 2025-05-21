import { NextResponse } from "next/server"

export async function GET() {
  try {
    // API'leri test et
    const results = {
      coingecko: await testCoinGecko(),
      exchangerate: await testExchangeRateAPI(),
      alphavantage: await testAlphaVantage(),
      truncgil: await testTruncgil(),
      metalpriceapi: await testMetalPriceAPI(),
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error("API test hatası:", error)
    return NextResponse.json({ error: "API test hatası" }, { status: 500 })
  }
}

// CoinGecko API testi
async function testCoinGecko() {
  try {
    // Önce ping ile API durumunu kontrol et
    const pingResponse = await fetch("https://api.coingecko.com/api/v3/ping", {
      headers: {
        Accept: "application/json",
      },
      next: { revalidate: 0 },
    })

    if (!pingResponse.ok) {
      return {
        status: "error",
        message: `API yanıt vermedi: ${pingResponse.status}`,
      }
    }

    // Bitcoin fiyatını test et
    const priceResponse = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=try", {
      headers: {
        Accept: "application/json",
      },
      next: { revalidate: 0 },
    })

    if (!priceResponse.ok) {
      return {
        status: "error",
        message: `Fiyat API yanıt vermedi: ${priceResponse.status}`,
      }
    }

    const priceData = await priceResponse.json()

    return {
      status: "success",
      message: "API çalışıyor",
      data: priceData,
      info: "Kripto para fiyatları için kullanılıyor. Ücretsiz planda dakikada 10-30 istek limiti var.",
    }
  } catch (error) {
    return {
      status: "error",
      message: `Bağlantı hatası: ${error}`,
    }
  }
}

// ExchangeRate-API testi
async function testExchangeRateAPI() {
  try {
    const response = await fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: 0 },
    })

    if (!response.ok) {
      return {
        status: "error",
        message: `API yanıt vermedi: ${response.status}`,
      }
    }

    const data = await response.json()

    return {
      status: "success",
      message: "API çalışıyor",
      data: {
        base: data.base_code,
        rates: {
          TRY: data.rates?.TRY,
          EUR: data.rates?.EUR,
        },
      },
      info: "Döviz kurları için kullanılıyor. Ücretsiz planda aylık 1500 istek limiti var.",
    }
  } catch (error) {
    return {
      status: "error",
      message: `Bağlantı hatası: ${error}`,
    }
  }
}

// Alpha Vantage API testi
async function testAlphaVantage() {
  try {
    // Demo API anahtarı ile test
    const response = await fetch(
      "https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=THYAO.IS&apikey=demo",
      {
        next: { revalidate: 0 },
      },
    )

    if (!response.ok) {
      return {
        status: "error",
        message: `API yanıt vermedi: ${response.status}`,
      }
    }

    const data = await response.json()

    // API limiti aşıldı mı kontrol et
    if (data.Note && data.Note.includes("API call frequency")) {
      return {
        status: "warning",
        message: "API istek limiti aşıldı",
        info: "BIST hisse senetleri için kullanılıyor. Ücretsiz planda dakikada 5, günde 500 istek limiti var. Veriler 15-20 dakika gecikmeli.",
      }
    }

    return {
      status: "success",
      message: "API çalışıyor",
      data: data["Global Quote"] || data,
      info: "BIST hisse senetleri için kullanılıyor. Ücretsiz planda dakikada 5, günde 500 istek limiti var. Veriler 15-20 dakika gecikmeli.",
    }
  } catch (error) {
    return {
      status: "error",
      message: `Bağlantı hatası: ${error}`,
    }
  }
}

// Truncgil API testi
async function testTruncgil() {
  try {
    const response = await fetch("https://finans.truncgil.com/today.json", {
      next: { revalidate: 0 },
    })

    if (!response.ok) {
      return {
        status: "error",
        message: `API yanıt vermedi: ${response.status}`,
      }
    }

    const data = await response.json()

    // Dolar ve gram altın verilerini kontrol et
    const usdData = data["USD"] ? data["USD"] : null
    const goldData = data["Gram Altın"] ? data["Gram Altın"] : null

    return {
      status: "success",
      message: "API çalışıyor",
      data: {
        usd: usdData,
        gold: goldData,
      },
      info: "Altın ve döviz için yedek API olarak kullanılıyor. Resmi olmayan bir API.",
    }
  } catch (error) {
    return {
      status: "error",
      message: `Bağlantı hatası: ${error}`,
    }
  }
}

// Metal Price API testi
async function testMetalPriceAPI() {
  try {
    const response = await fetch("https://api.metalpriceapi.com/v1/latest?api_key=demo&base=XAU&currencies=USD", {
      next: { revalidate: 0 },
    })

    if (!response.ok) {
      return {
        status: "error",
        message: `API yanıt vermedi: ${response.status}`,
      }
    }

    const data = await response.json()

    return {
      status: "success",
      message: "API çalışıyor",
      data: data,
      info: "Altın fiyatları için alternatif API olarak kullanılıyor. Demo anahtar ile sınırlı kullanım.",
    }
  } catch (error) {
    return {
      status: "error",
      message: `Bağlantı hatası: ${error}`,
    }
  }
}
