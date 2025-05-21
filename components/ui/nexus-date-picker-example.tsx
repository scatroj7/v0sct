"use client"

import { useState } from "react"
import { NexusDatePicker } from "./nexus-date-picker"

export function NexusDatePickerExample() {
  const [date, setDate] = useState<Date | null>(new Date())

  const handleApply = () => {
    console.log("Tarih uygulandı:", date)
    // Burada tarih ile ilgili işlemler yapabilirsiniz
  }

  return (
    <div className="p-4 bg-gray-950 min-h-screen flex items-center justify-center">
      <NexusDatePicker value={date} onChange={setDate} onApply={handleApply} />
    </div>
  )
}
