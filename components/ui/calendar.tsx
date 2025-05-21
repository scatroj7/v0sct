"use client"

import type * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { tr } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

// Özel Türkçe locale tanımı - daha ayırt edici gün kısaltmaları için
const customTrLocale = {
  ...tr,
  localize: {
    ...tr.localize,
    day: (n: number, options?: { width?: string }) => {
      const narrow = ["P", "P", "S", "Ç", "P", "C", "C"]
      const short = ["Pz", "Pt", "Sa", "Ça", "Pe", "Cu", "Ct"]
      const wide = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"]

      switch (options?.width) {
        case "narrow":
          return narrow[n]
        case "wide":
          return wide[n]
        default:
          return short[n]
      }
    },
  },
}

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({ className, classNames, showOutsideDays = true, locale = customTrLocale, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      locale={locale}
      firstDayOfWeek={1} // 1 = Pazartesi (date-fns'e göre)
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse",
        head: "flex", // <-- Eklenen: thead elementinin display'ini flex yap
        head_row: "flex w-full justify-between whitespace-nowrap",
        head_cell:
          "text-muted-foreground rounded-md font-normal text-[0.75rem] text-center w-[50px] overflow-hidden flex-shrink-0 flex-grow-0",
        tbody: "flex flex-col", // <-- Eklenen: tbody elementinin display'ini flex-col yap
        row: "flex w-full mt-2 justify-between",
        cell: "text-center text-sm p-0 relative h-9 w-[50px] flex-shrink-0 flex-grow-0 [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-[50px] p-0 font-normal aria-selected:opacity-100 flex-shrink-0 flex-grow-0",
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
