"use client"

import { useState, useRef, useEffect } from "react"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { InlineCalendar } from "./inline-calendar"

interface InlineDatePickerProps {
  value: Date | null
  onChange: (date: Date | null) => void
  className?: string
}

export function InlineDatePicker({ value, onChange, className }: InlineDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Tarih seçildiğinde
  const handleSelect = (date: Date) => {
    console.log("Tarih seçildi (DatePicker):", date)
    onChange(date)
    setIsOpen(false)
  }

  // Dışarı tıklandığında kapat
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      // Eğer tıklama container dışında ve buton dışında ise kapat
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      // Capture phase'de dinle, böylece diğer click handler'lardan önce çalışır
      document.addEventListener("click", handleOutsideClick, true)
    }

    return () => {
      document.removeEventListener("click", handleOutsideClick, true)
    }
  }, [isOpen])

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
    <div className={className} style={{ position: "relative" }} ref={containerRef}>
      <Button
        type="button"
        variant="outline"
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        ref={buttonRef}
        style={{
          width: "100%",
          justifyContent: "flex-start",
          textAlign: "left",
          fontWeight: "normal",
          color: value ? "inherit" : "var(--muted-foreground)",
        }}
      >
        <CalendarIcon style={{ marginRight: 8, height: 16, width: 16 }} />
        {value ? format(value, "PPP", { locale: tr }) : "Tarih seçin"}
      </Button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            zIndex: 50,
            marginTop: 8,
            left: 0,
          }}
        >
          <InlineCalendar value={value || undefined} onChange={handleSelect} onClose={() => setIsOpen(false)} />
        </div>
      )}
    </div>
  )
}
