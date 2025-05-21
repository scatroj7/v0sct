"use client"

import { useState, useRef, useEffect } from "react"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { BasicCalendar } from "./basic-calendar"

interface BasicDatePickerProps {
  value: Date | null
  onChange: (date: Date | null) => void
  className?: string
}

export function BasicDatePicker({ value, onChange, className }: BasicDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Tarih seçildiğinde
  const handleSelect = (date: Date) => {
    console.log("Tarih seçildi (DatePicker):", date)
    onChange(date)
    setIsOpen(false)
  }

  // Dışarı tıklandığında kapat
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick)
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick)
    }
  }, [isOpen])

  return (
    <div className="relative" ref={containerRef}>
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className={cn("w-full justify-start text-left font-normal", !value && "text-muted-foreground", className)}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {value ? format(value, "PPP", { locale: tr }) : "Tarih seçin"}
      </Button>

      {isOpen && (
        <div className="absolute z-50 mt-2">
          <BasicCalendar value={value || undefined} onChange={handleSelect} />
        </div>
      )}
    </div>
  )
}
