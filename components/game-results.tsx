"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trophy, Medal, Award, LogOut } from "lucide-react"
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
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score)
  const winners = sortedPlayers.slice(0, 3)

  // Instead of directly redirecting, we should use the proper leaveRoom function
  const handleLeaveGame = () => {
    // We'll use a custom event to trigger the parent component's leaveRoom function
    const leaveEvent = new CustomEvent('leaveGameRequest');
    window.dispatchEvent(leaveEvent);
  };

  return (
    <div className="grid gap-6">
      <Card className="shadow-lg border-2 border-yellow-300 bg-white">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-orange-600 flex items-center justify-center gap-2">
            <Trophy className="h-8 w-8 text-yellow-500" />
            Game Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center">
            {winners.length > 0 && (
              <div className="flex flex-wrap justify-center gap-6 mb-8">
                {winners.map((player, index) => (
                  <div key={player.id} className="flex flex-col items-center">
                    <div
                      className={cn(
                        "w-16 h-16 rounded-full flex items-center justify-center mb-2",
                        index === 0 ? "bg-yellow-400" : index === 1 ? "bg-gray-300" : "bg-amber-600",
                      )}
                    >
                      {index === 0 ? (
                        <Trophy className="h-8 w-8 text-white" />
                      ) : index === 1 ? (
                        <Medal className="h-8 w-8 text-white" />
                      ) : (
                        <Award className="h-8 w-8 text-white" />
                      )}
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-lg">{player.name}</div>
                      <div className="text-orange-600 font-medium">{player.score} points</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="w-full max-w-md">
              <h3 className="text-xl font-bold text-orange-600 mb-4">Final Scores</h3>
              <div className="space-y-2">
                {sortedPlayers.map((player, index) => (
                  <div key={player.id} className="p-3 bg-yellow-50 rounded-md flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-orange-800">#{index + 1}</span>
                      <span className="font-medium">{player.name}</span>
                    </div>
                    <span className="font-bold text-orange-600">{player.score}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-4 justify-center">
              {isHost && (
                <Button 
                  onClick={onPlayAgain} 
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold"
                >
                  Play Again
                </Button>
              )}
              
              <Button
                onClick={handleLeaveGame}
                variant="outline"
                className="border-orange-300 text-orange-700 hover:bg-orange-100 flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Leave Game
              </Button>
            </div>
            
            {!isHost && 
              <p className="mt-4 text-orange-700">
                Waiting for the host to start a new game...
              </p>
            }
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

