"use client"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { DatePickerWrapper } from "./date-picker-wrapper"

interface DatePickerProps {
  date: Date | undefined
  setDate: (date: Date | undefined) => void
  className?: string
  placeholder?: string
}

export function DatePicker({ date, setDate, className, placeholder = "Tarih seçin" }: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground", className)}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP", { locale: tr }) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <DatePickerWrapper>
          <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
        </DatePickerWrapper>
      </PopoverContent>
    </Popover>
  )
}
