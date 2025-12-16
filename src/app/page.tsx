import Link from 'next/link'
import { BookOpen, CheckSquare, ArrowRight, Gamepad2 } from 'lucide-react'

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
    },
    {
      title: 'Task Manager',
      description: 'Manage your daily tasks and productivity.',
      icon: CheckSquare,
      href: '/task-manager',
      color: 'text-emerald-500',
    },
    {
      title: 'Game Center',
      description: 'Play games and relax.',
      icon: Gamepad2,
      href: '/game',
      color: 'text-rose-500',
    },
  ]

  return (
    <div className="flex min-h-[calc(100vh-4rem)] w-full flex-col items-center justify-center bg-muted/30 p-4 md:p-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <div className="flex flex-col items-start gap-4 text-center md:items-center">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
            Welcome Back
          </h1>
          <p className="max-w-[700px] text-lg text-muted-foreground">
            Select an application to get started. Everything you need is right here.
          </p>
        </div>

        <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8">
          {apps.map((app) => (
            <Card
              key={app.title}
              className="group relative overflow-hidden text-left transition-all hover:shadow-lg dark:hover:shadow-primary/10"
            >
              <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-4">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-lg bg-background shadow-sm ring-1 ring-border ${app.color}`}
                >
                  <app.icon className="h-6 w-6" />
                </div>
                <div className="flex flex-col">
                  <CardTitle className="text-xl font-bold">
                    {app.title}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardFooter className="flex items-center justify-between border-t bg-muted/50 px-6 py-4">
                <CardDescription className="text-sm font-medium">
                  {app.description}
                </CardDescription>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={app.href} className="gap-2">
                    Open <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
