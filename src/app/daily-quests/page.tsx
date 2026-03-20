'use client'

import React, { useEffect, useState } from 'react'
import { PlusCircle, Target, Trash, Clock, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Quest = {
  id: string
  name: string
  isDone: boolean
  lastCompletedAt: string | null
}

type Game = {
  id: string
  name: string
  resetTime: string
  quests: Quest[]
}

export default function DailyQuestsPage() {
  const [games, setGames] = useState<Game[]>([])
  const [isGameDialogOpen, setIsGameDialogOpen] = useState(false)
  const [isQuestDialogOpen, setIsQuestDialogOpen] = useState(false)
  const [currentGameId, setCurrentGameId] = useState<string | null>(null)

  const [gameForm, setGameForm] = useState({ id: '', name: '', resetTime: '00:00' })
  const [questForm, setQuestForm] = useState({ id: '', name: '' })

  // Loading
  useEffect(() => {
    const stored = localStorage.getItem('daily_quests_games')
    if (stored) {
      setGames(JSON.parse(stored))
    }
  }, [])

  // Auto-reset logic
  useEffect(() => {
    const checkResets = () => {
      setGames((prevGames) => {
        let hasChanges = false
        const now = new Date()

        const newGames = prevGames.map((game) => {
          const [resetHour, resetMinute] = game.resetTime.split(':').map(Number)
          const resetDate = new Date(now)
          resetDate.setHours(resetHour, resetMinute, 0, 0)

          if (now < resetDate) {
            // If the time hasn't passed today's reset time, the most recent reset was yesterday
            resetDate.setDate(resetDate.getDate() - 1)
          }
          const mostRecentResetTime = resetDate.getTime()

          let gameChanged = false
          const newQuests = game.quests.map((quest) => {
            if (quest.isDone && quest.lastCompletedAt) {
              const completedAtTime = new Date(quest.lastCompletedAt).getTime()
              // If last completed time is before the most recent reset, it should be unchecked
              if (completedAtTime < mostRecentResetTime) {
                gameChanged = true
                hasChanges = true
                return { ...quest, isDone: false, lastCompletedAt: null }
              }
            }
            return quest
          })

          return gameChanged ? { ...game, quests: newQuests } : game
        })

        if (hasChanges) {
          localStorage.setItem('daily_quests_games', JSON.stringify(newGames))
          return newGames
        }
        return prevGames
      })
    }

    // Run once on mount
    checkResets()

    // Check every minute
    const interval = setInterval(checkResets, 60000)
    return () => clearInterval(interval)
  }, [])

  // Saving
  useEffect(() => {
    if (games.length > 0) {
      localStorage.setItem('daily_quests_games', JSON.stringify(games))
    } else {
      localStorage.removeItem('daily_quests_games')
    }
  }, [games])

  const saveGame = (e: React.FormEvent) => {
    e.preventDefault()
    if (gameForm.id) {
      setGames(games.map(g => g.id === gameForm.id ? { ...g, name: gameForm.name, resetTime: gameForm.resetTime } : g))
    } else {
      setGames([...games, { id: Date.now().toString(), name: gameForm.name, resetTime: gameForm.resetTime, quests: [] }])
    }
    setIsGameDialogOpen(false)
  }

  const deleteGame = (id: string) => {
    setGames(games.filter(g => g.id !== id))
  }

  const saveQuest = (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentGameId) return

    setGames(games.map(g => {
      if (g.id === currentGameId) {
        if (questForm.id) {
          return {
            ...g,
            quests: g.quests.map(q => q.id === questForm.id ? { ...q, name: questForm.name } : q)
          }
        } else {
          return {
            ...g,
            quests: [...g.quests, { id: Date.now().toString(), name: questForm.name, isDone: false, lastCompletedAt: null }]
          }
        }
      }
      return g
    }))
    setIsQuestDialogOpen(false)
  }

  const deleteQuest = (gameId: string, questId: string) => {
    setGames(games.map(g => {
      if (g.id === gameId) {
        return { ...g, quests: g.quests.filter(q => q.id !== questId) }
      }
      return g
    }))
  }

  const toggleQuest = (gameId: string, questId: string) => {
    setGames(games.map(g => {
      if (g.id === gameId) {
        return {
          ...g,
          quests: g.quests.map(q => {
            if (q.id === questId) {
              const newIsDone = !q.isDone
              return {
                ...q,
                isDone: newIsDone,
                lastCompletedAt: newIsDone ? new Date().toISOString() : null
              }
            }
            return q
          })
        }
      }
      return g
    }))
  }

  return (
    <div className="min-h-screen w-full bg-white dark:bg-gray-900">
      <div className="container mx-auto p-4 max-w-7xl">
        <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <h1 className="text-2xl font-bold flex items-center gap-2 dark:text-white">
            <Target className="size-6 text-blue-500" />
            Daily Quests
          </h1>

          <Dialog open={isGameDialogOpen} onOpenChange={(open) => {
            setIsGameDialogOpen(open)
            if (!open) setGameForm({ id: '', name: '', resetTime: '00:00' })
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => setGameForm({ id: '', name: '', resetTime: '00:00' })}>
                <PlusCircle className="mr-2 size-4" /> Add Game
              </Button>
            </DialogTrigger>
            <DialogContent className="dark:bg-gray-800 dark:text-white sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{gameForm.id ? 'Edit Game' : 'Add New Game'}</DialogTitle>
                <DialogDescription className="dark:text-gray-400">Setup your game and its daily reset time.</DialogDescription>
              </DialogHeader>
              <form onSubmit={saveGame} className="space-y-4">
                <div>
                  <Label htmlFor="gameName">Game Name</Label>
                  <Input
                    id="gameName"
                    value={gameForm.name}
                    onChange={(e) => setGameForm({ ...gameForm, name: e.target.value })}
                    required
                    className="dark:bg-gray-700 dark:text-white mt-1"
                    placeholder="e.g. Genshin Impact"
                  />
                </div>
                <div>
                  <Label htmlFor="resetTime">Daily Reset Time</Label>
                  <Input
                    id="resetTime"
                    type="time"
                    value={gameForm.resetTime}
                    onChange={(e) => setGameForm({ ...gameForm, resetTime: e.target.value })}
                    required
                    className="dark:bg-gray-700 dark:text-white mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1 dark:text-gray-400">
                    Your local time when the game refreshes daily quests.
                  </p>
                </div>
                <Button type="submit" className="w-full">{gameForm.id ? 'Update Game' : 'Save Game'}</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {games.length === 0 ? (
          <div className="text-center py-16 dark:text-gray-400 border border-dashed rounded-xl dark:border-gray-800">
            <Target className="mx-auto h-16 w-16 text-gray-300 dark:text-gray-700 mb-4" />
            <h3 className="text-lg font-medium dark:text-gray-300">No games tracking</h3>
            <p className="mt-2 text-sm">Click &quot;Add Game&quot; to started tracking your daily quests!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {games.map((game) => (
              <div key={game.id} className="border rounded-xl p-5 bg-card dark:bg-gray-800 shadow-sm flex flex-col dark:border-gray-700">
                <div className="flex items-start justify-between mb-4 border-b dark:border-gray-700 pb-3">
                  <div className="pr-4 overflow-hidden">
                    <h2 className="text-lg font-bold dark:text-white truncate" title={game.name}>{game.name}</h2>
                    <div className="flex items-center text-xs text-muted-foreground dark:text-gray-400 mt-1">
                      <Clock className="size-3 mr-1" />
                      Reset time: {game.resetTime}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                      onClick={() => {
                        setGameForm({ id: game.id, name: game.name, resetTime: game.resetTime })
                        setIsGameDialogOpen(true)
                      }}
                    >
                      <Edit className="size-4 text-blue-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30"
                      onClick={() => deleteGame(game.id)}
                    >
                      <Trash className="size-4 text-red-500" />
                    </Button>
                  </div>
                </div>

                <div className="flex-1 space-y-3 mb-4 min-h-[100px]">
                  {game.quests.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-sm text-muted-foreground italic text-center text-gray-400">No quests added.</p>
                    </div>
                  ) : (
                    game.quests.map((quest) => (
                      <div key={quest.id} className="flex items-start justify-between group">
                        <div className="flex items-start gap-3 flex-1 mr-2 pt-1">
                          <Checkbox
                            id={`quest-[${game.id}]-[${quest.id}]`}
                            checked={quest.isDone}
                            onCheckedChange={() => toggleQuest(game.id, quest.id)}
                            className="mt-0.5"
                          />
                          <Label
                            htmlFor={`quest-[${game.id}]-[${quest.id}]`}
                            className={`cursor-pointer leading-tight ${quest.isDone ? 'line-through text-muted-foreground dark:text-gray-500' : 'dark:text-gray-200'}`}
                          >
                            {quest.name}
                          </Label>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex shrink-0">
                           <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => {
                                setCurrentGameId(game.id)
                                setQuestForm({ id: quest.id, name: quest.name })
                                setIsQuestDialogOpen(true)
                              }}
                           >
                             <Edit className="size-3 text-muted-foreground" />
                           </Button>
                           <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 hover:bg-red-50 dark:hover:bg-red-900/30"
                              onClick={() => deleteQuest(game.id, quest.id)}
                           >
                             <Trash className="size-3 text-red-400" />
                           </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <Button
                  variant="outline"
                  className="w-full mt-auto bg-gray-50 hover:bg-gray-100 dark:bg-gray-700/50 dark:hover:bg-gray-700 dark:text-white border-dashed"
                  onClick={() => {
                    setCurrentGameId(game.id)
                    setQuestForm({ id: '', name: '' })
                    setIsQuestDialogOpen(true)
                  }}
                >
                  <PlusCircle className="mr-2 size-4" /> Add Quest
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Quest Dialog */}
        <Dialog open={isQuestDialogOpen} onOpenChange={(open) => {
          setIsQuestDialogOpen(open)
          if (!open) {
            setCurrentGameId(null)
            setQuestForm({ id: '', name: '' })
          }
        }}>
          <DialogContent className="dark:bg-gray-800 dark:text-white sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{questForm.id ? 'Edit Quest' : 'Add New Quest'}</DialogTitle>
              <DialogDescription className="dark:text-gray-400">Enter the name of your daily task.</DialogDescription>
            </DialogHeader>
            <form onSubmit={saveQuest} className="space-y-4">
              <div>
                <Label htmlFor="questName">Quest Name</Label>
                <Input
                  id="questName"
                  value={questForm.name}
                  onChange={(e) => setQuestForm({ ...questForm, name: e.target.value })}
                  required
                  className="dark:bg-gray-700 dark:text-white mt-1"
                  placeholder="e.g. Login to receive rewards..."
                />
              </div>
              <Button type="submit" className="w-full">{questForm.id ? 'Update Quest' : 'Add Quest'}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
