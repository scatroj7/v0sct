"use client"

import { useEffect, useRef } from "react"

export function useCalendarDomFix() {
  const fixApplied = useRef(false)

  useEffect(() => {
    // Only apply the fix once
    if (fixApplied.current) return

    function applyCalendarFix() {
      // Find all calendar tables
      const tables = document.querySelectorAll(".rdp table")

      if (tables.length === 0) {
        // If tables aren't found yet, try again in 100ms
        setTimeout(applyCalendarFix, 100)
        return
      }

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

      fixApplied.current = true
      console.log("Calendar DOM fix applied successfully")
    }

    // Initial call
    applyCalendarFix()

    // Also apply the fix when the DOM changes
    const observer = new MutationObserver(() => {
      if (!fixApplied.current) {
        applyCalendarFix()
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })

    return () => {
      observer.disconnect()
    }
  }, [])
}
