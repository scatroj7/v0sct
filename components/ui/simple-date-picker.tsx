"use client"

import { useState, useRef, useEffect } from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { tr } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { CustomCalendar } from "./custom-calendar"

interface SimpleDatePickerProps {
  selected: Date | null
  onSelect: (date: Date | null) => void
  locale?: any
  className?: string
}

export function SimpleDatePicker({ selected, onSelect, locale = tr, className }: SimpleDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleSelect = (date: Date | null) => {
    onSelect(date)
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
        variant={"outline"}
        onClick={() => setIsOpen(!isOpen)}
        className={cn("w-full justify-start text-left font-normal", !selected && "text-muted-foreground", className)}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {selected ? format(selected, "PPP", { locale }) : "Tarih seçin"}
      </Button>

      {isOpen && (
        <div className="absolute z-50 mt-2 bg-background rounded-lg shadow-lg p-0 w-auto min-w-[350px]">
          <CustomCalendar selected={selected} onSelect={handleSelect} locale="tr-TR" />
        </div>
      )}
    </div>
  )
}
