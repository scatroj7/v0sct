"use client"

import { useState } from "react"
import { PortalDatePicker } from "./portal-date-picker"

export function DatePickerExample() {
  const [date, setDate] = useState<Date | null>(new Date())

  return (
    <div className="p-4">
      <h2 className="text-lg font-medium mb-4">Tarih Seçici Örneği</h2>
      <div className="max-w-sm">
        <PortalDatePicker value={date} onChange={setDate} />
      </div>
      <div className="mt-4">
        <p>Seçilen Tarih: {date ? date.toLocaleDateString("tr-TR") : "Tarih seçilmedi"}</p>
      </div>
    </div>
  )
}
