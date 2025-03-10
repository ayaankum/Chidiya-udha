"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Crown, Timer, Users, UserMinus } from "lucide-react"
import type { Player } from "@/lib/types"
import { useEffect, useState, useRef } from 'react';
import { cn } from "@/lib/utils"

export default function WaitingRoom({
  players,
  isHost,
  onStartGame,
  gameDuration,
  onDurationChange,
}: {
  players: Player[]
  isHost: boolean
  onStartGame: () => void
  gameDuration: number
  onDurationChange: (value: number) => void
}) {
  const prevPlayersRef = useRef<Player[]>([]);
  const [playerChanges, setPlayerChanges] = useState<{
    joins: {[key: string]: boolean},
    leaves: string[]
  }>({
    joins: {},
    leaves: []
  });
  
  // Track player changes with useEffect to highlight changes
  useEffect(() => {
    if (prevPlayersRef.current.length > 0) {
      // Find players who left
      const leftPlayers = prevPlayersRef.current.filter(
        prev => !players.some(current => current.id === prev.id)
      );
      
      // Find players who joined
      const newJoins = players.reduce((acc: {[key: string]: boolean}, player) => {
        if (!prevPlayersRef.current.some(prev => prev.id === player.id)) {
          acc[player.id] = true;
        }
        return acc;
      }, {});
      
      if (leftPlayers.length > 0 || Object.keys(newJoins).length > 0) {
        // Update changes state
        setPlayerChanges({
          joins: {...playerChanges.joins, ...newJoins},
          leaves: [...leftPlayers.map(p => p.name)]
        });
        
        // Clear highlights after animation
        setTimeout(() => {
          setPlayerChanges(prev => ({
            joins: {},
            leaves: []
          }));
        }, 3000);
      }
    }
    
    // Update reference for next comparison
    prevPlayersRef.current = [...players];
  }, [players]);
  
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="shadow-lg border-2 border-yellow-300 bg-white">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-orange-600 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Players in Room ({players.length})
          </CardTitle>
          
          {playerChanges.leaves.length > 0 && (
            <div className="text-sm text-orange-500 flex items-center gap-1 animate-pulse">
              <UserMinus className="h-4 w-4" />
              {playerChanges.leaves.join(", ")} left the room
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {players.map((player) => (
              <div 
                key={player.id} 
                className={cn(
                  "p-3 rounded-md flex items-center justify-between transition-all",
                  playerChanges.joins[player.id] ? 
                    "bg-yellow-200 animate-pulse" : 
                    "bg-yellow-50"
                )}
              >
                <div className="flex items-center gap-2">
                  {player.isHost && <Crown className="h-4 w-4 text-yellow-500" />}
                  <span className="font-medium">{player.name}</span>
                </div>
                {player.isHost && <span className="text-sm text-orange-500 font-medium">Host</span>}
              </div>
            ))}
            {players.length === 0 && <p className="text-orange-700 text-center py-4">No players have joined yet</p>}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg border-2 border-yellow-300 bg-white">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-orange-600">Game Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {isHost ? (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 font-medium text-orange-700">
                    <Timer className="h-5 w-5" />
                    Game Duration: {gameDuration} seconds
                  </label>
                </div>
                <Slider
                  value={[gameDuration]}
                  min={5}
                  max={30}
                  step={5}
                  onValueChange={(value) => onDurationChange(value[0])}
                  className="py-4"
                />
              </div>

              <div className="pt-4">
                <Button
                  onClick={onStartGame}
                  // disabled={players.length < 2}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold"
                >
                  Start Game
                </Button>
                {players.length < 2 && (
                  <p className="text-sm text-orange-600 mt-2 text-center">Need at least 2 players to start</p>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="animate-pulse flex flex-col items-center">
                <Crown className="h-12 w-12 text-yellow-500 mb-2" />
                <p className="text-orange-700 font-medium text-center">Waiting for the host to start the game...</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

