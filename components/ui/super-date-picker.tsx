"use client"

import { useState, useRef, useEffect } from "react"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SuperCalendar } from "./super-calendar"

interface SuperDatePickerProps {
  value: Date | null
  onChange: (date: Date | null) => void
  className?: string
}

export function SuperDatePicker({ value, onChange, className }: SuperDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Tarih seçildiğinde
  const handleSelect = (date: Date) => {
    console.log("Tarih seçildi (DatePicker):", date)
    onChange(date)
    setIsOpen(false)
  }

  // Takvimi kapat
  const handleClose = () => {
    setIsOpen(false)
  }

  // ESC tuşuna basıldığında kapat
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscKey)
    }

    return () => {
      document.removeEventListener("keydown", handleEscKey)
    }
  }, [isOpen])

  return (
    <div className={`relative ${className || ""}`} ref={containerRef}>
      <Button
        type="button"
        variant="outline"
        className="w-full justify-start text-left font-normal"
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {value ? format(value, "PPP", { locale: tr }) : "Tarih seçin"}
      </Button>

      {isOpen && (
        <div className="absolute mt-2 left-0" style={{ zIndex: 9999 }}>
          <SuperCalendar value={value || undefined} onChange={handleSelect} onClose={handleClose} />
        </div>
      )}
    </div>
  )
}
