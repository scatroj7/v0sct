import { type NextRequest, NextResponse } from "next/server"
import { getUserIdFromSession } from "@/app/lib/auth"
import { neon } from "@neondatabase/serverless"

function getDatabaseUrl(): string {
  const possibleUrls = [
    process.env.NEON_NEON_NEON_DATABASE_URL,
    process.env.NEON_POSTGRES_URL,
    process.env.NEON_NEON_DATABASE_URL,
    process.env.DATABASE_URL,
    process.env.POSTGRES_URL,
  ]

  for (const url of possibleUrls) {
    if (url && url.trim() !== "") {
      return url
    }
  }

  throw new Error("Veritabanı bağlantı dizesi bulunamadı")
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const dbUrl = getDatabaseUrl()
    const sql = neon(dbUrl)

    const userId = getUserIdFromSession()
    const id = params.id

    // Tüm yatırımları listele
    const allInvestments = await sql`
      SELECT id, user_id, name, category FROM investments
    `

    // Belirli ID'li yatırımı ara
    const specificInvestment = await sql`
      SELECT * FROM investments WHERE id = ${id}
    `

    // User'ın yatırımlarını ara
    const userInvestments = userId
      ? await sql`
      SELECT * FROM investments WHERE user_id = ${userId}
    `
      : []

    return NextResponse.json({
      success: true,
      requestedId: id,
      requestedIdType: typeof id,
      currentUserId: userId,
      currentUserIdType: typeof userId,
      allInvestments: allInvestments,
      specificInvestment: specificInvestment,
      userInvestments: userInvestments,
    })
  } catch (error) {
    console.error("Investment info alınırken hata:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
