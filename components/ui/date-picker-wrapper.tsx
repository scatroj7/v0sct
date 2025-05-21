"use client"

import type React from "react"
import { useEffect, useRef } from "react"

interface DatePickerWrapperProps {
  children: React.ReactNode
}

export function DatePickerWrapper({ children }: DatePickerWrapperProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!wrapperRef.current) return

    function fixCalendarStyles() {
      const wrapper = wrapperRef.current
      if (!wrapper) return

      // Find all table elements within this wrapper
      const tables = wrapper.querySelectorAll("table")

      tables.forEach((table) => {
        // Force table to be block
        table.style.cssText = "display: block !important; width: 100% !important;"

        // Fix thead and its rows
        const thead = table.querySelector("thead")
        if (thead) {
          thead.style.cssText = "display: flex !important; width: 100% !important;"

          const headRows = thead.querySelectorAll("tr")
          headRows.forEach((row) => {
            row.style.cssText =
              "display: flex !important; width: 100% !important; justify-content: space-between !important;"
          })

          // Fix th elements
          const headCells = thead.querySelectorAll("th")
          headCells.forEach((cell) => {
            cell.style.cssText =
              "display: flex !important; width: 50px !important; flex-shrink: 0 !important; flex-grow: 0 !important; justify-content: center !important; align-items: center !important;"
          })
        }

        // Fix tbody and its rows
        const tbody = table.querySelector("tbody")
        if (tbody) {
          tbody.style.cssText = "display: flex !important; flex-direction: column !important; width: 100% !important;"

          const bodyRows = tbody.querySelectorAll("tr")
          bodyRows.forEach((row) => {
            row.style.cssText =
              "display: flex !important; width: 100% !important; justify-content: space-between !important;"
          })

          // Fix td elements
          const bodyCells = tbody.querySelectorAll("td")
          bodyCells.forEach((cell) => {
            cell.style.cssText =
              "display: flex !important; width: 50px !important; flex-shrink: 0 !important; flex-grow: 0 !important; justify-content: center !important; align-items: center !important;"

            // Fix day buttons
            const buttons = cell.querySelectorAll("button")
            buttons.forEach((button) => {
              button.style.cssText =
                "width: 100% !important; height: 100% !important; display: flex !important; justify-content: center !important; align-items: center !important;"
            })
          })
        }
      })
    }

    // Initial fix
    fixCalendarStyles()

    // Set up a MutationObserver to watch for changes
    const observer = new MutationObserver(() => {
      fixCalendarStyles()
    })

    observer.observe(wrapperRef.current, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["style", "class"],
    })

    return () => {
      observer.disconnect()
    }
  }, [])

  return (
    <div ref={wrapperRef} className="calendar-wrapper">
      {children}
    </div>
  )
}
