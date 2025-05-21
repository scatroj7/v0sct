"use client"

import React from "react"
import { NexusDatePicker } from "@/components/ui/nexus-date-picker"

const BudgetsTab = () => {
  const [startDate, setStartDate] = React.useState<Date | null>(null)

  return (
    <div>
      <h1>Budgets Tab</h1>
      <div>
        <label>Start Date:</label>
        <NexusDatePicker value={startDate} onChange={setStartDate} className="p-0" label="" buttonText="Seç" />
      </div>
    </div>
  )
}

export default BudgetsTab
