// Calendar utility functions
export const getCalendarDays = (year: number, month: number): (Date | null)[] => {
  const date = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // Adjust for week starting on Monday
  let firstDayOfWeek = date.getDay() // 0 (Sunday) - 6 (Saturday)
  if (firstDayOfWeek === 0)
    firstDayOfWeek = 6 // Make Sunday the last day
  else firstDayOfWeek-- // Make Monday 0, Tuesday 1, etc.

  const calendarDays: (Date | null)[] = []

  // Add empty spaces for previous month
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarDays.push(null)
  }

  // Add current month days
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(new Date(year, month, i))
  }

  // Add empty spaces for next month to complete the grid
  const totalCells = 42 // 6 weeks * 7 days
  const remainingCells = totalCells - calendarDays.length
  for (let i = 0; i < remainingCells; i++) {
    calendarDays.push(null)
  }

  return calendarDays
}

export const getWeekdayNames = (locale = "tr-TR", format: "narrow" | "short" | "long" = "narrow"): string[] => {
  const days: string[] = []
  // January 1, 2023 was a Sunday, so we start from January 2 (Monday)
  const date = new Date(2023, 0, 2)

  for (let i = 0; i < 7; i++) {
    days.push(date.toLocaleDateString(locale, { weekday: format }))
    date.setDate(date.getDate() + 1)
  }

  return days
}

export const isSameDay = (date1: Date | null, date2: Date | null): boolean => {
  if (!date1 || !date2) return false
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}
