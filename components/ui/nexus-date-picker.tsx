"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react"

interface NexusDatePickerProps {
  value: Date | null
  onChange: (date: Date) => void
  className?: string
  label?: string
  buttonText?: string
  onApply?: () => void
}

export function NexusDatePicker({
  value,
  onChange,
  className = "",
  label = "Tarih Seç",
  buttonText = "Tarih Uygula",
  onApply,
}: NexusDatePickerProps) {
  const [currentDate, setCurrentDate] = useState(value || new Date())
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Get days in month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  // Get day of week of first day in month
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay()
  }

  // Format date as DD.MM.YYYY
  const formatDate = (date: Date | null) => {
    if (!date) return ""
    const day = date.getDate().toString().padStart(2, "0")
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const year = date.getFullYear()
    return `${day}.${month}.${year}`
  }

  // Previous month
  const prevMonth = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  // Next month
  const nextMonth = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  // Select day
  const selectDay = (day: number, e: React.MouseEvent) => {
    e.stopPropagation()
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    onChange(newDate)
    setIsOpen(false)
  }

  // Toggle calendar
  const toggleCalendar = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isOpen && value) {
      setCurrentDate(value)
    }
    setIsOpen(!isOpen)
  }

  // Handle apply button
  const handleApply = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onApply) {
      onApply()
    }
    setIsOpen(false)
  }

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen])

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node) && isOpen) {
        // Eğer tıklama takvim dışında bir yere yapıldıysa kapat
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  // Render calendar directly in the component instead of using Portal
  const renderCalendar = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const daysInMonth = getDaysInMonth(year, month)
    const firstDayOfMonth = getFirstDayOfMonth(year, month)

    const days = []
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

    // Add empty cells for days before the first day of month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="w-8 h-8"></div>)
    }

    // Add days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const isSelected =
        value &&
        date.getDate() === value.getDate() &&
        date.getMonth() === value.getMonth() &&
        date.getFullYear() === value.getFullYear()
      const isToday =
        date.getDate() === new Date().getDate() &&
        date.getMonth() === new Date().getMonth() &&
        date.getFullYear() === new Date().getFullYear()

      days.push(
        <div
          key={day}
          className={`w-8 h-8 flex items-center justify-center rounded-full cursor-pointer text-sm
                      ${isSelected ? "bg-cyan-500 text-white" : "hover:bg-gray-700"}
                      ${isToday && !isSelected ? "border border-cyan-500" : ""}`}
          onClick={(e) => selectDay(day, e)}
        >
          {day}
        </div>,
      )
    }

    return (
      <div
        className="absolute top-full left-0 mt-1 bg-gray-900 border border-gray-700 rounded-lg p-4 shadow-lg z-50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <button className="text-cyan-500 hover:text-cyan-400 p-1" onClick={prevMonth} type="button">
            <ChevronLeft size={16} />
          </button>
          <div className="text-white font-medium">
            {monthNames[month]} {year}
          </div>
          <button className="text-cyan-500 hover:text-cyan-400 p-1" onClick={nextMonth} type="button">
            <ChevronRight size={16} />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Pz", "Pt", "Sa", "Çr", "Pr", "Cu", "Ct"].map((day, index) => (
            <div key={index} className="w-8 h-8 flex items-center justify-center text-gray-400 text-xs">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 text-gray-200">{days}</div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label ? (
        <div className="bg-gray-900 p-6 rounded-lg border border-gray-800 w-full max-w-md mx-auto shadow-lg">
          <h2 className="text-cyan-500 font-bold text-lg mb-4 flex items-center">
            <Calendar className="mr-2" size={18} />
            NEXUS OS - Tarih Seçici
          </h2>

          <div className="mb-4">
            <label className="block text-gray-400 text-sm mb-2">{label}</label>
            <div className="relative">
              <div
                className="bg-gray-800 border border-gray-700 rounded px-4 py-2 w-full text-white cursor-pointer flex justify-between items-center hover:border-cyan-500 transition-colors"
                onClick={toggleCalendar}
              >
                <span>{value ? formatDate(value) : "Tarih seçiniz"}</span>
                <Calendar size={16} className="text-cyan-500" />
              </div>
              {isOpen && renderCalendar()}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-md text-sm transition-colors"
              onClick={handleApply}
              type="button"
            >
              {buttonText}
            </button>
          </div>
        </div>
      ) : (
        <div className="relative">
          <div
            className="bg-background border border-input rounded px-3 py-2 w-full text-foreground cursor-pointer flex justify-between items-center hover:border-primary transition-colors"
            onClick={toggleCalendar}
          >
            <span>{value ? formatDate(value) : "Tarih seçiniz"}</span>
            <Calendar size={16} className="text-muted-foreground" />
          </div>
          {isOpen && renderCalendar()}
        </div>
      )}
    </div>
  )
}
