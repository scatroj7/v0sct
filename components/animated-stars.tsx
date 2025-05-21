"use client"

import { useEffect, useRef } from "react"

export function AnimatedStars() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let stars: { x: number; y: number; size: number; opacity: number; color: string }[] = []
    const numberOfStars = 200

    // Yıldız renkleri için mavi tonları kullan
    const colors = ["rgba(59, 130, 246, 0.7)", "rgba(37, 99, 235, 0.5)", "rgba(30, 64, 175, 0.3)"]

    const init = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      stars = []

      for (let i = 0; i < numberOfStars; i++) {
        const x = Math.random() * canvas.width
        const y = Math.random() * canvas.height

        // Yıldız boyutu ve parlaklığı
        const size = Math.random() * 2 + 0.5
        const opacity = Math.random() * 0.5 + 0.2

        const color = colors[Math.floor(Math.random() * colors.length)]

        stars.push({ x, y, size, opacity, color })
      }
    }

    const animate = () => {
      requestAnimationFrame(animate)
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (let i = 0; i < stars.length; i++) {
        const star = stars[i]

        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
        ctx.fillStyle = star.color
        ctx.globalAlpha = star.opacity
        ctx.fill()
      }
    }

    init()
    animate()

    window.addEventListener("resize", init)

    return () => {
      window.removeEventListener("resize", init)
    }
  }, [])

  return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full pointer-events-none z-0" />
}
