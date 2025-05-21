"use client"

import type React from "react"

import { useState, useEffect } from "react"

interface SuperCalendarProps {
  value?: Date
  onChange?: (date: Date) => void
  onClose?: () => void
}

export function SuperCalendar({ value, onChange, onClose }: SuperCalendarProps) {
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
  const handleDateClick = (date: Date) => {
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
            ${isSelectedDay ? "bg-blue-600 text-white" : ""}
            ${isCurrentDay && !isSelectedDay ? "border border-blue-500 text-blue-500" : ""}
            hover:bg-gray-200 dark:hover:bg-gray-700
          `}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleDateClick(date)
          }}
        >
          {i}
        </div>,
      )
    }

    return days
  }

  // Takvim dışına tıklandığında kapat
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest(".super-calendar-container")) {
        return
      }
      if (onClose) {
        onClose()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [onClose])

  return (
    <div
      className="super-calendar-container bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg"
      style={{ zIndex: 9999 }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Takvim başlığı ve navigasyon */}
      <div className="flex justify-between items-center mb-4">
        <button
          type="button"
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          onClick={goToPreviousMonth}
        >
          &lt;
        </button>
        <h2 className="text-lg font-medium">
          {monthNames[currentMonth]} {currentYear}
        </h2>
        <button
          type="button"
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          onClick={goToNextMonth}
        >
          &gt;
        </button>
      </div>

      {/* Gün başlıkları */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day, index) => (
          <div key={index} className="text-center text-sm font-medium text-gray-500 dark:text-gray-400">
            {day}
          </div>
        ))}
      </div>

      {/* Takvim günleri */}
      <div className="grid grid-cols-7 gap-1">{renderDays()}</div>
    </div>
  )
}
