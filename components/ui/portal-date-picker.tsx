"use client"

import { useState, useRef, useEffect } from "react"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Portal } from "./portal"
import { PortalCalendar } from "./portal-calendar"

interface PortalDatePickerProps {
  value: Date | null
  onChange: (date: Date | null) => void
  className?: string
}

export function PortalDatePicker({ value, onChange, className }: PortalDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState<{ top: number; left: number } | undefined>(undefined)
  const buttonRef = useRef<HTMLButtonElement>(null)

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
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen])

  // Buton pozisyonunu hesapla
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setPosition({
        top: rect.bottom + window.scrollY + 5, // 5px ekstra boşluk
        left: rect.left + window.scrollX,
      })
    }
  }, [isOpen])

  return (
    <div className={className || ""}>
      <Button
        type="button"
        variant="outline"
        className="w-full justify-start text-left font-normal"
        onClick={() => setIsOpen(!isOpen)}
        ref={buttonRef}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {value ? format(value, "PPP", { locale: tr }) : "Tarih seçin"}
      </Button>

      {isOpen && (
        <Portal>
          {/* Tam ekran overlay - z-index: 40 */}
          <div className="fixed inset-0 bg-black/20 z-40" onClick={handleClose} />

          {/* Takvim - z-index: 50 */}
          <div className="z-50 absolute" style={{ top: position?.top || 0, left: position?.left || 0 }}>
            <PortalCalendar value={value || undefined} onChange={handleSelect} />
          </div>
        </Portal>
      )}
    </div>
  )
}
