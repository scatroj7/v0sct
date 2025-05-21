"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"

interface CustomModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  trigger: React.ReactNode
  className?: string
}

export function CustomModal({ isOpen, onClose, children, trigger, className }: CustomModalProps) {
  const [mounted, setMounted] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)

  // Client tarafında olduğumuzdan emin olalım
  useEffect(() => {
    setMounted(true)

    // Modal açıkken ESC tuşuna basıldığında kapansın
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }

    // Modal dışına tıklandığında kapansın
    const handleOutsideClick = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEsc)
      document.addEventListener("mousedown", handleOutsideClick)
    }

    return () => {
      document.removeEventListener("keydown", handleEsc)
      document.removeEventListener("mousedown", handleOutsideClick)
    }
  }, [isOpen, onClose])

  // Trigger elementini render edelim
  const triggerElement = <div onClick={() => (isOpen ? onClose() : onClose())}>{trigger}</div>

  // Modal içeriğini render edelim
  const modalContent =
    isOpen && mounted
      ? createPortal(
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24">
            <div className="fixed inset-0 bg-black/50" onClick={onClose} />
            <div
              ref={modalRef}
              className={cn("z-50 bg-background rounded-lg shadow-lg p-4 max-h-[85vh] overflow-auto", className)}
              onClick={(e) => e.stopPropagation()}
            >
              {children}
            </div>
          </div>,
          document.body,
        )
      : null

  return (
    <>
      {triggerElement}
      {modalContent}
    </>
  )
}
