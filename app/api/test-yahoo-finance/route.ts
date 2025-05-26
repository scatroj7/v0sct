import { NextResponse } from "next/server"

export async function GET() {
  try {
    const testSymbols = [
      "THYAO.IS", // BIST
      "AAPL", // NASDAQ
      "JPM", // NYSE
    ]

    const results = []

    for (const symbol of testSymbols) {
      try {
        console.log(`Testing ${symbol}...`)

        const response = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`,
          {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            },
          },
        )

        if (response.ok) {
          const data = await response.json()

          if (data.chart && data.chart.result && data.chart.result[0]) {
            const result = data.chart.result[0]
            const meta = result.meta

            results.push({
              symbol,
              status: "success",
              price: meta.regularMarketPrice,
              currency: meta.currency,
              marketState: meta.marketState,
              exchangeName: meta.exchangeName,
            })
          } else {
            results.push({
              symbol,
              status: "no_data",
              error: "No chart data found",
            })
          }
        } else {
          results.push({
            symbol,
            status: "error",
            error: `HTTP ${response.status}`,
          })
        }
      } catch (error) {
        results.push({
          symbol,
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    return NextResponse.json({
      message: "Yahoo Finance API Test Results",
      timestamp: new Date().toISOString(),
      results,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Test failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
