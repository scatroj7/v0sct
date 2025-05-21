import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { SessionProvider } from "./providers/session-provider"

// react-day-picker/dist/style.css import'u varsa, bu satırı silin
// import 'react-day-picker/dist/style.css';

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Finans Takip Uygulaması",
  description: "Kişisel finanslarınızı takip edin, bütçenizi planlayın ve finansal hedeflerinize ulaşın.",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="tr" className="dark">
      <body className={`${inter.className} dark:bg-gray-950 dark:text-gray-100`}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  )
}
