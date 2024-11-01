"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { PlusCircle, Filter, Edit, Trash, Clock, Moon, Sun } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface Task {
  id: number
  name: string
  endDate: string
  endTime: string
  tags: string[]
  isDone: boolean
}

type SortOption = "endDate" | "created" | "name"
type DeadlineType = "date" | "remaining"

export default function Component() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [filterTag, setFilterTag] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>("endDate")
  const [allTags, setAllTags] = useState<string[]>([])
  const [darkMode, setDarkMode] = useState(false)
  const [deadlineType, setDeadlineType] = useState<DeadlineType>("date")
  const [remainingDays, setRemainingDays] = useState("")
  const [remainingHours, setRemainingHours] = useState("")

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
    const tags = Array.from(new Set(tasks.flatMap(task => task.tags)))
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    if (editingTask) {
      setEditingTask({ ...editingTask, [name]: value })
    } else {
      setEditingTask({ id: 0, name: "", endDate: "", endTime: "", tags: [], isDone: false, [name]: value })
    }
  }

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tags = e.target.value.split(",").map((tag) => tag.trim())
    if (editingTask) {
      setEditingTask({ ...editingTask, tags })
    } else {
      setEditingTask({ id: 0, name: "", endDate: "", endTime: "", tags, isDone: false })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingTask) {
      let taskToSave = { ...editingTask }
      if (deadlineType === "remaining") {
        const now = new Date()
        const deadline = new Date(now.getTime() + (parseInt(remainingDays) * 24 * 60 * 60 * 1000) + (parseInt(remainingHours) * 60 * 60 * 1000))
        taskToSave.endDate = deadline.toISOString().split('T')[0]
        taskToSave.endTime = deadline.toTimeString().split(' ')[0].slice(0, 5)
      }
      if (taskToSave.id === 0) {
        // Creating a new task
        const newTask = { ...taskToSave, id: Date.now() }
        setTasks([...tasks, newTask])
      } else {
        // Updating an existing task
        setTasks(tasks.map(task => task.id === taskToSave.id ? taskToSave : task))
      }
      setEditingTask(null)
      setIsOpen(false)
      setDeadlineType("date")
      setRemainingDays("")
      setRemainingHours("")
    }
  }

  const calculateTimeLeft = (endDate: string, endTime: string) => {
    const now = new Date()
    const deadline = new Date(`${endDate}T${endTime}`)
    const diff = deadline.getTime() - now.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const isLessThanOneDay = diff < 24 * 60 * 60 * 1000
    const isOverdue = diff < 0
    return { days, hours, isLessThanOneDay, isOverdue }
  }

  const toggleTaskDone = (id: number) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, isDone: !task.isDone } : task
      )
    )
  }

  const deleteTask = (id: number) => {
    setTasks(tasks.filter(task => task.id !== id))
  }

  const editTask = (task: Task) => {
    setEditingTask(task)
    setIsOpen(true)
    setDeadlineType("date")
  }

  const sortTasks = (tasks: Task[]): Task[] => {
    return tasks.sort((a, b) => {
      if (sortBy === "endDate") {
        return new Date(`${a.endDate}T${a.endTime}`).getTime() - new Date(`${b.endDate}T${b.endTime}`).getTime()
      } else if (sortBy === "created") {
        return a.id - b.id
      } else {
        return a.name.localeCompare(b.name)
      }
    })
  }

  const filteredAndSortedTasks = sortTasks(
    filterTag ? tasks.filter((task) => task.tags.includes(filterTag)) : tasks
  )

  return (
    <div className={`min-h-screen w-full ${darkMode ? 'dark bg-gray-900' : 'bg-white'}`}>
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold mb-4 dark:text-white">Task Management</h1>
          <Button variant="outline" size="icon" onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? <Sun className="h-[1.2rem] w-[1.2rem]" /> : <Moon className="h-[1.2rem] w-[1.2rem]" />}
          </Button>
        </div>
        <div className="flex justify-between items-center mb-4">
          <Dialog open={isOpen} onOpenChange={(open) => {
            setIsOpen(open)
            if (!open) {
              setEditingTask(null)
              setDeadlineType("date")
              setRemainingDays("")
              setRemainingHours("")
            }
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingTask({ id: 0, name: "", endDate: "", endTime: "", tags: [], isDone: false })}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Task
              </Button>
            </DialogTrigger>
            <DialogContent className="dark:bg-gray-800 dark:text-white">
              <DialogHeader>
                <DialogTitle className="dark:text-white">
                  {editingTask && editingTask.id !== 0 ? "Edit Task" : "Create New Task"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name" className="dark:text-gray-200">Task Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={editingTask?.name || ""}
                    onChange={handleInputChange}
                    required
                    className="dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <RadioGroup defaultValue="date" onValueChange={(value) => setDeadlineType(value as DeadlineType)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="date" id="date" />
                    <Label htmlFor="date">End Date</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="remaining" id="remaining" />
                    <Label htmlFor="remaining">Remaining Time</Label>
                  </div>
                </RadioGroup>
                {deadlineType === "date" ? (
                  <>
                    <div>
                      <Label htmlFor="endDate" className="dark:text-gray-200">End Date</Label>
                      <Input
                        id="endDate"
                        name="endDate"
                        type="date"
                        value={editingTask?.endDate || ""}
                        onChange={handleInputChange}
                        required
                        className="dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="endTime" className="dark:text-gray-200">End Time</Label>
                      <Input
                        id="endTime"
                        name="endTime"
                        type="time"
                        value={editingTask?.endTime || ""}
                        onChange={handleInputChange}
                        required
                        className="dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </>
                ) : (
                  <div className="flex space-x-2">
                    <div>
                      <Label htmlFor="remainingDays" className="dark:text-gray-200">Days</Label>
                      <Input
                        id="remainingDays"
                        type="number"
                        min="0"
                        value={remainingDays}
                        onChange={(e) => setRemainingDays(e.target.value)}
                        required
                        className="dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="remainingHours" className="dark:text-gray-200">Hours</Label>
                      <Input
                        id="remainingHours"
                        type="number"
                        min="0"
                        max="23"
                        value={remainingHours}
                        onChange={(e) => setRemainingHours(e.target.value)}
                        required
                        className="dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                )}
                <div>
                  <Label htmlFor="tags" className="dark:text-gray-200">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    name="tags"
                    value={editingTask?.tags.join(", ") || ""}
                    onChange={handleTagsChange}
                    className="dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <Button type="submit">{editingTask && editingTask.id !== 0 ? "Update Task" : "Create Task"}</Button>
              </form>
            </DialogContent>
          </Dialog>
          <div className="flex items-center space-x-2">
            <div className="flex items-center">
              <Filter className="mr-2 h-4 w-4" />
              <Select onValueChange={(value) => setFilterTag(value === "all" ? null : value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by tag" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tags</SelectItem>
                  {allTags.map((tag) => (
                    <SelectItem key={tag} value={tag}>
                      {tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center">
              <Clock className="mr-2 h-4 w-4" />
              <Select onValueChange={(value) => setSortBy(value as SortOption)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="endDate">End Date</SelectItem>
                  <SelectItem value="created">Created Date</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          {filteredAndSortedTasks.map((task) => {
            const { days, hours, isLessThanOneDay, isOverdue } = calculateTimeLeft(task.endDate, task.endTime)
            return (
              <div
                key={task.id}
                className={`border rounded-lg py-2 p-4 flex justify-between items-center ${
                  task.isDone ? "bg-muted dark:bg-gray-800" : "dark:bg-gray-700"
                }`}
              >
                <div className="flex items-center space-x-4">
                  <Checkbox
                    id={`task-${task.id}`}
                    checked={task.isDone}
                    onCheckedChange={() => toggleTaskDone(task.id)}
                  />
                  <div>
                    <div className="flex space-x-2 mt-2">
                      {task.tags.map((tag, index) => (
                        <Badge key={index} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <h2 className={`text-lg font-semibold ${task.isDone ? "line-through" : ""} ${isLessThanOneDay || isOverdue ? "text-red-500  dark:text-red-400" : "dark:text-white"}`}>
                      {task.name}
                    </h2>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <p className={`text-sm ${isLessThanOneDay || isOverdue ? "text-red-500 dark:text-red-400" : "text-muted-foreground dark:text-gray-300"}`}>
                    {isOverdue
                      ? `Overdue (${task.endDate})`
                      : `${days} days, ${hours} hours left`
                    }
                  </p>
                  <Button variant="ghost" size="icon" onClick={() => editTask(task)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteTask(task.id)}>
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
