'use client'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function DynamicTitle() {
  const [title, setTitle] = useState('New Tab')
  const pathname = usePathname()

  useEffect(() => {
    if (pathname.startsWith('/game')) {
      setTitle('Game')
      return
    }

    switch (pathname) {
      case '/task-manager':
        setTitle('Task manager')
        break

      default:
        setTitle('New Tab')
        break
    }
  }, [pathname])

  return <title>{title}</title>
}
