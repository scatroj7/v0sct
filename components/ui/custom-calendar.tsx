"use client"

import { useState, useEffect, useCallback } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { getCalendarDays, getWeekdayNames, isSameDay } from "@/lib/calendar-utils"

export interface CustomCalendarProps {
  selected?: Date | null
  onSelect?: (date: Date | null) => void
  className?: string
  locale?: string
}

export function CustomCalendar({ selected, onSelect, className, locale = "tr-TR" }: CustomCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [days, setDays] = useState<(Date | null)[]>([])

  // Initialize with selected date if provided
  useEffect(() => {
    if (selected) {
      setCurrentMonth(selected.getMonth())
      setCurrentYear(selected.getFullYear())
    }
  }, [])

  // Update calendar days when month or year changes
  useEffect(() => {
    setDays(getCalendarDays(currentYear, currentMonth))
  }, [currentYear, currentMonth])

  // Get weekday names in Turkish
  const weekdayNames = getWeekdayNames(locale, "narrow")

  // Get month name in Turkish
  const monthName = new Date(currentYear, currentMonth).toLocaleDateString(locale, { month: "long" })

  // Navigate to previous month
  const handlePrevMonth = useCallback(() => {
    setCurrentMonth((prevMonth) => {
      if (prevMonth === 0) {
        setCurrentYear((prevYear) => prevYear - 1)
        return 11 // December
      }
      return prevMonth - 1
    })
  }, [])

  // Navigate to next month
  const handleNextMonth = useCallback(() => {
    setCurrentMonth((prevMonth) => {
      if (prevMonth === 11) {
        setCurrentYear((prevYear) => prevYear + 1)
        return 0 // January
      }
      return prevMonth + 1
    })
  }, [])

  // Handle day selection
  const handleDayClick = useCallback(
    (day: Date | null) => {
      if (day && onSelect) {
        onSelect(day)
      }
    },
    [onSelect],
  )

  return (
    <div className={cn("p-3 bg-background rounded-lg shadow-sm", className)}>
      {/* Calendar Header and Navigation */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={handlePrevMonth}
          className="p-2 rounded-full hover:bg-muted transition-colors duration-200"
          aria-label="Önceki Ay"
        >
          <ChevronLeft className="h-5 w-5 text-muted-foreground" />
        </button>
        <h2 className="text-lg font-medium text-foreground capitalize">
          {monthName} {currentYear}
        </h2>
        <button
          onClick={handleNextMonth}
          className="p-2 rounded-full hover:bg-muted transition-colors duration-200"
          aria-label="Sonraki Ay"
        >
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      {/* Weekday Headers */}
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

      {/* Calendar Days */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => (
          <button
            key={index}
            onClick={() => handleDayClick(day)}
            disabled={!day}
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center text-sm transition-colors duration-200",
              !day && "text-muted-foreground/40 cursor-not-allowed", // Invalid days
              day && "text-foreground hover:bg-primary/80 hover:text-primary-foreground", // Valid days
              selected && day && isSameDay(selected, day) && "bg-primary text-primary-foreground font-medium", // Selected day
              day && isSameDay(new Date(), day) && "border border-primary text-primary font-medium", // Today
            )}
          >
            {day ? day.getDate() : ""}
          </button>
        ))}
      </div>
    </div>
  )
}
