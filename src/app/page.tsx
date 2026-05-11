import Link from 'next/link'
import { BookOpen, CheckSquare, ArrowRight, Gamepad2, Target } from 'lucide-react'
import { TopSites } from '@/components/top-sites'
import { ClockGreeting } from '@/components/clock-greeting'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function Home() {
  const apps = [
    {
      title: 'Story Reader',
      description: 'Track and read your favorite stories.',
      icon: BookOpen,
      href: '/story-reader',
      color: 'text-indigo-500',
      bg: 'bg-indigo-50 dark:bg-indigo-950/40',
      ring: 'ring-indigo-200 dark:ring-indigo-800/50',
      shadow: 'hover:shadow-indigo-100 dark:hover:shadow-indigo-900/20',
    },
    {
      title: 'Task Manager',
      description: 'Manage your daily tasks and productivity.',
      icon: CheckSquare,
      href: '/task-manager',
      color: 'text-emerald-500',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      ring: 'ring-emerald-200 dark:ring-emerald-800/50',
      shadow: 'hover:shadow-emerald-100 dark:hover:shadow-emerald-900/20',
    },
    {
      title: 'Game Center',
      description: 'Play games and relax.',
      icon: Gamepad2,
      href: '/game',
      color: 'text-rose-500',
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      ring: 'ring-rose-200 dark:ring-rose-800/50',
      shadow: 'hover:shadow-rose-100 dark:hover:shadow-rose-900/20',
    },
    {
      title: 'Daily Quests',
      description: 'Track and manage your daily game tasks.',
      icon: Target,
      href: '/daily-quests',
      color: 'text-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-950/40',
      ring: 'ring-blue-200 dark:ring-blue-800/50',
      shadow: 'hover:shadow-blue-100 dark:hover:shadow-blue-900/20',
    },
  ]

  return (
    <div className="flex min-h-[calc(100vh-3rem)] w-full flex-col bg-muted/30">
      {/* Top Sites */}
      <TopSites />

      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 pb-12 md:px-10">
        {/* Clock & Greeting Hero */}
        <div className="flex flex-col items-center gap-6 pt-2">
          <ClockGreeting />
        </div>

        {/* App Grid */}
        <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 lg:gap-5">
          {apps.map((app) => (
            <Link key={app.title} href={app.href} className="group outline-none">
              <Card
                className={`relative overflow-hidden text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${app.shadow} hover:border-transparent cursor-pointer`}
              >
                <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-3">
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-xl ${app.bg} ring-1 ${app.ring} shrink-0 transition-transform duration-200 group-hover:scale-110`}
                  >
                    <app.icon className={`h-7 w-7 ${app.color}`} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <CardTitle className="text-lg font-bold leading-none">
                      {app.title}
                    </CardTitle>
                    <CardDescription className="text-sm leading-snug">
                      {app.description}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardFooter className="flex items-center justify-end border-t bg-muted/40 px-5 py-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`gap-1.5 text-sm font-medium ${app.color} hover:bg-transparent hover:gap-2.5 transition-all duration-200`}
                    tabIndex={-1}
                  >
                    Open <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
