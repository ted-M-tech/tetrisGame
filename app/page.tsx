"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Play, Pause, RotateCw, ArrowLeft, ArrowRight, ArrowDown } from "lucide-react"

// テトリスピースの定義
const PIECES = {
  I: [[1, 1, 1, 1]],
  O: [
    [1, 1],
    [1, 1],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
  ],
}

const PIECE_COLORS = {
  I: "bg-cyan-500",
  O: "bg-yellow-500",
  T: "bg-purple-500",
  S: "bg-green-500",
  Z: "bg-red-500",
  J: "bg-blue-500",
  L: "bg-orange-500",
}

const BOARD_WIDTH = 10
const BOARD_HEIGHT = 20

type PieceType = keyof typeof PIECES
type Board = (PieceType | null)[][]

interface GamePiece {
  shape: number[][]
  type: PieceType
  x: number
  y: number
}

export default function TetrisGame() {
  const [board, setBoard] = useState<Board>(() =>
    Array(BOARD_HEIGHT)
      .fill(null)
      .map(() => Array(BOARD_WIDTH).fill(null)),
  )
  const [currentPiece, setCurrentPiece] = useState<GamePiece | null>(null)
  const [nextPiece, setNextPiece] = useState<PieceType | null>(null)
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [lines, setLines] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [gameOver, setGameOver] = useState(false)

  // ランダムなピースを生成
  const getRandomPiece = (): PieceType => {
    const pieces = Object.keys(PIECES) as PieceType[]
    return pieces[Math.floor(Math.random() * pieces.length)]
  }

  // 新しいピースを作成
  const createPiece = (type: PieceType): GamePiece => ({
    shape: PIECES[type],
    type,
    x: Math.floor(BOARD_WIDTH / 2) - Math.floor(PIECES[type][0].length / 2),
    y: 0,
  })

  // ピースを回転
  const rotatePiece = (piece: GamePiece): GamePiece => {
    const rotated = piece.shape[0].map((_, i) => piece.shape.map((row) => row[i]).reverse())
    return { ...piece, shape: rotated }
  }

  // 衝突判定
  const isValidPosition = (piece: GamePiece, board: Board): boolean => {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const newX = piece.x + x
          const newY = piece.y + y

          if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) {
            return false
          }

          if (newY >= 0 && board[newY][newX]) {
            return false
          }
        }
      }
    }
    return true
  }

  // ピースをボードに配置
  const placePiece = (piece: GamePiece, board: Board): Board => {
    const newBoard = board.map((row) => [...row])

    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const boardY = piece.y + y
          const boardX = piece.x + x
          if (boardY >= 0) {
            newBoard[boardY][boardX] = piece.type
          }
        }
      }
    }

    return newBoard
  }

  // 完成した行をクリア
  const clearLines = (board: Board): { newBoard: Board; clearedLines: number } => {
    const newBoard = board.filter((row) => row.some((cell) => cell === null))
    const clearedLines = BOARD_HEIGHT - newBoard.length

    while (newBoard.length < BOARD_HEIGHT) {
      newBoard.unshift(Array(BOARD_WIDTH).fill(null))
    }

    return { newBoard, clearedLines }
  }

  // ピースを移動
  const movePiece = useCallback(
    (dx: number, dy: number) => {
      if (!currentPiece || !isPlaying || gameOver) return

      const newPiece = { ...currentPiece, x: currentPiece.x + dx, y: currentPiece.y + dy }

      if (isValidPosition(newPiece, board)) {
        setCurrentPiece(newPiece)
      } else if (dy > 0) {
        // ピースが下に移動できない場合、ボードに配置
        const newBoard = placePiece(currentPiece, board)
        const { newBoard: clearedBoard, clearedLines } = clearLines(newBoard)

        setBoard(clearedBoard)
        setLines((prev) => prev + clearedLines)
        setScore((prev) => prev + clearedLines * 100 * level)

        // 次のピースを生成
        if (nextPiece) {
          const newPiece = createPiece(nextPiece)
          if (isValidPosition(newPiece, clearedBoard)) {
            setCurrentPiece(newPiece)
            setNextPiece(getRandomPiece())
          } else {
            setGameOver(true)
            setIsPlaying(false)
          }
        }
      }
    },
    [currentPiece, board, isPlaying, gameOver, nextPiece, level],
  )

  // ピースを回転
  const handleRotate = useCallback(() => {
    if (!currentPiece || !isPlaying || gameOver) return

    const rotatedPiece = rotatePiece(currentPiece)
    if (isValidPosition(rotatedPiece, board)) {
      setCurrentPiece(rotatedPiece)
    }
  }, [currentPiece, board, isPlaying, gameOver])

  // キーボード操作
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isPlaying || gameOver) return

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault()
          movePiece(-1, 0)
          break
        case "ArrowRight":
          e.preventDefault()
          movePiece(1, 0)
          break
        case "ArrowDown":
          e.preventDefault()
          movePiece(0, 1)
          break
        case "ArrowUp":
        case " ":
          e.preventDefault()
          handleRotate()
          break
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [movePiece, handleRotate, isPlaying, gameOver])

  // ゲームループ
  useEffect(() => {
    if (!isPlaying || gameOver) return

    const interval = setInterval(
      () => {
        movePiece(0, 1)
      },
      Math.max(100, 1000 - (level - 1) * 100),
    )

    return () => clearInterval(interval)
  }, [movePiece, isPlaying, gameOver, level])

  // レベルアップ
  useEffect(() => {
    setLevel(Math.floor(lines / 10) + 1)
  }, [lines])

  // ゲーム開始
  const startGame = () => {
    const firstPiece = getRandomPiece()
    const secondPiece = getRandomPiece()

    setBoard(
      Array(BOARD_HEIGHT)
        .fill(null)
        .map(() => Array(BOARD_WIDTH).fill(null)),
    )
    setCurrentPiece(createPiece(firstPiece))
    setNextPiece(secondPiece)
    setScore(0)
    setLevel(1)
    setLines(0)
    setIsPlaying(true)
    setGameOver(false)
  }

  // ゲーム一時停止/再開
  const togglePause = () => {
    if (!gameOver) {
      setIsPlaying(!isPlaying)
    }
  }

  // 表示用のボードを作成（現在のピースを含む）
  const displayBoard = () => {
    const display = board.map((row) => [...row])

    if (currentPiece) {
      for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
          if (currentPiece.shape[y][x]) {
            const boardY = currentPiece.y + y
            const boardX = currentPiece.x + x
            if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
              display[boardY][boardX] = currentPiece.type
            }
          }
        }
      }
    }

    return display
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4 relative">
      {/* Floating Start Button */}
      {!isPlaying && !gameOver && (
        <Button onClick={startGame} className="absolute top-4 right-8 z-10" size="lg">
          <Play className="w-4 h-4 mr-2" />
          Start
        </Button>
      )}

      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-white text-center mb-6">Tetris</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* ゲームボード */}
          <div className="lg:col-span-2">
            <Card className="bg-black/20 backdrop-blur border-white/20">
              <CardContent className="p-4">
                <div className="grid grid-cols-10 gap-1 mx-auto w-fit">
                  {displayBoard().map((row, y) =>
                    row.map((cell, x) => (
                      <div
                        key={`${y}-${x}`}
                        className={`w-5 h-5 border border-gray-600 ${cell ? PIECE_COLORS[cell] : "bg-gray-900"}`}
                      />
                    )),
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* サイドパネル */}
          <div className="space-y-4">
            {/* スコア */}
            <Card className="bg-black/20 backdrop-blur border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Score</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-white">
                  <div className="text-2xl font-bold">{score.toLocaleString()}</div>
                </div>
                <div className="flex justify-between text-white">
                  <span>Level:</span>
                  <Badge variant="secondary">{level}</Badge>
                </div>
                <div className="flex justify-between text-white">
                  <span>Lines:</span>
                  <Badge variant="secondary">{lines}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* 次のピース */}
            {nextPiece && (
              <Card className="bg-black/20 backdrop-blur border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Next Piece</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-1 w-fit mx-auto">
                    {PIECES[nextPiece].map((row, y) => (
                      <div key={y} className="flex gap-1">
                        {row.map((cell, x) => (
                          <div key={x} className={`w-3 h-3 ${cell ? PIECE_COLORS[nextPiece] : "bg-transparent"}`} />
                        ))}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* コントロール */}
            <Card className="bg-black/20 backdrop-blur border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(isPlaying || gameOver) && (
                  <div className="grid grid-cols-2 gap-2">
                    <Button onClick={togglePause} disabled={gameOver}>
                      {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                      {isPlaying ? "Pause" : "Resume"}
                    </Button>
                    <Button onClick={startGame} variant="outline">
                      New Game
                    </Button>
                  </div>
                )}

                {gameOver && <div className="text-center text-red-400 font-bold">Game Over</div>}

                <div className="space-y-2 text-sm text-white/80">
                  <div className="flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    <ArrowRight className="w-4 h-4" />
                    <span>Move</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ArrowDown className="w-4 h-4" />
                    <span>Drop</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <RotateCw className="w-4 h-4" />
                    <span>Rotate (↑ or Space)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
