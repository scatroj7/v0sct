"use client"

import React from "react"
import { NexusDatePicker } from "@/components/ui/nexus-date-picker"

type InvestmentsTabProps = {}

const InvestmentsTab: React.FC<InvestmentsTabProps> = ({}) => {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(undefined)

  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date)
  }

  return (
    <div>
      <h1>Investments Tab</h1>
      <p>This is the investments tab content.</p>

      <div>
        <label>Select a Date:</label>
        <NexusDatePicker value={selectedDate} onChange={handleDateChange} className="p-0" label="" buttonText="Seç" />
      </div>

      {selectedDate && <p>Selected Date: {selectedDate.toLocaleDateString()}</p>}
    </div>
  )
}

export default InvestmentsTab
