"use client"

import type React from "react"
import { useState } from "react"

interface PortalCalendarProps {
  value?: Date
  onChange?: (date: Date) => void
}

export function PortalCalendar({ value, onChange }: PortalCalendarProps) {
  // Başlangıç tarihi olarak bugünü veya seçili tarihi kullan
  const [viewDate, setViewDate] = useState(value || new Date())

  // Ay ve yıl bilgilerini al
  const currentMonth = viewDate.getMonth()
  const currentYear = viewDate.getFullYear()

  // Türkçe ay adları
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

  // Türkçe gün adları
  const dayNames = ["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pz"]

  // Önceki aya git
  const goToPreviousMonth = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    console.log("Önceki ay")

    const newDate = new Date(viewDate)
    newDate.setMonth(currentMonth - 1)
    setViewDate(newDate)
  }

  // Sonraki aya git
  const goToNextMonth = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    console.log("Sonraki ay")

    const newDate = new Date(viewDate)
    newDate.setMonth(currentMonth + 1)
    setViewDate(newDate)
  }

  // Takvim günlerini oluştur
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (year: number, month: number) => {
    let firstDay = new Date(year, month, 1).getDay()
    // Pazartesi'yi haftanın ilk günü yap
    if (firstDay === 0) firstDay = 6
    else firstDay--
    return firstDay
  }

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
  const handleDateClick = (date: Date, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    console.log("Tarih seçildi:", date)
    if (onChange) {
      onChange(date)
    }
  }

  // Takvim günlerini render et
  const renderDays = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth)
    const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth)

    const days = []

    // Önceki ayın günlerini ekle
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="w-9 h-9"></div>)
    }

    // Bu ayın günlerini ekle
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentYear, currentMonth, i)
      const isCurrentDay = isToday(date)
      const isSelectedDay = isSelected(date)

      days.push(
        <div
          key={`day-${i}`}
          className={`
            w-9 h-9 rounded-full flex items-center justify-center text-sm cursor-pointer
            ${isSelectedDay ? "bg-primary text-primary-foreground" : ""}
            ${isCurrentDay && !isSelectedDay ? "border border-primary text-primary" : ""}
            hover:bg-muted
          `}
          onClick={(e) => handleDateClick(date, e)}
        >
          {i}
        </div>,
      )
    }

    return days
  }

  return (
    <div className="bg-background border rounded-lg shadow-lg p-4" onClick={(e) => e.stopPropagation()}>
      {/* Takvim başlığı ve navigasyon */}
      <div className="flex justify-between items-center mb-4">
        <button type="button" className="p-2 rounded-full hover:bg-muted cursor-pointer" onClick={goToPreviousMonth}>
          &lt;
        </button>
        <h2 className="text-lg font-medium">
          {monthNames[currentMonth]} {currentYear}
        </h2>
        <button type="button" className="p-2 rounded-full hover:bg-muted cursor-pointer" onClick={goToNextMonth}>
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
      <div className="grid grid-cols-7 gap-1">{renderDays()}</div>
    </div>
  )
}
