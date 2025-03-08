"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Crown, Medal, LogOut } from "lucide-react"
import type { Player } from "@/lib/types"
import { cn } from "@/lib/utils"

export default function GameResults({
  players,
  isHost,
  onPlayAgain,
}: {
  players: Player[]
  isHost: boolean
  onPlayAgain: () => void
}) {
  // Sort players by score in descending order
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score)

  return (
    <div className="space-y-6">
      <Card className="shadow-lg border-2 border-yellow-300 bg-white">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-orange-600">Game Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sortedPlayers.map((player, index) => (
              <div key={`${player.id}-${index}`} className="p-4 bg-yellow-50 rounded-md flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {index === 0 && <Medal className="h-6 w-6 text-yellow-500" />}
                  {index === 1 && <Medal className="h-6 w-6 text-gray-400" />}
                  {index === 2 && <Medal className="h-6 w-6 text-amber-700" />}
                  <span className="font-medium">{player.name}</span>
                  {player.isHost && <Crown className="h-4 w-4 text-yellow-500 ml-1" />}
                </div>
                <span className="text-xl font-bold text-orange-600">{player.score}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-col md:flex-row items-center justify-center gap-4">
            {isHost && (
              <Button
                onClick={onPlayAgain}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8"
              >
                Play Again
              </Button>
            )}
            
            <Button
              onClick={() => {
                // Clear localStorage and redirect to home
                localStorage.removeItem("playerName");
                localStorage.removeItem("playerId");
                window.location.href = "/";
              }}
              variant="outline"
              className="border-orange-300 text-orange-700 hover:bg-orange-100 flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Leave Game
            </Button>
          </div>

          {!isHost && (
            <p className="mt-4 text-center text-orange-700">Waiting for the host to start a new game...</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

