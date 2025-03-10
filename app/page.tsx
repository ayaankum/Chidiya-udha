"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { nanoid } from "nanoid"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import GameLogo from "@/components/game-logo"
import Footer from '@/components/footer'
import { developerInfo } from '@/lib/config'

export default function Home() {
  const router = useRouter()
  const [createPlayerName, setCreatePlayerName] = useState("")
  const [joinPlayerName, setJoinPlayerName] = useState("")
  const [roomId, setRoomId] = useState("")

  // Clean up any existing session data when landing on home page
  useEffect(() => {
    localStorage.removeItem("playerName");
    localStorage.removeItem("playerId");
  }, []);

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault()
    if (!createPlayerName) return

    // Generate a room ID
    const newRoomId = nanoid(6).toUpperCase()

    // Store player info in localStorage
    localStorage.setItem("playerName", createPlayerName)
    localStorage.setItem("playerId", nanoid())

    // Navigate to the room
    router.push(`/room/${newRoomId}`)
  }

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault()
    if (!joinPlayerName || !roomId) return

    // Store player info in localStorage
    localStorage.setItem("playerName", joinPlayerName)
    localStorage.setItem("playerId", nanoid())

    // Navigate to the room
    router.push(`/room/${roomId}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-100 to-orange-100 flex flex-col items-center">
      <div className="flex-1 flex flex-col items-center justify-center p-4 w-full">
        <GameLogo className="mb-8" />

        <div className="grid gap-6 md:grid-cols-2 max-w-4xl w-full">
          <Card className="shadow-lg border-2 border-yellow-300 bg-white">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-orange-600">Create Room</CardTitle>
              <CardDescription>Start a new game as the host</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateRoom} className="space-y-4">
                <div>
                  <Input
                    value={createPlayerName}
                    onChange={(e) => setCreatePlayerName(e.target.value)}
                    placeholder="Your Name"
                    className="border-2 border-yellow-200 focus:border-orange-400"
                    required
                  />
                </div>
                <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold">
                  Create Room
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-2 border-yellow-300 bg-white">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-orange-600">Join Room</CardTitle>
              <CardDescription>Join an existing game</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleJoinRoom} className="space-y-4">
                <div>
                  <Input
                    value={joinPlayerName}
                    onChange={(e) => setJoinPlayerName(e.target.value)}
                    placeholder="Your Name"
                    className="border-2 border-yellow-200 focus:border-orange-400 mb-2"
                    required
                  />
                </div>
                <div>
                  <Input
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    placeholder="Room ID"
                    className="border-2 border-yellow-200 focus:border-orange-400"
                    required
                  />
                </div>
                <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold">
                  Join Room
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <h2 className="text-xl font-bold text-orange-700 mb-2">How to Play</h2>
          <p className="max-w-2xl text-orange-800">
            React quickly to flying objects by raising your hand! If the object can fly, press the button. If it can't
            fly, do nothing. Score points for correct reactions and compete with friends!
          </p>
        </div>
      </div>
      
      <Footer 
        githubUrl={developerInfo.githubUrl}
        linkedinUrl={developerInfo.linkedinUrl}
        developerName={developerInfo.name}
      />
    </div>
  )
}

