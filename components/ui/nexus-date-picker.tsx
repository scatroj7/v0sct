"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface NexusDatePickerProps {
  value: Date | null
  onChange: (date: Date | null) => void
  className?: string
  label?: string
  buttonText?: string
  onApply?: () => void
}

export function NexusDatePicker({
  value,
  onChange,
  className,
  label = "Tarih Seç",
  buttonText = "Tarih Uygula",
  onApply,
}: NexusDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentDate, setCurrentDate] = useState(value || new Date())
  const containerRef = useRef<HTMLDivElement>(null)
  const calendarRef = useRef<HTMLDivElement>(null)

  // Format date as DD.MM.YYYY
  const formatDate = (date: Date | null): string => {
    if (!date) return ""
    return format(date, "dd.MM.yyyy", { locale: tr })
  }

  // Get days in month
  const getDaysInMonth = (year: number, month: number): number => {
    return new Date(year, month + 1, 0).getDate()
  }

  // Get day of week of first day in month
  const getFirstDayOfMonth = (year: number, month: number): number => {
    return new Date(year, month, 1).getDay()
  }

  // Previous month
  const prevMonth = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  // Next month
  const nextMonth = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  // Select day
  const selectDay = (day: number, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    onChange(newDate)
    if (!onApply) {
      setIsOpen(false)
    }
  }

  // Toggle calendar
  const toggleCalendar = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsOpen(!isOpen)
    if (value) {
      setCurrentDate(value)
    }
  }

  // Apply selected date
  const applyDate = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (onApply) {
      onApply()
    }
    setIsOpen(false)
  }

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  // Render calendar
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
      days.push(
        <div key={`empty-${i}`} className="w-8 h-8">
          {" "}
        </div>,
      )
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
                      ${isSelected ? "bg-cyan-500 text-white" : "hover:bg-gray-200 dark:hover:bg-gray-700"}
                      ${isToday && !isSelected ? "border border-cyan-500" : ""}`}
          onClick={(e) => selectDay(day, e)}
          onMouseDown={(e) => e.preventDefault()}
        >
          {day}
        </div>,
      )
    }

    return (
      <div
        ref={calendarRef}
        className="absolute top-full mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-lg z-50"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.preventDefault()}
      >
        <div className="flex justify-between items-center mb-4">
          <button
            className="text-cyan-500 hover:text-cyan-400 p-1"
            onClick={prevMonth}
            onMouseDown={(e) => e.preventDefault()}
          >
            <ChevronLeft size={16} />
          </button>
          <div className="font-medium dark:text-white">
            {monthNames[month]} {year}
          </div>
          <button
            className="text-cyan-500 hover:text-cyan-400 p-1"
            onClick={nextMonth}
            onMouseDown={(e) => e.preventDefault()}
          >
            <ChevronRight size={16} />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Pz", "Pt", "Sa", "Çr", "Pr", "Cu", "Ct"].map((day, index) => (
            <div
              key={index}
              className="w-8 h-8 flex items-center justify-center text-gray-400 text-xs"
              onMouseDown={(e) => e.preventDefault()}
            >
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 text-gray-800 dark:text-gray-200">{days}</div>
        {onApply && (
          <div className="flex justify-end mt-4">
            <button
              className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-md text-sm transition-colors"
              onClick={applyDate}
              onMouseDown={(e) => e.preventDefault()}
            >
              {buttonText}
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      {label && <label className="block text-gray-700 dark:text-gray-400 text-sm mb-2">{label}</label>}
      <div className="relative">
        <div
          className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-4 py-2 w-full text-gray-800 dark:text-white cursor-pointer flex justify-between items-center hover:border-cyan-500 transition-colors"
          onClick={toggleCalendar}
          onMouseDown={(e) => e.preventDefault()}
        >
          <span>{value ? formatDate(value) : "Tarih seçin"}</span>
          <CalendarIcon size={16} className="text-cyan-500" />
        </div>
        {isOpen && renderCalendar()}
      </div>
    </div>
  )
}
