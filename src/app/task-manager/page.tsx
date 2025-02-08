'use client'

import React, { useEffect, useState } from 'react'
import { AlertCircle, Filter, Moon, PlusCircle, Sun, Trash } from 'lucide-react'

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
    ? `hsl(${hue}, 80%, 75%)` // Brighter colors for dark mode
    : `hsl(${hue}, 70%, 45%)` // Darker colors for light mode
}

export default function Component() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<number | null>(null)
  const [filterTag, setFilterTag] = useState<string | null>(null)
  const [allTags, setAllTags] = useState<string[]>([])
  const [darkMode, setDarkMode] = useState(false)
  const [deadlineType, setDeadlineType] = useState<DeadlineType>('date')
  const [remainingDays, setRemainingDays] = useState('')
  const [remainingHours, setRemainingHours] = useState('')
  const [remainingMinutes, setRemainingMinutes] = useState('')

  useEffect(() => {
    const storedTasks = localStorage.getItem('tasks')
    if (storedTasks) {
      setTasks(JSON.parse(storedTasks))
    }
    const storedDarkMode = localStorage.getItem('darkMode')
    if (storedDarkMode) {
      setDarkMode(JSON.parse(storedDarkMode))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks))
    const tags = Array.from(new Set(tasks.flatMap((task) => task.tags)))
    setAllTags(tags)
  }, [tasks])

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode))
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  useEffect(() => {
    const intervalId = setInterval(() => {
      // Force a re-render of the component
      setTasks((prevTasks) => [...prevTasks])
    }, 60000) // 60000 ms = 1 minute

    // Cleanup function to clear the interval when the component unmounts
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
          // Show error message
          alert('Please input at least one value for days, hours, or minutes.')
          return
        }

        const now = new Date()
        const deadline = new Date(
          now.getTime() +
            days * 24 * 60 * 60 * 1000 +
            hours * 60 * 60 * 1000 +
            minutes * 60 * 1000
        )
        taskToSave.endDate = deadline.toISOString().split('T')[0]
        taskToSave.endTime = deadline.toTimeString().split(' ')[0].slice(0, 5)
      }
      if (taskToSave.id === 0) {
        // Creating a new task
        const newTask = { ...taskToSave, id: Date.now() }
        setTasks([...tasks, newTask])
      } else {
        // Updating an existing task
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
    }
  }

  const calculateTimeLeft = (endDate: string, endTime: string) => {
    const now = new Date()
    const deadline = new Date(`${endDate}T${endTime}`)

    // If the deadline is earlier in the day than the current time, assume it's for the next day
    if (deadline < now && deadline.getDate() === now.getDate()) {
      deadline.setDate(deadline.getDate() + 1)
    }

    const diff = deadline.getTime() - now.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const isLessThanOneDay = diff < 24 * 60 * 60 * 1000
    const isOverdue = diff < 0
    return { days, hours, minutes, isLessThanOneDay, isOverdue }
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
  }

  const sortTasks = (tasks: Task[]): Task[] => {
    return tasks.sort((a, b) => {
      const aTimeLeft = calculateTimeLeft(a.endDate, a.endTime)
      const bTimeLeft = calculateTimeLeft(b.endDate, b.endTime)

      // Move important tasks with less than 1 day remaining to the top
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

      // For other tasks, sort by end date and time
      return (
        new Date(`${a.endDate}T${a.endTime}`).getTime() -
        new Date(`${b.endDate}T${b.endTime}`).getTime()
      )
    })
  }

  const filteredAndSortedTasks = sortTasks(
    filterTag ? tasks.filter((task) => task.tags.includes(filterTag)) : tasks
  )

  return (
    <div
      className={`min-h-screen w-full ${darkMode ? 'dark bg-gray-900' : 'bg-white'}`}
    >
      <div className="container mx-auto p-4">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold dark:text-white">
            Task Management
          </h1>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setDarkMode(!darkMode)}
          >
            {darkMode ? (
              <Sun className="size-[1.2rem]" />
            ) : (
              <Moon className="size-[1.2rem]" />
            )}
          </Button>
        </div>

        <div className="mb-6 flex flex-col gap-4 sm:flex-row">
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
              }
            }}
          >
            <DialogTrigger asChild>
              <Button
                className="w-full sm:w-auto"
                onClick={() =>
                  setEditingTask({
                    id: 0,
                    name: '',
                    endDate: '',
                    endTime: '',
                    tags: [],
                    isDone: false,
                    important: false,
                  })
                }
              >
                <PlusCircle className="mr-2 size-4" /> Add New Task
              </Button>
            </DialogTrigger>
            <DialogContent className="dark:bg-gray-800 dark:text-white">
              <DialogHeader>
                <DialogTitle className="dark:text-white">
                  {editingTask && editingTask.id !== 0
                    ? 'Edit Task'
                    : 'Create New Task'}
                </DialogTitle>
                <DialogDescription />
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name" className="dark:text-gray-200">
                    Task Name
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={editingTask?.name || ''}
                    onChange={handleInputChange}
                    required
                    className="dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <RadioGroup
                  defaultValue="date"
                  onValueChange={(value) =>
                    setDeadlineType(value as DeadlineType)
                  }
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
                      <Label htmlFor="endDate" className="dark:text-gray-200">
                        End Date
                      </Label>
                      <Input
                        id="endDate"
                        name="endDate"
                        type="date"
                        value={editingTask?.endDate || ''}
                        onChange={handleInputChange}
                        required
                        className="dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="endTime" className="dark:text-gray-200">
                        End Time
                      </Label>
                      <Input
                        id="endTime"
                        name="endTime"
                        type="time"
                        value={editingTask?.endTime || ''}
                        onChange={handleInputChange}
                        required
                        className="dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </>
                ) : (
                  <div className="flex space-x-2">
                    <div>
                      <Label
                        htmlFor="remainingDays"
                        className="dark:text-gray-200"
                      >
                        Days
                      </Label>
                      <Input
                        id="remainingDays"
                        type="number"
                        min="0"
                        value={remainingDays}
                        onChange={(e) => setRemainingDays(e.target.value)}
                        className="dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="remainingHours"
                        className="dark:text-gray-200"
                      >
                        Hours
                      </Label>
                      <Input
                        id="remainingHours"
                        type="number"
                        min="0"
                        max="23"
                        value={remainingHours}
                        onChange={(e) => setRemainingHours(e.target.value)}
                        className="dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="remainingMinutes"
                        className="dark:text-gray-200"
                      >
                        Minutes
                      </Label>
                      <Input
                        id="remainingMinutes"
                        type="number"
                        min="0"
                        max="59"
                        value={remainingMinutes}
                        onChange={(e) => setRemainingMinutes(e.target.value)}
                        className="dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                )}
                <div>
                  <Label htmlFor="tags" className="dark:text-gray-200">
                    Tags (comma-separated)
                  </Label>
                  <Input
                    id="tags"
                    name="tags"
                    value={editingTask?.tags.join(', ') || ''}
                    onChange={handleTagsChange}
                    className="dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="important"
                    checked={editingTask?.important || false}
                    onCheckedChange={(checked) => {
                      if (editingTask?.id) {
                        setEditingTask({
                          ...editingTask,
                          ...{ important: checked as boolean },
                        })
                      }
                    }}
                  />
                  <Label htmlFor="important" className="dark:text-gray-200">
                    IMPORTANT
                  </Label>
                </div>
                <Button type="submit">
                  {editingTask && editingTask.id !== 0
                    ? 'Update Task'
                    : 'Create Task'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <div className="flex w-full flex-col gap-4 sm:flex-row">
            <div className="flex w-full items-center sm:w-[250px]">
              <Filter className="mr-2 size-4 shrink-0" />
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

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredAndSortedTasks.map((task) => {
            const { days, hours, minutes, isLessThanOneDay, isOverdue } =
              calculateTimeLeft(task.endDate, task.endTime)
            return (
              <div
                key={task.id}
                className={`flex cursor-pointer flex-col rounded-lg border p-4 ${
                  task.isDone
                    ? 'bg-muted dark:bg-gray-800'
                    : task.important
                      ? 'bg-yellow-50 dark:bg-yellow-900'
                      : 'dark:bg-gray-700'
                }`}
                onClick={() => editTask(task)}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    id={`task-${task.id}`}
                    checked={task.isDone}
                    onCheckedChange={() => {
                      toggleTaskDone(task.id)
                    }}
                    className="mt-1"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h2
                        className={`break-words text-lg ${task.important ? 'font-bold' : 'font-semibold'} ${
                          task.isDone ? 'line-through' : ''
                        } ${
                          task.important && isLessThanOneDay
                            ? 'text-red-500 dark:text-red-400'
                            : isOverdue
                              ? 'text-red-500 dark:text-red-400'
                              : 'dark:text-white'
                        }`}
                      >
                        {task.name}
                      </h2>
                      {task.important && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertCircle className="mr-1 size-3" />
                          IMPORTANT
                        </Badge>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {task.tags.map((tag, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          style={{
                            color: stringToColor(tag, darkMode),
                            borderColor: stringToColor(tag, darkMode),
                          }}
                          className="hover:bg-current/10 px-3 py-1 text-sm font-semibold transition-colors"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-2 flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
                  <p
                    className={`text-sm ${
                      task.important ? 'font-semibold' : ''
                    } ${
                      isLessThanOneDay || isOverdue
                        ? 'text-red-500 dark:text-red-400'
                        : 'text-muted-foreground dark:text-gray-300'
                    }`}
                  >
                    {isOverdue
                      ? `Overdue (${task.endDate})`
                      : days > 0
                        ? `${days}d ${hours}h ${minutes}m left`
                        : `${hours}h ${minutes}m left`}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        setTaskToDelete(task.id)
                        setIsDeleteDialogOpen(true)
                      }}
                    >
                      <Trash className="size-4" color="#f87171" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="dark:bg-gray-800 dark:text-white">
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription className="dark:text-gray-300">
                Are you sure you want to delete this task? This action cannot be
                undone.
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
                className="dark:bg-red-600 dark:hover:bg-red-700"
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
