'use client'

import { useEffect, useState } from 'react'

function getGreeting(hour: number) {
  if (hour < 12) return { text: 'Good morning', emoji: '☀️' }
  if (hour < 18) return { text: 'Good afternoon', emoji: '🌤️' }
  return { text: 'Good evening', emoji: '🌙' }
}

export function ClockGreeting() {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const interval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  if (!now) return null

  const greeting = getGreeting(now.getHours())

  const timeStr = now.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  const dateStr = now.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="flex flex-col items-center gap-2 select-none">
      <div className="text-6xl font-bold tracking-tighter tabular-nums text-foreground">
        {timeStr}
      </div>
      <div className="flex flex-col items-center gap-1">
        <p className="text-2xl font-semibold text-foreground/80">
          {greeting.text} {greeting.emoji}
        </p>
        <p className="text-sm text-muted-foreground capitalize">{dateStr}</p>
      </div>
    </div>
  )
}
