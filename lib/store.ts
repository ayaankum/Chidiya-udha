import { create } from "zustand"
import type { Player } from "@/lib/types"

interface GameState {
  gameState: "waiting" | "playing" | "results"
  players: Player[]
  isHost: boolean
  currentPlayer: Player | null
  setGameState: (state: "waiting" | "playing" | "results") => void
  setPlayers: (players: Player[]) => void
  setIsHost: (isHost: boolean) => void
  setCurrentPlayer: (player: Player) => void
  resetGame: () => void
}

export const useGameStore = create<GameState>((set) => ({
  gameState: "waiting",
  players: [],
  isHost: false,
  currentPlayer: null,
  setGameState: (state) => set({ gameState: state }),
  setPlayers: (players) => {
    console.log("Setting players in store:", players)
    
    // Ensure no duplicate players by ID
    const uniquePlayers = Object.values(
      players.reduce((acc: Record<string, Player>, player) => {
        acc[player.id] = player
        return acc
      }, {})
    ) as Player[]
    
    set({ players: uniquePlayers })
  },
  setIsHost: (isHost) => set({ isHost }),
  setCurrentPlayer: (player) => set({ currentPlayer: player }),
  resetGame: () => set({
    gameState: "waiting",
    players: [],
    isHost: false,
    currentPlayer: null
  })
}))

