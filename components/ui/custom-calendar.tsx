"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from 'lucide-react'
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
  const today = new Date() // Store today's date for comparison

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
  const handlePrevMonth = (e: React.MouseEvent) => {
    // Stop event propagation to prevent the popover from closing
    e.preventDefault()
    e.stopPropagation()
    
    if (currentMonth === 0) {
      setCurrentYear(currentYear - 1)
      setCurrentMonth(11) // December
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  // Navigate to next month
  const handleNextMonth = (e: React.MouseEvent) => {
    // Stop event propagation to prevent the popover from closing
    e.preventDefault()
    e.stopPropagation()
    
    if (currentMonth === 11) {
      setCurrentYear(currentYear + 1)
      setCurrentMonth(0) // January
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  // Handle day selection
  const handleDayClick = (day: Date | null) => {
    if (day && onSelect) {
      onSelect(day)
    }
  }

  // Check if a date is today
  const isToday = (date: Date | null): boolean => {
    if (!date) return false
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  return (
    <div className={cn("p-3 bg-background rounded-lg shadow-sm", className)}>
      {/* Calendar Header and Navigation */}
      <div className="flex justify-between items-center mb-4">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="p-2 rounded-full hover:bg-muted transition-colors duration-200"
          aria-label="Önceki Ay"
          // Add mousedown event to prevent focus which can trigger popover close
          onMouseDown={(e) => e.preventDefault()}
        >
          <ChevronLeft className="h-5 w-5 text-muted-foreground" />
        </button>
        <h2 className="text-lg font-medium text-foreground capitalize">
          {monthName} {currentYear}
        </h2>
        <button
          type="button"
          onClick={handleNextMonth}
          className="p-2 rounded-full hover:bg-muted transition-colors duration-200"
          aria-label="Sonraki Ay"
          // Add mousedown event to prevent focus which can trigger popover close
          onMouseDown={(e) => e.preventDefault()}
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
                !day && "text-muted-foreground/40 cursor-not-allowed", // Invalid days
                day && "text-foreground hover:bg-primary/80 hover:text-primary-foreground", // Valid days
                isSelectedDay && "bg-primary text-primary-foreground font-medium", // Selected day
                isCurrentDay && !isSelectedDay && "border-2 border-primary text-primary font-medium", // Today (not selected)
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
