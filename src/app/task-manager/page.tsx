'use client'

import React, { useEffect, useState } from 'react'
import { AlertCircle, CheckSquare, Filter, PlusCircle, Trash } from 'lucide-react'
import { useTheme } from 'next-themes'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Task {
  id: number
  name: string
  endDate: string
  endTime: string
  tags: string[]
  isDone: boolean
  important: boolean
}

type DeadlineType = 'date' | 'remaining'

const stringToColor = (str: string, isDark: boolean) => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = hash % 360
  return isDark
    ? `hsl(${hue}, 80%, 75%)`
    : `hsl(${hue}, 70%, 45%)`
}

export default function Component() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<number | null>(null)
  const [filterTag, setFilterTag] = useState<string | null>(null)
  const [allTags, setAllTags] = useState<string[]>([])
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const [deadlineType, setDeadlineType] = useState<DeadlineType>('date')
  const [remainingDays, setRemainingDays] = useState('')
  const [remainingHours, setRemainingHours] = useState('')
  const [remainingMinutes, setRemainingMinutes] = useState('')
  const [remainingError, setRemainingError] = useState('')

  useEffect(() => {
    const storedTasks = localStorage.getItem('tasks')
    if (storedTasks) {
      setTasks(JSON.parse(storedTasks))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks))
    const tags = Array.from(new Set(tasks.flatMap((task) => task.tags)))
    setAllTags(tags)
  }, [tasks])

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTasks((prevTasks) => [...prevTasks])
    }, 60000)
    return () => clearInterval(intervalId)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    if (editingTask) {
      setEditingTask({ ...editingTask, [name]: value })
    } else {
      setEditingTask({
        id: 0,
        name: '',
        endDate: '',
        endTime: '',
        tags: [],
        isDone: false,
        important: false,
        [name]: value,
      })
    }
  }

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tags = e.target.value.split(',').map((tag) => tag.trim())
    if (editingTask) {
      setEditingTask({ ...editingTask, tags })
    } else {
      setEditingTask({
        id: 0,
        name: '',
        endDate: '',
        endTime: '',
        tags,
        isDone: false,
        important: false,
      })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingTask) {
      let taskToSave = {
        ...editingTask,
        important: editingTask?.important || false,
      }
      if (deadlineType === 'remaining') {
        const days = remainingDays === '' ? 0 : parseInt(remainingDays)
        const hours = remainingHours === '' ? 0 : parseInt(remainingHours)
        const minutes = remainingMinutes === '' ? 0 : parseInt(remainingMinutes)

        if (days === 0 && hours === 0 && minutes === 0) {
          setRemainingError('Vui lòng nhập ít nhất một giá trị (ngày, giờ, hoặc phút).')
          return
        }

        setRemainingError('')
        const now = new Date()
        const deadline = new Date(now.getTime() + days * 24 * 60 * 60 * 1000 + hours * 60 * 60 * 1000 + minutes * 60 * 1000)

        const year = deadline.getFullYear()
        const month = String(deadline.getMonth() + 1).padStart(2, '0')
        const day = String(deadline.getDate()).padStart(2, '0')
        taskToSave.endDate = `${year}-${month}-${day}`

        const endHours = String(deadline.getHours()).padStart(2, '0')
        const endMinutes = String(deadline.getMinutes()).padStart(2, '0')
        taskToSave.endTime = `${endHours}:${endMinutes}`
      }
      if (taskToSave.id === 0) {
        const newTask = { ...taskToSave, id: Date.now() }
        setTasks([...tasks, newTask])
      } else {
        setTasks(
          tasks.map((task) => (task.id === taskToSave.id ? taskToSave : task))
        )
      }
      setEditingTask(null)
      setIsOpen(false)
      setDeadlineType('date')
      setRemainingDays('')
      setRemainingHours('')
      setRemainingMinutes('')
      setRemainingError('')
    }
  }

  const calculateTimeLeft = (endDate: string, endTime: string) => {
    const now = new Date()
    const deadline = new Date(`${endDate}T${endTime}`)
    const diff = deadline.getTime() - now.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const isLessThanOneDay = diff < 24 * 60 * 60 * 1000 && diff > 0
    const isOverdue = diff < 0
    return { days, hours, minutes, isLessThanOneDay, isOverdue, diffInMs: diff }
  }

  const toggleTaskDone = (id: number) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, isDone: !task.isDone } : task
      )
    )
  }

  const deleteTask = (id: number) => {
    setTasks(tasks.filter((task) => task.id !== id))
    setIsDeleteDialogOpen(false)
    setTaskToDelete(null)
  }

  const editTask = (task: Task) => {
    setEditingTask(task)
    setIsOpen(true)
    setDeadlineType('date')
    setRemainingDays('')
    setRemainingHours('')
    setRemainingMinutes('')
    setRemainingError('')
  }

  const sortTasks = (tasks: Task[]): Task[] => {
    return tasks.sort((a, b) => {
      const aTimeLeft = calculateTimeLeft(a.endDate, a.endTime)
      const bTimeLeft = calculateTimeLeft(b.endDate, b.endTime)

      if (
        a.important &&
        aTimeLeft.isLessThanOneDay &&
        (!b.important || !bTimeLeft.isLessThanOneDay)
      ) {
        return -1
      }
      if (
        b.important &&
        bTimeLeft.isLessThanOneDay &&
        (!a.important || !aTimeLeft.isLessThanOneDay)
      ) {
        return 1
      }

      return (
        new Date(`${a.endDate}T${a.endTime}`).getTime() -
        new Date(`${b.endDate}T${b.endTime}`).getTime()
      )
    })
  }

  const filteredAndSortedTasks = sortTasks(
    filterTag ? tasks.filter((task) => task.tags.includes(filterTag)) : tasks
  )

  const getUrgencyColor = (diff: number, isDark: boolean) => {
    const oneDay = 24 * 60 * 60 * 1000
    const ratio = Math.max(0, Math.min(1, diff / oneDay))

    if (isDark) {
      const hue = ratio * 40
      return `hsl(${hue}, 90%, 20%)`
    } else {
      const hue = ratio * 50
      const lightness = 85 + ratio * 10
      return `hsl(${hue}, 90%, ${lightness}%)`
    }
  }

  const AddTaskDialog = (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open)
        if (!open) {
          setEditingTask(null)
          setDeadlineType('date')
          setRemainingDays('')
          setRemainingHours('')
          setRemainingMinutes('')
          setRemainingError('')
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          className="w-full sm:w-auto"
          onClick={() => {
            setEditingTask({
              id: 0,
              name: '',
              endDate: '',
              endTime: '',
              tags: [],
              isDone: false,
              important: false,
            })
            setRemainingDays('')
            setRemainingHours('')
            setRemainingMinutes('')
            setRemainingError('')
          }}
        >
          <PlusCircle className="mr-2 size-4" /> Add New Task
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingTask && editingTask.id !== 0 ? 'Edit Task' : 'Create New Task'}
          </DialogTitle>
          <DialogDescription />
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Task Name</Label>
            <Input
              id="name"
              name="name"
              value={editingTask?.name || ''}
              onChange={handleInputChange}
              required
              placeholder="Enter task name..."
            />
          </div>
          <RadioGroup
            defaultValue="date"
            onValueChange={(value) => {
              setDeadlineType(value as DeadlineType)
              setRemainingError('')
            }}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="date" id="date" />
              <Label htmlFor="date">End Date</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="remaining" id="remaining" />
              <Label htmlFor="remaining">Remaining Time</Label>
            </div>
          </RadioGroup>
          {deadlineType === 'date' ? (
            <>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="date"
                  value={editingTask?.endDate || ''}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  name="endTime"
                  type="time"
                  value={editingTask?.endTime || ''}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <div className="flex space-x-2">
                <div className="flex-1">
                  <Label htmlFor="remainingDays">Days</Label>
                  <Input
                    id="remainingDays"
                    type="number"
                    min="0"
                    value={remainingDays}
                    onChange={(e) => { setRemainingDays(e.target.value); setRemainingError('') }}
                    placeholder="0"
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="remainingHours">Hours</Label>
                  <Input
                    id="remainingHours"
                    type="number"
                    min="0"
                    max="23"
                    value={remainingHours}
                    onChange={(e) => { setRemainingHours(e.target.value); setRemainingError('') }}
                    placeholder="0"
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="remainingMinutes">Minutes</Label>
                  <Input
                    id="remainingMinutes"
                    type="number"
                    min="0"
                    max="59"
                    value={remainingMinutes}
                    onChange={(e) => { setRemainingMinutes(e.target.value); setRemainingError('') }}
                    placeholder="0"
                  />
                </div>
              </div>
              {remainingError && (
                <p className="flex items-center gap-1.5 text-sm text-destructive">
                  <AlertCircle className="size-3.5 shrink-0" />
                  {remainingError}
                </p>
              )}
            </div>
          )}
          <div>
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              name="tags"
              value={editingTask?.tags.join(', ') || ''}
              onChange={handleTagsChange}
              placeholder="e.g., work, urgent"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="important"
              checked={editingTask?.important || false}
              onCheckedChange={(checked) => {
                if (editingTask) {
                  setEditingTask({
                    ...editingTask,
                    important: checked as boolean,
                  })
                }
              }}
            />
            <Label htmlFor="important" className="font-medium cursor-pointer">
              Mark as Important
            </Label>
          </div>
          <Button type="submit" className="w-full">
            {editingTask && editingTask.id !== 0 ? 'Update Task' : 'Create Task'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )

  return (
    <div className="min-h-[calc(100vh-3rem)] w-full bg-background">
      <div className="container mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Task Management</h1>
        </div>

        {/* Controls */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row">
          {AddTaskDialog}

          <div className="flex w-full flex-col gap-4 sm:flex-row">
            <div className="flex w-full items-center sm:w-[250px]">
              <Filter className="mr-2 size-4 shrink-0 text-muted-foreground" />
              <Select
                onValueChange={(value) =>
                  setFilterTag(value === 'all' ? null : value)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter by tag" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] overflow-y-auto">
                  <SelectItem value="all">All Tags</SelectItem>
                  {allTags.map((tag) => (
                    <SelectItem key={tag} value={tag}>
                      {tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {filteredAndSortedTasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted/60">
              <CheckSquare className="size-10 text-muted-foreground/40" />
            </div>
            <div className="space-y-1">
              <p className="text-lg font-semibold text-foreground">
                {filterTag ? 'No tasks with this tag' : 'No tasks yet'}
              </p>
              <p className="text-sm text-muted-foreground max-w-xs">
                {filterTag
                  ? `No tasks found for tag "${filterTag}". Try a different filter.`
                  : 'Create your first task to start tracking your productivity.'}
              </p>
            </div>
            {!filterTag && (
              <Button
                onClick={() => {
                  setEditingTask({ id: 0, name: '', endDate: '', endTime: '', tags: [], isDone: false, important: false })
                  setIsOpen(true)
                }}
                className="mt-2"
              >
                <PlusCircle className="mr-2 size-4" />
                Create first task
              </Button>
            )}
          </div>
        )}

        {/* Task Grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredAndSortedTasks.map((task) => {
            const { days, hours, minutes, isLessThanOneDay, isOverdue, diffInMs } =
              calculateTimeLeft(task.endDate, task.endTime)
            const dynamicBg =
              task.important && isLessThanOneDay && !task.isDone
                ? getUrgencyColor(diffInMs, isDark)
                : undefined

            return (
              <div
                key={task.id}
                className={`flex cursor-pointer flex-col rounded-xl border p-4 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${
                  task.isDone
                    ? 'bg-muted/40 opacity-60 border-transparent'
                    : task.important
                      ? isLessThanOneDay
                        ? 'border-transparent shadow-md'
                        : 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/40 shadow-sm shadow-amber-500/5'
                      : 'bg-card hover:border-primary/30 shadow-sm'
                }`}
                style={dynamicBg ? { backgroundColor: dynamicBg } : undefined}
                onClick={() => editTask(task)}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    id={`task-${task.id}`}
                    checked={task.isDone}
                    onCheckedChange={() => toggleTaskDone(task.id)}
                    className="mt-1"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2
                        className={`break-words text-base ${task.important ? 'font-bold' : 'font-semibold'} ${
                          task.isDone ? 'line-through text-muted-foreground' : ''
                        } ${
                          !task.isDone && (task.important && isLessThanOneDay || isOverdue)
                            ? 'text-red-500 dark:text-red-400'
                            : ''
                        }`}
                      >
                        {task.name}
                      </h2>
                      {task.important && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertCircle className="mr-1 size-3" />
                          Important
                        </Badge>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {task.tags.map((tag, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          style={{
                            color: stringToColor(tag, isDark),
                            borderColor: stringToColor(tag, isDark),
                          }}
                          className="px-2 py-0.5 text-xs font-medium"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
                  <div className="flex flex-col gap-0.5">
                    <p
                      className={`text-sm font-medium ${
                        isLessThanOneDay || isOverdue
                          ? 'text-red-500 dark:text-red-400'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {isOverdue
                        ? <span className="font-bold">⚠ Overdue</span>
                        : days > 0
                          ? `${days}d ${hours}h ${minutes}m left`
                          : `${hours}h ${minutes}m left`}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Due: {task.endDate} at {task.endTime}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation()
                      setTaskToDelete(task.id)
                      setIsDeleteDialogOpen(true)
                    }}
                  >
                    <Trash className="size-3.5" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Delete Confirmation */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Task?</DialogTitle>
              <DialogDescription>
                This action cannot be undone. The task will be permanently removed.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => taskToDelete && deleteTask(taskToDelete)}
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
