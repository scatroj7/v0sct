"use client"
import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

export interface CustomCalendarProps {
  selected?: Date | null
  onSelect?: (date: Date | null) => void
  className?: string
  locale?: string
}

// Takvim günlerini hesaplayan yardımcı fonksiyon
const getCalendarDays = (year: number, month: number): (Date | null)[] => {
  const date = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // Haftanın ilk günü: Pazartesi (1), Salı (2), ..., Pazar (0)
  let firstDayOfWeek = date.getDay() // 0 (Pazar) - 6 (Cumartesi)
  if (firstDayOfWeek === 0)
    firstDayOfWeek = 6 // Pazar'ı haftanın son günü yap
  else firstDayOfWeek-- // Pazartesi'yi 0, Salı'yı 1 yap

  const calendarDays: (Date | null)[] = []

  // Önceki ayın günlerini ekle (başlangıç boşlukları)
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarDays.push(null)
  }

  // Mevcut ayın günlerini ekle
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(new Date(year, month, i))
  }

  // Sonraki ayın günlerini ekle (son boşluklar)
  const totalCells = 42 // 6 hafta * 7 gün = 42 hücre
  const remainingCells = totalCells - calendarDays.length
  for (let i = 0; i < remainingCells; i++) {
    calendarDays.push(null)
  }

  return calendarDays
}

// Gün isimlerini getiren yardımcı fonksiyon
const getWeekdayNames = (locale = "tr-TR", format: "narrow" | "short" | "long" = "narrow"): string[] => {
  const days: string[] = []
  const date = new Date(2023, 0, 2) // 2 Ocak 2023 Pazartesi

  for (let i = 0; i < 7; i++) {
    days.push(date.toLocaleDateString(locale, { weekday: format }))
    date.setDate(date.getDate() + 1)
  }

  return days
}

// İki tarihin aynı gün olup olmadığını kontrol eden yardımcı fonksiyon
const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  )
}

export function CustomCalendar({ selected, onSelect, className, locale = "tr-TR" }: CustomCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [days, setDays] = useState<(Date | null)[]>([])
  const today = new Date() // Bugünün tarihini sakla

  // Seçili tarih varsa, o aya git
  useEffect(() => {
    if (selected) {
      setCurrentMonth(selected.getMonth())
      setCurrentYear(selected.getFullYear())
    }
  }, [selected])

  // Ay veya yıl değiştiğinde takvim günlerini güncelle
  useEffect(() => {
    setDays(getCalendarDays(currentYear, currentMonth))
  }, [currentYear, currentMonth])

  // Türkçe gün isimleri
  const weekdayNames = getWeekdayNames(locale, "narrow")

  // Türkçe ay ismi
  const monthName = new Date(currentYear, currentMonth).toLocaleDateString(locale, { month: "long" })

  // Önceki aya git - Doğrudan fonksiyon olarak tanımla
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentYear(currentYear - 1)
      setCurrentMonth(11) // Aralık
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  // Sonraki aya git - Doğrudan fonksiyon olarak tanımla
  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentYear(currentYear + 1)
      setCurrentMonth(0) // Ocak
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  // Gün seçildiğinde
  const handleDayClick = (day: Date | null) => {
    if (day && onSelect) {
      onSelect(day)
    }
  }

  // Bir tarihin bugün olup olmadığını kontrol et
  const isToday = (date: Date | null): boolean => {
    if (!date) return false
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  return (
    <div className={cn("p-4 bg-background rounded-lg shadow-lg", className)} onClick={(e) => e.stopPropagation()}>
      {/* Takvim Başlığı ve Navigasyon */}
      <div className="flex justify-between items-center mb-4">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="p-2 rounded-full hover:bg-muted transition-colors duration-200 cursor-pointer"
          aria-label="Önceki Ay"
        >
          <ChevronLeft className="h-5 w-5 text-muted-foreground" />
        </button>
        <h2 className="text-lg font-medium text-foreground capitalize">
          {monthName} {currentYear}
        </h2>
        <button
          type="button"
          onClick={handleNextMonth}
          className="p-2 rounded-full hover:bg-muted transition-colors duration-200 cursor-pointer"
          aria-label="Sonraki Ay"
        >
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      {/* Gün Başlıkları */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekdayNames.map((name, index) => (
          <div
            key={index}
            className="text-center text-sm font-medium text-muted-foreground w-10 h-10 flex items-center justify-center"
          >
            {name}
          </div>
        ))}
      </div>

      {/* Takvim Günleri */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          const isCurrentDay = isToday(day)
          const isSelectedDay = selected && day && isSameDay(selected, day)

          return (
            <button
              key={index}
              type="button"
              onClick={() => handleDayClick(day)}
              disabled={!day}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-sm transition-colors duration-200",
                !day && "text-muted-foreground/40 cursor-not-allowed", // Geçersiz günler
                day && "text-foreground hover:bg-primary/80 hover:text-primary-foreground", // Geçerli günler
                isSelectedDay && "bg-primary text-primary-foreground font-medium", // Seçili gün
                isCurrentDay && !isSelectedDay && "border-2 border-primary text-primary font-medium", // Bugün (seçili değilse)
              )}
            >
              {day ? day.getDate() : ""}
            </button>
          )
        })}
      </div>
    </div>
  )
}
