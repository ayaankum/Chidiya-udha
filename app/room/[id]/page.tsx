"use client"

import { useEffect, useState } from "react"
import { use } from "react"
import GameRoom from "@/components/game-room"
import { Spinner } from "@/components/ui/spinner"
import { useRouter } from "next/navigation"

export default function Room({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const resolvedParams = use(params)
  const roomId = resolvedParams.id
  
  const [playerName, setPlayerName] = useState<string | null>(null)
  const [playerId, setPlayerId] = useState<string | null>(null)
  
  useEffect(() => {
    // Get player info from localStorage
    const storedName = localStorage.getItem("playerName")
    const storedId = localStorage.getItem("playerId")
    
    if (!storedName || !storedId) {
      // If no player info, redirect to home page
      router.push("/")
      return
    }
    
    setPlayerName(storedName)
    setPlayerId(storedId)
  }, [router])
  
  // Show loading state while getting player info
  if (!playerName || !playerId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-yellow-100 to-orange-100">
        <Spinner size="lg" />
      </div>
    )
  }
  
  return <GameRoom roomId={roomId} initialPlayerName={playerName} initialPlayerId={playerId} />
}

