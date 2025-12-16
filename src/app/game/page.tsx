import { Gamepad2 } from 'lucide-react'

export default function GamePage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] w-full flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="rounded-full bg-rose-100 p-4 dark:bg-rose-900/20">
          <Gamepad2 className="h-12 w-12 text-rose-500" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
          Game Center
        </h1>
        <p className="text-xl text-muted-foreground">
          Coming Soon. Get ready to play!
        </p>
      </div>
    </div>
  )
}
