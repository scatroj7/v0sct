"use client"

import type React from "react"
import { useState } from "react"

interface InlineCalendarProps {
  value?: Date
  onChange?: (date: Date) => void
  onClose?: () => void
}

export function InlineCalendar({ value, onChange, onClose }: InlineCalendarProps) {
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
      days.push(<div key={`empty-${i}`} style={{ width: 36, height: 36 }}></div>)
    }

    // Bu ayın günlerini ekle
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentYear, currentMonth, i)
      const isCurrentDay = isToday(date)
      const isSelectedDay = isSelected(date)

      days.push(
        <button
          key={`day-${i}`}
          type="button"
          onClick={(e) => handleDateClick(date, e)}
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            backgroundColor: isSelectedDay ? "var(--primary)" : "transparent",
            color: isSelectedDay ? "white" : isCurrentDay ? "var(--primary)" : "inherit",
            border: isCurrentDay && !isSelectedDay ? "1px solid var(--primary)" : "none",
            outline: "none",
            margin: 2,
            padding: 0,
            fontSize: 14,
          }}
        >
          {i}
        </button>,
      )
    }

    return days
  }

  return (
    <div
      style={{
        padding: 16,
        backgroundColor: "var(--background)",
        borderRadius: 8,
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
        width: 300,
        userSelect: "none",
      }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Takvim başlığı ve navigasyon */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <button
          type="button"
          onClick={goToPreviousMonth}
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            padding: 8,
            borderRadius: "50%",
            cursor: "pointer",
            backgroundColor: "transparent",
            border: "none",
            outline: "none",
          }}
        >
          &lt;
        </button>
        <h2 style={{ fontSize: 18, fontWeight: 500 }}>
          {monthNames[currentMonth]} {currentYear}
        </h2>
        <button
          type="button"
          onClick={goToNextMonth}
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            padding: 8,
            borderRadius: "50%",
            cursor: "pointer",
            backgroundColor: "transparent",
            border: "none",
            outline: "none",
          }}
        >
          &gt;
        </button>
      </div>

      {/* Gün başlıkları */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 4,
          marginBottom: 8,
        }}
      >
        {dayNames.map((day, index) => (
          <div
            key={index}
            style={{
              textAlign: "center",
              fontSize: 14,
              fontWeight: 500,
              color: "var(--muted-foreground)",
            }}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Takvim günleri */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 4,
        }}
      >
        {renderDays()}
      </div>
    </div>
  )
}
