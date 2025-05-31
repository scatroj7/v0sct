"use client"

import * as React from "react"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface DatePickerProps {
  date?: Date
  onSelect?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function DatePicker({ date, onSelect, placeholder = "Tarih seçin", disabled, className }: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [currentMonth, setCurrentMonth] = React.useState(date || new Date())

  const daysOfWeek = ["Pz", "Pt", "Sa", "Ça", "Pe", "Cu", "Ct"]

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7 // Monday = 0

    const days = []

    // Previous month's days
    const prevMonth = new Date(year, month - 1, 0)
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: prevMonth.getDate() - i,
        isCurrentMonth: false,
        fullDate: new Date(year, month - 1, prevMonth.getDate() - i),
      })
    }

    // Current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        date: day,
        isCurrentMonth: true,
        fullDate: new Date(year, month, day),
      })
    }

    // Next month's days
    const remainingDays = 42 - days.length
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        date: day,
        isCurrentMonth: false,
        fullDate: new Date(year, month + 1, day),
      })
    }

    return days
  }

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev)
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const selectDate = (selectedDate: Date) => {
    onSelect?.(selectedDate)
    setOpen(false)
  }

  const isSelected = (dayDate: Date) => {
    if (!date) return false
    return dayDate.toDateString() === date.toDateString()
  }

  const isToday = (dayDate: Date) => {
    const today = new Date()
    return dayDate.toDateString() === today.toDateString()
  }

  const days = getDaysInMonth(currentMonth)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal h-10 px-3 py-2",
            !date && "text-muted-foreground",
            "hover:bg-accent hover:text-accent-foreground",
            "focus:ring-2 focus:ring-ring focus:ring-offset-2",
            "dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100",
            "dark:hover:bg-gray-700 dark:hover:text-gray-100",
            className,
          )}
          disabled={disabled}
          type="button"
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
          {date ? (
            <span className="text-gray-900 dark:text-gray-100">{format(date, "dd MMMM yyyy", { locale: tr })}</span>
          ) : (
            <span className="text-gray-500 dark:text-gray-400">{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600"
        align="start"
      >
        <div className="space-y-4">
          {/* Header with navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth("prev")}
              className="h-8 w-8 p-0 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <h2 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {format(currentMonth, "MMMM yyyy", { locale: tr })}
            </h2>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth("next")}
              className="h-8 w-8 p-0 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-1">
            {daysOfWeek.map((day) => (
              <div
                key={day}
                className="h-8 w-8 flex items-center justify-center text-xs font-medium text-gray-500 dark:text-gray-400"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                onClick={() => selectDate(day.fullDate)}
                className={cn(
                  "h-8 w-8 p-0 font-normal",
                  !day.isCurrentMonth && "text-gray-400 dark:text-gray-600",
                  day.isCurrentMonth && "text-gray-900 dark:text-gray-100",
                  isSelected(day.fullDate) &&
                    "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:text-white",
                  isToday(day.fullDate) && !isSelected(day.fullDate) && "bg-gray-100 dark:bg-gray-700",
                  "hover:bg-gray-100 dark:hover:bg-gray-700",
                )}
              >
                {day.date}
              </Button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
