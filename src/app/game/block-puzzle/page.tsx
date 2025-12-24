'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { ArrowLeft, RotateCcw, RefreshCw, Trophy } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'

// --- Types ---
type Grid = (number | null)[][] // null = empty, number = index of color/texture (simplification: 1 for filled)
type BlockShape = number[][]
type Block = {
  id: string
  shape: BlockShape
  color: string
}

// --- Constants ---
const GRID_SIZE = 8
const CELL_SIZE_REM = 3 // Base cell size for calculations

// Standard Polyominoes + variations
const SHAPES: BlockShape[] = [
  [[1]], // Dot
  [[1, 1]], // 2-Line
  [[1], [1]], // 2-Line Vertical
  [[1, 1, 1]], // 3-Line
  [[1], [1], [1]], // 3-Line Vertical
  [[1, 1], [1, 1]], // Box
  [[1, 1, 1, 1]], // 4-Line
  [[1], [1], [1], [1]], // 4-Line Vertical
  [[1, 0], [1, 0], [1, 1]], // L
  [[0, 1], [0, 1], [1, 1]], // Reverse L
  [[1, 1, 1], [0, 1, 0]], // T
  [[1, 1, 0], [0, 1, 1]], // Z
  [[0, 1, 1], [1, 1, 0]], // S
  [[1, 1, 1], [1, 0, 0]], // L-big
  [[1, 1, 1], [0, 0, 1]], // J-big
  [[1, 1], [1, 0], [1, 0]], // L-long
  [[1, 1], [0, 1], [0, 1]], // J-long
]

const COLORS = [
  'bg-amber-600',
  'bg-orange-600',
  'bg-yellow-700',
  'bg-red-700',
  'bg-emerald-700',
  'bg-cyan-700',
  'bg-indigo-600',
  'bg-rose-600',
]

// --- Helper Functions ---

const createEmptyGrid = (): Grid => Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null))

const getRandomBlock = (): Block => {
  const shapeIdx = Math.floor(Math.random() * SHAPES.length)
  const colorIdx = Math.floor(Math.random() * COLORS.length)
  return {
    id: Math.random().toString(36).substr(2, 9),
    shape: SHAPES[shapeIdx],
    color: COLORS[colorIdx],
  }
}

const rotateMatrix = (matrix: BlockShape): BlockShape => {
  const rows = matrix.length
  const cols = matrix[0].length
  const newMatrix: BlockShape = Array(cols).fill(0).map(() => Array(rows).fill(0))

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      newMatrix[c][rows - 1 - r] = matrix[r][c]
    }
  }
  return newMatrix
}

