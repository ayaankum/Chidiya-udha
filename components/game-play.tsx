"use client"

import { useEffect, useState } from "react"
import type { Socket } from "socket.io-client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Hand } from "lucide-react"
import { useGameStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { useSound } from "@/lib/use-sound"

export default function GamePlay({
  onReaction,
  socket,
  roomId,
  playerId,
}: {
  onReaction: (reacted: boolean) => void
  socket: Socket | null
  roomId: string
  playerId: string
}) {
  const [currentObject, setCurrentObject] = useState<{
    name: string
    image: string
    canFly: boolean
  } | null>(null)
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const [hasReacted, setHasReacted] = useState<boolean>(false)
  const [reactionResult, setReactionResult] = useState<"correct" | "wrong" | null>(null)
  const { players } = useGameStore()

  const correctSound = useSound("/sounds/correct.mp3")
  const wrongSound = useSound("/sounds/wrong.mp3")

  useEffect(() => {
    if (!socket) return

    socket.on("newObject", (data) => {
      setCurrentObject(data.object)
      setTimeLeft(data.timeToReact)
      setHasReacted(false)
      setReactionResult(null)
    })

    socket.on("reactionResult", (data) => {
      if (data.playerId === playerId) {
        setReactionResult(data.correct ? "correct" : "wrong")
        if (data.correct) {
          correctSound.play()
        } else {
          wrongSound.play()
        }
      }
    })

    socket.on("updateTimeLeft", (data) => {
      setTimeLeft(data.timeLeft)
    })

    return () => {
      socket.off("newObject")
      socket.off("reactionResult")
      socket.off("updateTimeLeft")
    }
  }, [socket, playerId])

  const handleReaction = () => {
    if (!hasReacted && currentObject) {
      setHasReacted(true)
      onReaction(true)
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="md:col-span-2">
        <Card className="shadow-lg border-2 border-yellow-300 bg-white h-full">
          <CardContent className="p-6 flex flex-col items-center justify-center min-h-[400px]">
            {currentObject ? (
              <div className="text-center">
                <div className="mb-4 text-2xl font-bold text-orange-600">{currentObject.name}</div>
                <div className="relative mb-6">
                  <img
                    src={currentObject.image || "/placeholder.svg"}
                    alt={currentObject.name}
                    className="w-48 h-48 object-contain mx-auto"
                  />
                  {reactionResult && (
                    <div
                      className={cn(
                        "absolute -top-4 -right-4 w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold",
                        reactionResult === "correct" ? "bg-green-500" : "bg-red-500",
                      )}
                    >
                      {reactionResult === "correct" ? "✓" : "✗"}
                    </div>
                  )}
                </div>
                <div className="text-lg font-medium text-orange-700">Time left: {(timeLeft / 1000).toFixed(1)}s</div>
              </div>
            ) : (
              <div className="text-center text-orange-700">
                <div className="animate-pulse">Waiting for the next object...</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div>
        <Card className="shadow-lg border-2 border-yellow-300 bg-white h-full">
          <CardContent className="p-6 flex flex-col">
            <div className="flex-1 mb-6">
              <h3 className="text-xl font-bold text-orange-600 mb-4">Leaderboard</h3>
              <div className="space-y-2">
                {players
                  .sort((a, b) => b.score - a.score)
                  .map((player, index) => (
                    <div
                      key={player.id}
                      className={cn(
                        "p-2 rounded-md flex items-center justify-between",
                        player.id === playerId ? "bg-yellow-200" : "bg-yellow-50",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-orange-800">#{index + 1}</span>
                        <span className="font-medium">{player.name}</span>
                      </div>
                      <span className="font-bold text-orange-600">{player.score}</span>
                    </div>
                  ))}
              </div>
            </div>

            <Button
              className={cn(
                "h-24 text-xl font-bold transition-all",
                hasReacted
                  ? "bg-gray-300 hover:bg-gray-300 cursor-not-allowed"
                  : "bg-orange-500 hover:bg-orange-600 active:scale-95",
              )}
              disabled={hasReacted}
              onClick={handleReaction}
            >
              <Hand className="h-8 w-8 mr-2" />
              Raise Hand!
            </Button>
            <p className="text-center text-sm mt-2 text-orange-700">Press only if the object can fly!</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

