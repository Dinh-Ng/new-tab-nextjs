import Link from 'next/link'
import { ArrowRight, Gamepad2, Grid3X3, Puzzle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function GamePage() {
  const games = [
    {
      title: '2048',
      description: 'Join the numbers and convert to 2048 tile!',
      icon: Grid3X3,
      href: '/game/2048',
      color: 'text-yellow-500',
    },
    {
      title: 'Block Puzzle',
      description: 'Fit the blocks, clear lines, relax.',
      icon: Puzzle,
      href: '/game/block-puzzle',
      color: 'text-amber-700',
    },
  ]

  return (
    <div className="flex min-h-[calc(100vh-4rem)] w-full flex-col items-center p-4 pt-10 md:p-10">
      <div className="flex w-full max-w-5xl flex-col gap-8">
        <div className="flex items-center gap-4">
          <div className="rounded-full bg-rose-100 p-3 dark:bg-rose-900/20">
            <Gamepad2 className="h-8 w-8 text-rose-500" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">
              Game Center
            </h1>
            <p className="text-muted-foreground">Relax and have some fun.</p>
          </div>
        </div>

        <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {games.map((game) => (
            <Card
              key={game.title}
              className="group relative overflow-hidden text-left transition-all hover:shadow-lg dark:hover:shadow-primary/10"
            >
              <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-4">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-lg bg-background shadow-sm ring-1 ring-border ${game.color}`}
                >
                  <game.icon className="h-6 w-6" />
                </div>
                <div className="flex flex-col">
                  <CardTitle className="text-xl font-bold">
                    {game.title}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardFooter className="flex items-center justify-between border-t bg-muted/50 px-6 py-4">
                <CardDescription className="text-sm font-medium">
                  {game.description}
                </CardDescription>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={game.href} className="gap-2">
                    Play <ArrowRight className="h-4 w-4" />
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