export default function BlockPuzzleGame() {
  // Game State
  const [grid, setGrid] = useState<Grid>(createEmptyGrid())
  const [queue, setQueue] = useState<(Block | null)[]>([])
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [selectedBlockIdx, setSelectedBlockIdx] = useState<number | null>(null)

  // Initialization
  useEffect(() => {
    // Load high score
    const saved = localStorage.getItem('block-puzzle-highscore')
    if (saved) setHighScore(parseInt(saved))

    startNewGame()
  }, [])

  useEffect(() => {
    if (score > highScore) {
        setHighScore(score)
        localStorage.setItem('block-puzzle-highscore', score.toString())
    }
  }, [score, highScore])

  const startNewGame = () => {
    setGrid(createEmptyGrid())
    setScore(0)
    setGameOver(false)
    setSelectedBlockIdx(null)
    fillQueue()
  }

  const fillQueue = useCallback(() => {
    setQueue([getRandomBlock(), getRandomBlock(), getRandomBlock()])
  }, [])

  // --- Game Logic ---

  const checkPlacement = (r: number, c: number, shape: BlockShape): boolean => {
    for (let i = 0; i < shape.length; i++) {
        for (let j = 0; j < shape[0].length; j++) {
            if (shape[i][j] === 1) {
                const fr = r + i
                const fc = c + j
                // Check bounds
                if (fr < 0 || fr >= GRID_SIZE || fc < 0 || fc >= GRID_SIZE) return false
                // Check overlap
                if (grid[fr][fc] !== null) return false
            }
        }
    }
    return true
  }

  const canPlaceAnywhere = (block: Block): boolean => {
      // Very naive check, can be optimized
      for (let r=0; r<GRID_SIZE; r++) {
          for (let c=0; c<GRID_SIZE; c++) {
              if (checkPlacement(r, c, block.shape)) return true
          }
      }
      return false
  }

  // Check Game Over condition
  useEffect(() => {
    if (queue.every(b => b === null)) {
        fillQueue()
        return
    }

    if (queue.some(b => b !== null)) {
        // Check if ANY remaining block can be placed
        const activeBlocks = queue.filter(b => b !== null) as Block[]
        // Optimization: if we have blocks, we check.
        // If NO block can be placed anywhere, it's game over.
        // Note: This needs to consider rotation if we allow rotation BEFORE check.
        // Assuming current rotation state. If we allow rotation in queue, user can try rotating.
        // So strict "Game Over" is hard if rotation is allowed.
        // We will just check basic placement for now.
        // A robust check would try all 4 rotations for each block.

        let possible = false
        // Check all blocks in queue
        for (const block of activeBlocks) {
             let blockPossible = false
             // Check 4 rotations
             let currentShape = block.shape
             for(let rot=0; rot<4; rot++) {
                 if (canPlaceAnywhere({ ...block, shape: currentShape })) {
                     blockPossible = true
                     break
                 }
                 currentShape = rotateMatrix(currentShape)
             }
             if (blockPossible) {
                 possible = true
                 break
             }
        }

        if (!possible && activeBlocks.length > 0) {
            setGameOver(true)
        }
    }
  }, [queue, grid])


  const placeBlock = (r: number, c: number) => {
    if (selectedBlockIdx === null || queue[selectedBlockIdx] === null) return

    const block = queue[selectedBlockIdx]!
    if (!checkPlacement(r, c, block.shape)) return

    // 1. Place Block
    const newGrid = grid.map(row => [...row])
    let placedCount = 0
    for (let i = 0; i < block.shape.length; i++) {
      for (let j = 0; j < block.shape[0].length; j++) {
        if (block.shape[i][j] === 1) {
            newGrid[r + i][c + j] = 1 // Simplified: just mark as filled. Can store color idx.
            placedCount++
        }
      }
    }

    // 2. Score for placement
    let points = placedCount

    // 3. Check Lines
    const linesToClear: { type: 'row' | 'col', index: number }[] = []

    // Check Rows
    for (let i = 0; i < GRID_SIZE; i++) {
        if (newGrid[i].every(cell => cell !== null)) {
            linesToClear.push({ type: 'row', index: i })
        }
    }
    // Check Cols
    for (let j = 0; j < GRID_SIZE; j++) {
        let full = true
        for (let i = 0; i < GRID_SIZE; i++) {
            if (newGrid[i][j] === null) {
                full = false
                break
            }
        }
        if (full) linesToClear.push({ type: 'col', index: j })
    }

    if (linesToClear.length > 0) {
        // Clear lines
        linesToClear.forEach(line => {
            if (line.type === 'row') {
                for (let c=0; c<GRID_SIZE; c++) newGrid[line.index][c] = null
            } else {
                for (let r=0; r<GRID_SIZE; r++) newGrid[r][line.index] = null
            }
        })
        // Combo score: 1 line = 10, 2 = 30, 3 = 60, etc. (triangular * 10)
        const n = linesToClear.length
        points += (n * (n + 1) / 2) * 10
    }

    setScore(s => s + points)
    setGrid(newGrid)

    // 4. Update Queue
    const newQueue = [...queue]
    newQueue[selectedBlockIdx] = null
    setQueue(newQueue)
    setSelectedBlockIdx(null)
  }

  const rotateBlockInQueue = (idx: number, e: React.MouseEvent) => {
      e.stopPropagation() // Prevent selection if needed, or handle both
      const block = queue[idx]
      if (!block) return

      const newBlock = { ...block, shape: rotateMatrix(block.shape) }
      const newQueue = [...queue]
      newQueue[idx] = newBlock
      setQueue(newQueue)
  }

  const swapBlocks = () => {
      // Cost to swap? Free for now, maybe add cooldown or score cost later
      if (score >= 100) { // Example cost
         setScore(s => s - 100)
         fillQueue()
         setSelectedBlockIdx(null)
      }
  }

  // --- Render Helpers ---

  // Ghost block preview
  const [hoverPos, setHoverPos] = useState<{r: number, c: number} | null>(null)

  return (
    <div className="flex min-h-[calc(100vh-4rem)] w-full flex-col items-center justify-center p-4 bg-stone-100 dark:bg-stone-950">

      {/* Header */}
      <div className="flex w-full max-w-md items-center justify-between pb-6">
        <Button variant="ghost" size="icon" asChild className="text-stone-700 dark:text-stone-300">
          <Link href="/game">
            <ArrowLeft className="h-6 w-6" />
          </Link>
        </Button>
        <div className="flex flex-col items-center">
            <h1 className="text-3xl font-bold text-stone-800 dark:text-stone-200">Wood Block</h1>
        </div>
        <div className="flex gap-2">
            <Button
                variant="outline"
                size="icon"
                onClick={startNewGame}
                aria-label="New Game"
                className="border-stone-300 bg-stone-200 text-stone-700 hover:bg-stone-300 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300"
            >
                <RotateCcw className="h-5 w-5" />
            </Button>
        </div>
      </div>

      {/* Score Board */}
      <div className="mb-6 flex w-full max-w-md gap-4">
        <div className="flex flex-1 items-center justify-between rounded-xl bg-orange-100 p-4 shadow-inner ring-1 ring-orange-200 dark:bg-orange-950/30 dark:ring-orange-900">
            <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-orange-600 dark:text-orange-500" />
                <span className="text-sm font-bold uppercase text-orange-800 dark:text-orange-400">Score</span>
            </div>
            <span className="text-2xl font-black text-orange-900 dark:text-orange-100">{score}</span>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center rounded-xl bg-stone-200 p-2 shadow-inner dark:bg-stone-900">
            <span className="text-xs font-bold uppercase text-stone-500">Best</span>
            <span className="text-lg font-bold text-stone-700 dark:text-stone-300">{highScore}</span>
        </div>
      </div>

      {/* Game Board Container */}
      <div className="relative rounded-lg bg-[#e3d5c5] p-3 shadow-2xl ring-4 ring-[#d4c5b5] dark:bg-[#2a2622] dark:ring-[#3d3630]">
         {gameOver && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-6 rounded-lg bg-black/60 backdrop-blur-sm">
                <h2 className="text-4xl font-black text-white drop-shadow-lg">Game Over!</h2>
                <div className="text-2xl font-bold text-orange-200">Score: {score}</div>
                <Button size="lg" onClick={startNewGame} className="bg-orange-600 font-bold text-white hover:bg-orange-700">Try Again</Button>
            </div>
         )}

         {/* Grid */}
         <div
            className="grid gap-1 bg-[#d4c5b5] p-1 dark:bg-[#3d3630]"
            style={{
                gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
                width: 'min(85vw, 400px)',
                height: 'min(85vw, 400px)'
            }}
            onMouseLeave={() => setHoverPos(null)}
         >
           {grid.map((row, r) =>
             row.map((cell, c) => {
               // Determine cell appearance
               const isFilled = cell !== null
               const isGhost = hoverPos && selectedBlockIdx !== null && queue[selectedBlockIdx] !== null &&
                               checkPlacement(hoverPos.r, hoverPos.c, queue[selectedBlockIdx]!.shape) &&
                               r >= hoverPos.r && r < hoverPos.r + queue[selectedBlockIdx]!.shape.length &&
                               c >= hoverPos.c && c < hoverPos.c + queue[selectedBlockIdx]!.shape[0].length &&
                               queue[selectedBlockIdx]!.shape[r - hoverPos.r][c - hoverPos.c] === 1

               return (
                 <div
                   key={`${r}-${c}`}
                   className={`
                      relative flex h-full w-full items-center justify-center rounded-sm transition-all duration-150
                      ${isFilled
                        ? 'bg-[url("https://www.transparenttextures.com/patterns/wood-pattern.png")] bg-amber-700 shadow-[inset_0_-2px_4px_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(255,255,255,0.2)]'
                        : 'bg-[#cfc0b0] shadow-inner dark:bg-[#332f2a]'}
                      ${isGhost && !isFilled ? 'bg-amber-700/50' : ''}
                   `}
                   onClick={() => placeBlock(r, c)}
                   onMouseEnter={() => setHoverPos({r, c})}
                 >
                   {/* Optional: Innerbevel for wood look */}
                   {isFilled && <div className="absolute inset-1 rounded-sm border border-white/10" />}
                 </div>
               )
             })
           )}
         </div>
      </div>

      {/* Controls: Reset/Powerups */}
      <div className="mt-8 flex w-full max-w-md items-center justify-between px-4">
        <span className="text-xs font-medium text-stone-500">Tap shape to select/rotate</span>
        <Button
            variant="ghost"
            size="sm"
            className={`gap-2 ${score >= 100 ? 'text-amber-700 dark:text-amber-500' : 'text-stone-400'}`}
            disabled={score < 100}
            onClick={swapBlocks}
        >
            <RefreshCw className={`h-4 w-4 ${score >= 100 ? '' : 'opacity-50'}`} />
            <span className="font-bold">100</span>
        </Button>
      </div>

      {/* Block Queue */}
      <div className="mt-4 flex h-32 w-full max-w-md items-center justify-center gap-6">
        {queue.map((block, idx) => (
            <div
                key={idx}
                className={`
                    relative flex h-24 w-24 cursor-pointer items-center justify-center rounded-xl transition-all
                    ${selectedBlockIdx === idx
                        ? 'bg-amber-100 ring-2 ring-amber-500 dark:bg-amber-900/40'
                        : 'bg-transparent hover:bg-stone-200 dark:hover:bg-stone-800'}
                    ${block === null ? 'invisible' : ''}
                `}
                onClick={(e) => {
                    if (selectedBlockIdx === idx) {
                        rotateBlockInQueue(idx, e)
                    } else {
                        setSelectedBlockIdx(idx)
                    }
                }}
            >
                {block && (
                    <div
                        className="grid gap-[2px]"
                        style={{
                            gridTemplateColumns: `repeat(${block.shape[0].length}, 1fr)`,
                            // Scale down for preview
                            transform: 'scale(0.6)'
                        }}
                    >
                        {block.shape.map((row, br) =>
                            row.map((cell, bc) => (
                                <div
                                    key={`${br}-${bc}`}
                                    className={`
                                        h-8 w-8 rounded-sm
                                        ${cell ? 'bg-amber-700 shadow-sm' : 'bg-transparent'}
                                    `}
                                />
                            ))
                        )}
                    </div>
                )}
            </div>
        ))}
      </div>

    </div>
  )
}
