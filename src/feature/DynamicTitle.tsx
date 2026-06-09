'use client'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

const ROUTE_TITLES: Record<string, string> = {
  '/': 'New Tab',
  '/task-manager': 'Task Manager',
  '/game': 'Game Center',
  '/game/2048': '2048',
  '/game/block-puzzle': 'Block Puzzle',
  '/daily-quests': 'Daily Quests',
}

export default function DynamicTitle() {
  const pathname = usePathname()

  useEffect(() => {
    const title = ROUTE_TITLES[pathname] ?? 'NexTab'
    document.title = title
  }, [pathname])

  return null
}
