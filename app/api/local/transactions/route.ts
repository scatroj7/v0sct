import { NextResponse } from "next/server"

// Bu endpoint'ler artık sadece client-side için mock response döner
// Gerçek işlemler tamamen localStorage'da yapılacak

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Bu endpoint artık kullanılmıyor. Client-side localStorage kullanın.",
    transactions: [],
  })
}

export async function POST() {
  return NextResponse.json({
    success: true,
    message: "Bu endpoint artık kullanılmıyor. Client-side localStorage kullanın.",
  })
}
