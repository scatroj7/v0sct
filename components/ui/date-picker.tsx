"use client"

import { format } from "date-fns"
import { CalendarIcon } from 'lucide-react'
import { tr } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CustomCalendar } from "./custom-calendar"

interface DatePickerProps {
  selected: Date | null
  onSelect: (date: Date | null) => void
  locale?: any
  className?: string
}

export function DatePicker({ selected, onSelect, locale = tr, className }: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn("w-full justify-start text-left font-normal", !selected && "text-muted-foreground", className)}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selected ? format(selected, "PPP", { locale }) : "Tarih seçin"}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto min-w-[350px] p-0" 
        align="start"
        // Add this to prevent closing when clicking inside
        onInteractOutside={(e) => {
          // Only close if clicking outside the popover
          const target = e.target as HTMLElement
          if (target.closest('.custom-calendar-container')) {
            e.preventDefault()
          }
        }}
      >
        <div className="custom-calendar-container" onClick={(e) => e.stopPropagation()}>
          <CustomCalendar selected={selected} onSelect={onSelect} locale="tr-TR" />
        </div>
      </PopoverContent>
    </Popover>
  )
}
