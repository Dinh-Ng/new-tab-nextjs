'use client'

import React, { useEffect, useState } from 'react'
import { PlusCircle, Target, Trash, Clock, Edit } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  frequency?: 'daily' | 'weekly'
  targetCount?: number
  currentCount?: number
  isDone: boolean
  lastCompletedAt: string | null
}

type Game = {
  id: string
  name: string
  resetTime: string
  weeklyResetDay?: number // 0 = Sunday, 1 = Monday... 6 = Saturday
  quests: Quest[]
}

export default function DailyQuestsPage() {
  const [games, setGames] = useState<Game[]>([])
  const [isGameDialogOpen, setIsGameDialogOpen] = useState(false)
  const [isQuestDialogOpen, setIsQuestDialogOpen] = useState(false)
  const [currentGameId, setCurrentGameId] = useState<string | null>(null)

  const [gameForm, setGameForm] = useState<{ id: string, name: string, resetTime: string, weeklyResetDay: number }>({ id: '', name: '', resetTime: '00:00', weeklyResetDay: 1 })
  const [questForm, setQuestForm] = useState<{ id: string, name: string, frequency: 'daily' | 'weekly', isMultiStep: boolean, targetCount: number }>({ id: '', name: '', frequency: 'daily', isMultiStep: false, targetCount: 2 })

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

          // Daily most recent reset
          const dailyResetDate = new Date(now)
          dailyResetDate.setHours(resetHour, resetMinute, 0, 0)
          if (now < dailyResetDate) {
            // If the time hasn't passed today's reset time, the most recent reset was yesterday
            dailyResetDate.setDate(dailyResetDate.getDate() - 1)
          }
          const mostRecentDailyReset = dailyResetDate.getTime()

          // Weekly most recent reset
          const weeklyResetDay = game.weeklyResetDay ?? 1 // default Monday
          const weeklyResetDate = new Date(dailyResetDate)
          while (weeklyResetDate.getDay() !== weeklyResetDay) {
            weeklyResetDate.setDate(weeklyResetDate.getDate() - 1)
          }
          const mostRecentWeeklyReset = weeklyResetDate.getTime()

          let gameChanged = false
          const newQuests = game.quests.map((quest) => {
            if (quest.isDone && quest.lastCompletedAt) {
              const completedAtTime = new Date(quest.lastCompletedAt).getTime()
              const freq = quest.frequency || 'daily'
              const resetThreshold = freq === 'weekly' ? mostRecentWeeklyReset : mostRecentDailyReset

              // If last completed time is before the most recent reset, it should be unchecked
              if (completedAtTime < resetThreshold) {
                gameChanged = true
                hasChanges = true
                return { ...quest, isDone: false, lastCompletedAt: null, currentCount: 0 }
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
      setGames(games.map(g => g.id === gameForm.id ? { ...g, name: gameForm.name, resetTime: gameForm.resetTime, weeklyResetDay: gameForm.weeklyResetDay } : g))
    } else {
      setGames([...games, { id: Date.now().toString(), name: gameForm.name, resetTime: gameForm.resetTime, weeklyResetDay: gameForm.weeklyResetDay, quests: [] }])
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
            quests: g.quests.map(q => q.id === questForm.id ? {
              ...q,
              name: questForm.name,
              frequency: questForm.frequency,
              targetCount: questForm.isMultiStep ? questForm.targetCount : undefined,
              currentCount: questForm.isMultiStep ? (q.currentCount || 0) : undefined
            } : q)
          }
        } else {
          return {
            ...g,
            quests: [...g.quests, {
              id: Date.now().toString(),
              name: questForm.name,
              frequency: questForm.frequency,
              targetCount: questForm.isMultiStep ? questForm.targetCount : undefined,
              currentCount: questForm.isMultiStep ? 0 : undefined,
              isDone: false,
              lastCompletedAt: null
            }]
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
                currentCount: newIsDone ? (q.targetCount || 0) : 0,
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

  const incrementQuest = (gameId: string, questId: string) => {
    setGames(games.map(g => {
      if (g.id === gameId) {
        return {
          ...g,
          quests: g.quests.map(q => {
            if (q.id === questId && q.targetCount && (q.currentCount || 0) < q.targetCount) {
              const newCount = (q.currentCount || 0) + 1
              const newIsDone = newCount >= q.targetCount
              return {
                ...q,
                currentCount: newCount,
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

  const renderQuestItem = (gameId: string, quest: Quest) => (
    <div key={quest.id} className="flex items-start justify-between group">
      <div className="flex items-center gap-3 flex-1 mr-2 pt-1">
        <Checkbox
          id={`quest-[${gameId}]-[${quest.id}]`}
          checked={quest.isDone}
          onCheckedChange={() => toggleQuest(gameId, quest.id)}
          className="mt-0.5"
        />
        <Label
          htmlFor={`quest-[${gameId}]-[${quest.id}]`}
          className={`cursor-pointer leading-tight ${quest.isDone ? 'line-through text-muted-foreground dark:text-gray-500' : 'dark:text-gray-200'}`}
        >
          {quest.name}
        </Label>

        {quest.targetCount && quest.targetCount > 1 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={`h-7 px-3 py-1 text-xs items-center justify-center rounded-md ml-2 font-bold tracking-wide shadow-sm transition-all ${quest.isDone ? 'text-muted-foreground border-muted-foreground/30 bg-muted/30' : 'text-blue-600 border-blue-400/50 bg-blue-50 hover:bg-blue-100 hover:scale-[1.03] active:scale-95 dark:bg-blue-500/10 dark:border-blue-400/30 dark:hover:bg-blue-500/20 dark:text-blue-400'}`}
            onClick={(e) => {
               e.preventDefault()
               e.stopPropagation()
               incrementQuest(gameId, quest.id)
            }}
            disabled={quest.isDone}
          >
            {quest.currentCount || 0} / {quest.targetCount}
          </Button>
        )}
      </div>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex shrink-0">
         <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => {
              setCurrentGameId(gameId)
              setQuestForm({ id: quest.id, name: quest.name, frequency: quest.frequency || 'daily', isMultiStep: (quest.targetCount || 1) > 1, targetCount: quest.targetCount || 2 })
              setIsQuestDialogOpen(true)
            }}
         >
           <Edit className="size-3 text-muted-foreground" />
         </Button>
         <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 hover:bg-red-50 dark:hover:bg-red-900/30"
            onClick={() => deleteQuest(gameId, quest.id)}
         >
           <Trash className="size-3 text-red-400" />
         </Button>
      </div>
    </div>
  )

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
            if (!open) setGameForm({ id: '', name: '', resetTime: '00:00', weeklyResetDay: 1 })
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => setGameForm({ id: '', name: '', resetTime: '00:00', weeklyResetDay: 1 })}>
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
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label htmlFor="resetTime">Reset Time</Label>
                    <Input
                      id="resetTime"
                      type="time"
                      value={gameForm.resetTime}
                      onChange={(e) => setGameForm({ ...gameForm, resetTime: e.target.value })}
                      required
                      className="dark:bg-gray-700 dark:text-white mt-1"
                    />
                  </div>
                  <div className="flex-1">
                    <Label>Weekly Reset</Label>
                    <Select value={gameForm.weeklyResetDay.toString()} onValueChange={(v) => setGameForm({...gameForm, weeklyResetDay: parseInt(v)})}>
                      <SelectTrigger className="w-full mt-1 dark:bg-gray-700 dark:text-white border-muted">
                        <SelectValue placeholder="Day" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Monday</SelectItem>
                        <SelectItem value="2">Tuesday</SelectItem>
                        <SelectItem value="3">Wednesday</SelectItem>
                        <SelectItem value="4">Thursday</SelectItem>
                        <SelectItem value="5">Friday</SelectItem>
                        <SelectItem value="6">Saturday</SelectItem>
                        <SelectItem value="0">Sunday</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
                        setGameForm({ id: game.id, name: game.name, resetTime: game.resetTime, weeklyResetDay: game.weeklyResetDay ?? 1 })
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

                <div className="flex-1 space-y-4 mb-4 min-h-[100px]">
                  {game.quests.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-sm text-muted-foreground italic text-center text-gray-400">No quests added.</p>
                    </div>
                  ) : (
                    <>
                      {game.quests.filter(q => q.frequency !== 'weekly').length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Daily</h4>
                          {game.quests.filter(q => q.frequency !== 'weekly').map(q => renderQuestItem(game.id, q))}
                        </div>
                      )}

                      {game.quests.filter(q => q.frequency === 'weekly').length > 0 && (
                        <div className={`space-y-3 ${game.quests.filter(q => q.frequency !== 'weekly').length > 0 ? 'pt-4 border-t dark:border-gray-800' : ''}`}>
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Weekly</h4>
                          {game.quests.filter(q => q.frequency === 'weekly').map(q => renderQuestItem(game.id, q))}
                        </div>
                      )}
                    </>
                  )}
                </div>

                <Button
                  variant="outline"
                  className="w-full mt-auto bg-gray-50 hover:bg-gray-100 dark:bg-gray-700/50 dark:hover:bg-gray-700 dark:text-white border-dashed"
                  onClick={() => {
                    setCurrentGameId(game.id)
                    setQuestForm({ id: '', name: '', frequency: 'daily', isMultiStep: false, targetCount: 2 })
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
            setQuestForm({ id: '', name: '', frequency: 'daily', isMultiStep: false, targetCount: 2 })
          }
        }}>
          <DialogContent className="dark:bg-gray-800 dark:text-white sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{questForm.id ? 'Edit Quest' : 'Add New Quest'}</DialogTitle>
              <DialogDescription className="dark:text-gray-400">Enter the name and frequency of your task.</DialogDescription>
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
              <div>
                <Label>Frequency</Label>
                <Select value={questForm.frequency} onValueChange={(v: 'daily'|'weekly') => setQuestForm({...questForm, frequency: v})}>
                  <SelectTrigger className="w-full mt-1 dark:bg-gray-700 dark:text-white border-muted">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-3 border-t dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="isMultiStep"
                    checked={questForm.isMultiStep}
                    onCheckedChange={(c) => setQuestForm({...questForm, isMultiStep: c === true})}
                  />
                  <Label htmlFor="isMultiStep" className="cursor-pointer">Requires multiple completions?</Label>
                </div>
                {questForm.isMultiStep && (
                  <div className="mt-4">
                    <Label htmlFor="targetCount">Target Count</Label>
                    <Input
                      id="targetCount"
                      type="number"
                      min="2"
                      value={questForm.targetCount}
                      onChange={(e) => setQuestForm({ ...questForm, targetCount: parseInt(e.target.value) || 2 })}
                      required
                      className="dark:bg-gray-700 dark:text-white mt-1"
                    />
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full">{questForm.id ? 'Update Quest' : 'Add Quest'}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
