"use client"

import * as React from "react"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
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
        className="w-auto p-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600"
        align="start"
      >
        <Calendar
          mode="single"
          selected={date}
          onSelect={(selectedDate) => {
            onSelect?.(selectedDate)
            setOpen(false)
          }}
          disabled={disabled}
          initialFocus
          className="dark:bg-gray-800"
          classNames={{
            months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
            month: "space-y-4",
            caption: "flex justify-between items-center pt-1 relative text-gray-900 dark:text-gray-100 px-2",
            caption_label:
              "text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400",
            nav: "space-x-1 flex items-center",
            nav_button: cn(
              "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "disabled:pointer-events-none disabled:opacity-50",
              "border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 w-8",
              "dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600",
            ),
            nav_button_previous: "",
            nav_button_next: "",
            table: "w-full border-collapse space-y-1 mt-4",
            head_row: "flex w-full",
            head_cell:
              "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] dark:text-gray-400 text-center p-1",
            row: "flex w-full mt-2",
            cell: "h-9 w-9 text-center text-sm p-0 relative flex items-center justify-center [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
            day: cn(
              "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "disabled:pointer-events-none disabled:opacity-50",
              "h-9 w-9 p-0 font-normal aria-selected:opacity-100 cursor-pointer",
              "hover:bg-accent hover:text-accent-foreground",
              "dark:text-gray-100 dark:hover:bg-gray-600 dark:hover:text-gray-100",
            ),
            day_range_end: "day-range-end",
            day_selected:
              "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground dark:bg-blue-600 dark:text-white dark:hover:bg-blue-700",
            day_today: "bg-accent text-accent-foreground dark:bg-gray-600 dark:text-gray-100",
            day_outside:
              "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30 dark:text-gray-500",
            day_disabled: "text-muted-foreground opacity-50 dark:text-gray-500",
            day_range_middle:
              "aria-selected:bg-accent aria-selected:text-accent-foreground dark:aria-selected:bg-gray-600",
            day_hidden: "invisible",
          }}
          components={{
            IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
            IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
