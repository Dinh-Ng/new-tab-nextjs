'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, RotateCcw, Undo2 } from 'lucide-react'

import { Button } from '@/components/ui/button'

type Grid = number[][]

const GRID_SIZE = 4

const getEmptyGrid = (): Grid =>
  Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0))

export default function Game2048() {
  const [grid, setGrid] = useState<Grid>(getEmptyGrid())
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [history, setHistory] = useState<{ grid: Grid; score: number }[]>([])
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize helper to add a random tile (2 or 4) to a random empty spot
  const addNewTile = useCallback((currentGrid: Grid): Grid => {
    const emptyTiles: { r: number; c: number }[] = []
    currentGrid.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (cell === 0) emptyTiles.push({ r, c })
      })
    })

    if (emptyTiles.length === 0) return currentGrid

    const { r, c } = emptyTiles[Math.floor(Math.random() * emptyTiles.length)]
    const newGrid = currentGrid.map((row) => [...row])
    newGrid[r][c] = Math.random() > 0.9 ? 4 : 2
    return newGrid
  }, [])

  const initializeGame = useCallback(() => {
    let newGrid = getEmptyGrid()
    newGrid = addNewTile(newGrid)
    newGrid = addNewTile(newGrid)
    setGrid(newGrid)
    setScore(0)
    setGameOver(false)
    setHistory([])
    localStorage.removeItem('2048-state')
  }, [addNewTile])

  // Load Game State on window mount (client-side only)
  useEffect(() => {
    const savedHighScore = localStorage.getItem('2048-highscore')
    if (savedHighScore) setHighScore(parseInt(savedHighScore))

    const savedState = localStorage.getItem('2048-state')
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState)
        setGrid(parsed.grid)
        setScore(parsed.score)
        setHistory(parsed.history || [])
        setIsInitialized(true)
      } catch (e) {
        initializeGame()
        setIsInitialized(true)
      }
    } else {
      initializeGame()
      setIsInitialized(true)
    }
  }, [initializeGame])

  // Save Game State
  useEffect(() => {
    if (!isInitialized) return

    if (gameOver) {
      localStorage.removeItem('2048-state')
    } else {
      const state = { grid, score, history }
      localStorage.setItem('2048-state', JSON.stringify(state))
    }

    if (score > highScore) {
      setHighScore(score)
      localStorage.setItem('2048-highscore', score.toString())
    }
  }, [grid, score, history, highScore, gameOver, isInitialized])

  // Undo Function
  const undo = () => {
    if (history.length === 0 || gameOver) return

    const previousState = history[history.length - 1]
    const newHistory = history.slice(0, -1)

    setGrid(previousState.grid)
    setScore(previousState.score)
    setHistory(newHistory)
  }

  // Game Logic: Move & Merge
  const move = useCallback(
    (direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
      if (gameOver) return

      setGrid((currentGrid) => {
        let moved = false
        let newScore = score
        const newGrid = currentGrid.map((row) => [...row])

        const slide = (row: number[]) => {
          const arr = row.filter((val) => val)
          const missing = GRID_SIZE - arr.length
          const zeros = Array(missing).fill(0)
          return arr.concat(zeros)
        }

        const combine = (row: number[]) => {
          for (let i = 0; i < GRID_SIZE - 1; i++) {
            if (row[i] !== 0 && row[i] === row[i + 1]) {
              row[i] *= 2
              row[i + 1] = 0
              newScore += row[i]
              moved = true
            }
          }
          return row
        }

        const operate = (row: number[]) => {
          const initial = [...row]
          let arr = slide(row)
          arr = combine(arr)
          arr = slide(arr)
          if (JSON.stringify(initial) !== JSON.stringify(arr)) moved = true
          return arr
        }

        if (direction === 'LEFT' || direction === 'RIGHT') {
          for (let i = 0; i < GRID_SIZE; i++) {
            if (direction === 'RIGHT') newGrid[i].reverse()
            newGrid[i] = operate(newGrid[i])
            if (direction === 'RIGHT') newGrid[i].reverse()
          }
        } else {
          // Transpose for Up/Down
          for (let j = 0; j < GRID_SIZE; j++) {
            let column = [
              newGrid[0][j],
              newGrid[1][j],
              newGrid[2][j],
              newGrid[3][j],
            ]
            if (direction === 'DOWN') column.reverse()
            column = operate(column)
            if (direction === 'DOWN') column.reverse()
            for (let i = 0; i < GRID_SIZE; i++) newGrid[i][j] = column[i]
          }
        }

        if (moved) {
          // Save history before updating state
          setHistory((prev) => {
            const newHist = [...prev, { grid: currentGrid, score }]
            return newHist.slice(-5) // Keep last 5 moves
          })

          setScore(newScore)
          const finalGrid = addNewTile(newGrid)

          // Check Game Over
          const isFull = finalGrid.every((row) =>
            row.every((cell) => cell !== 0)
          )
          if (isFull) {
            let canMove = false
            for (let r = 0; r < GRID_SIZE; r++) {
              for (let c = 0; c < GRID_SIZE; c++) {
                const val = finalGrid[r][c]
                if (c < GRID_SIZE - 1 && finalGrid[r][c + 1] === val)
                  canMove = true
                if (r < GRID_SIZE - 1 && finalGrid[r + 1][c] === val)
                  canMove = true
              }
            }
            if (!canMove) setGameOver(true)
          }
          return finalGrid
        }
        return currentGrid
      })
    },
    [addNewTile, gameOver, score]
  )

  // Keyboard Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          move('UP')
          break
        case 'ArrowDown':
          move('DOWN')
          break
        case 'ArrowLeft':
          move('LEFT')
          break
        case 'ArrowRight':
          move('RIGHT')
          break
        default:
          return
      }
      e.preventDefault()
    }

    let touchStartX = 0
    let touchStartY = 0
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX
      touchStartY = e.touches[0].clientY
    }
    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartX || !touchStartY) return
      const touchEndX = e.changedTouches[0].clientX
      const touchEndY = e.changedTouches[0].clientY
      const diffX = touchEndX - touchStartX
      const diffY = touchEndY - touchStartY

      if (Math.abs(diffX) < 30 && Math.abs(diffY) < 30) return // Ignore taps

      if (Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX > 0) move('RIGHT')
        else move('LEFT')
      } else {
        if (diffY > 0) move('DOWN')
        else move('UP')
      }
      // Reset
      touchStartX = 0
      touchStartY = 0
      e.preventDefault()
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('touchstart', handleTouchStart, { passive: false })
    window.addEventListener('touchend', handleTouchEnd)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [move])

  const getCellColor = (value: number) => {
    const colors: { [key: number]: string } = {
      0: 'bg-muted/30',
      2: 'bg-gray-200 text-gray-800 dark:bg-slate-700 dark:text-slate-100',
      4: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-100',
      8: 'bg-orange-200 text-orange-800 dark:bg-orange-900/60 dark:text-orange-100',
      16: 'bg-orange-300 text-orange-800 dark:bg-orange-900/80 dark:text-orange-100',
      32: 'bg-orange-400 text-white dark:bg-orange-600',
      64: 'bg-orange-500 text-white dark:bg-orange-500',
      128: 'bg-yellow-400 text-white dark:bg-yellow-600',
      256: 'bg-yellow-500 text-white dark:bg-yellow-500',
      512: 'bg-yellow-600 text-white dark:bg-yellow-400',
      1024: 'bg-yellow-700 text-white dark:bg-yellow-300',
      2048: 'bg-yellow-800 text-white dark:bg-yellow-200',
      4096: 'bg-yellow-900 text-white dark:bg-yellow-100',
    }
    return colors[value] || 'bg-black text-white'
  }

  if (!isInitialized) return null // Prevent hydration mismatch

  return (
    <div className="flex min-h-[calc(100vh-4rem)] w-full flex-col items-center justify-center p-4">
      <div className="flex w-full max-w-md items-center justify-between pb-8">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/game">
            <ArrowLeft className="h-6 w-6" />
          </Link>
        </Button>
        <div className="text-center">
          <h1 className="text-4xl font-bold">2048</h1>
          <div className="text-sm text-muted-foreground">Join the numbers!</div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={undo}
            disabled={history.length === 0 || gameOver}
            aria-label="Undo"
          >
            <Undo2 className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={initializeGame}
            aria-label="New Game"
          >
            <RotateCcw className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="mb-6 flex w-full max-w-md justify-between rounded-xl bg-muted/50 p-4">
        <div className="flex flex-col items-center">
          <span className="text-xs font-bold uppercase text-muted-foreground">
            Score
          </span>
          <span className="text-xl font-bold">{score}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-xs font-bold uppercase text-muted-foreground">
            Best
          </span>
          <span className="text-xl font-bold">{highScore}</span>
        </div>
      </div>

      <div className="relative rounded-xl bg-card p-4 shadow-xl ring-1 ring-border">
        {gameOver && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 rounded-xl bg-background/80 backdrop-blur-sm">
            <h2 className="text-3xl font-bold">Game Over!</h2>
            <Button onClick={initializeGame}>Try Again</Button>
          </div>
        )}

        <div className="grid grid-cols-4 gap-3">
          {grid.map((row, r) =>
            row.map((cell, c) => (
              <div
                key={`${r}-${c}`}
                className={`flex h-16 w-16 items-center justify-center rounded-lg text-2xl font-bold shadow-sm transition-all duration-100 md:h-20 md:w-20 ${getCellColor(
                  cell
                )}`}
              >
                {cell !== 0 ? cell : ''}
              </div>
            ))
          )}
        </div>
      </div>

      <p className="mt-8 text-sm text-muted-foreground">
        Use <span className="font-bold">Arrow Keys</span> or{' '}
        <span className="font-bold">Swipe</span> to move tiles.
      </p>
    </div>
  )
}
