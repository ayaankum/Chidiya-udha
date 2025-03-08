export interface Player {
  id: string
  name: string
  score: number
  isHost: boolean
}

export type GameState = "waiting" | "playing" | "results"

export interface GameObject {
  name: string
  image: string
  canFly: boolean
}

