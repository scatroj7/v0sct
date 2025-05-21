"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface BasicCalendarProps {
  value?: Date
  onChange?: (date: Date) => void
  className?: string
}

export function BasicCalendar({ value, onChange, className }: BasicCalendarProps) {
  // Başlangıç tarihi olarak bugünü veya seçili tarihi kullan
  const [currentDate, setCurrentDate] = useState(value || new Date())

  // Seçili tarih değiştiğinde güncelle
  useEffect(() => {
    if (value) {
      setCurrentDate(new Date(value))
    }
  }, [value])

  // Ay ve yıl bilgilerini al
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()

  // Önceki aya git
  const goToPreviousMonth = () => {
    const newDate = new Date(currentDate)
    newDate.setMonth(currentMonth - 1)
    setCurrentDate(newDate)
  }

  // Sonraki aya git
  const goToNextMonth = () => {
    const newDate = new Date(currentDate)
    newDate.setMonth(currentMonth + 1)
    setCurrentDate(newDate)
  }

  // Ayın ilk gününü al
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1)

  // Ayın son gününü al
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0)

  // Ayın gün sayısını al
  const daysInMonth = lastDayOfMonth.getDate()

  // Ayın ilk gününün haftanın hangi günü olduğunu al (0: Pazar, 1: Pazartesi, ...)
  let firstDayOfWeek = firstDayOfMonth.getDay()
  // Pazartesi'yi haftanın ilk günü yap
  if (firstDayOfWeek === 0) firstDayOfWeek = 6
  else firstDayOfWeek--

  // Takvim günlerini oluştur
  const calendarDays = []

  // Önceki ayın günlerini ekle
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarDays.push(null)
  }

  // Bu ayın günlerini ekle
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(new Date(currentYear, currentMonth, i))
  }

  // Türkçe ay adını al
  const monthNames = [
    "Ocak",
    "Şubat",
    "Mart",
    "Nisan",
    "Mayıs",
    "Haziran",
    "Temmuz",
    "Ağustos",
    "Eylül",
    "Ekim",
    "Kasım",
    "Aralık",
  ]

  // Türkçe gün adlarını al
  const dayNames = ["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pz"]

  // Bir tarihin bugün olup olmadığını kontrol et
  const isToday = (date: Date) => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  // Bir tarihin seçili olup olmadığını kontrol et
  const isSelected = (date: Date) => {
    return (
      value &&
      date.getDate() === value.getDate() &&
      date.getMonth() === value.getMonth() &&
      date.getFullYear() === value.getFullYear()
    )
  }

  // Bir gün seçildiğinde
  const handleDateClick = (date: Date) => {
    console.log("Tarih seçildi:", date)
    if (onChange) {
      onChange(date)
    }
  }

  return (
    <div className={cn("p-4 bg-background rounded-lg shadow-lg", className)}>
      {/* Takvim başlığı ve navigasyon */}
      <div className="flex justify-between items-center mb-4">
        <button
          type="button"
          onClick={goToPreviousMonth}
          className="p-2 rounded-full hover:bg-muted transition-colors duration-200 cursor-pointer"
        >
          &lt;
        </button>
        <h2 className="text-lg font-medium">
          {monthNames[currentMonth]} {currentYear}
        </h2>
        <button
          type="button"
          onClick={goToNextMonth}
          className="p-2 rounded-full hover:bg-muted transition-colors duration-200 cursor-pointer"
        >
          &gt;
        </button>
      </div>

      {/* Gün başlıkları */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day, index) => (
          <div key={index} className="text-center text-sm font-medium text-muted-foreground">
            {day}
          </div>
        ))}
      </div>

      {/* Takvim günleri */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => (
          <div key={index} className="p-1">
            {day ? (
              <button
                type="button"
                onClick={() => handleDateClick(day)}
                className={cn(
                  "w-full h-8 rounded-full flex items-center justify-center text-sm",
                  isSelected(day) && "bg-primary text-primary-foreground",
                  isToday(day) && !isSelected(day) && "border border-primary text-primary",
                  "hover:bg-muted cursor-pointer",
                )}
              >
                {day.getDate()}
              </button>
            ) : (
              <div className="w-full h-8"></div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
