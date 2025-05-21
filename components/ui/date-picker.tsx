"use client"

import { useState } from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { tr } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { CustomCalendar } from "./custom-calendar"
import { CustomModal } from "./custom-modal"

interface DatePickerProps {
  selected: Date | null
  onSelect: (date: Date | null) => void
  locale?: any
  className?: string
}

export function DatePicker({ selected, onSelect, locale = tr, className }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleSelect = (date: Date | null) => {
    onSelect(date)
    setIsOpen(false)
  }

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      onOpen={() => setIsOpen(true)}
      trigger={
        <Button
          type="button"
          variant={"outline"}
          className={cn("w-full justify-start text-left font-normal", !selected && "text-muted-foreground", className)}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selected ? format(selected, "PPP", { locale }) : "Tarih seçin"}
        </Button>
      }
      className="w-auto min-w-[350px] p-0"
    >
      <CustomCalendar selected={selected} onSelect={handleSelect} locale="tr-TR" />
    </CustomModal>
  )
}
