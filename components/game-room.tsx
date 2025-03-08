"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { io, type Socket } from "socket.io-client"
import { useGameStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import GameLogo from "@/components/game-logo"
import WaitingRoom from "@/components/waiting-room"
import GamePlay from "@/components/game-play"
import GameResults from "@/components/game-results"
import { Users } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"

export default function GameRoom({
  roomId,
  initialPlayerName,
  initialPlayerId,
}: {
  roomId: string
  initialPlayerName: string
  initialPlayerId: string
}) {
  const router = useRouter()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [socketError, setSocketError] = useState<string | null>(null)
  const [reconnecting, setReconnecting] = useState(false)
  const [connecting, setConnecting] = useState(true)
  const [gameDuration, setGameDuration] = useState(10)

  const {
    gameState,
    players,
    isHost,
    currentPlayer,
    setGameState,
    setPlayers,
    setIsHost,
    setCurrentPlayer,
    resetGame,
  } = useGameStore()

  useEffect(() => {
    let socketInstance: Socket;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    
    const connectSocket = () => {
      // Clear any previous errors
      setSocketError(null);
      setConnecting(true);
      
      // Initialize socket connection with better config
      socketInstance = io({
        path: "/api/socketio",
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
      });

      socketInstance.on("connect", () => {
        console.log("Connected to socket server with ID:", socketInstance.id);
        reconnectAttempts = 0;
        setReconnecting(false);
        setConnecting(false);
        
        // Join the room only after successful connection
        socketInstance.emit("joinRoom", {
          roomId,
          playerId: initialPlayerId,
          playerName: initialPlayerName,
        });
      });

      socketInstance.on("connect_error", (err) => {
        console.error("Socket connection error:", err.message);
        setSocketError(`Connection error: ${err.message}`);
        setConnecting(false);
        
        reconnectAttempts++;
        if (reconnectAttempts >= maxReconnectAttempts) {
          console.error("Max reconnection attempts reached");
          setSocketError("Unable to connect after several attempts. Please refresh the page.");
        } else {
          setReconnecting(true);
        }
      });

      socketInstance.on("roomJoined", (data) => {
        console.log("Room joined event received:", data);
        setPlayers(data.players);
        setIsHost(data.isHost);
        setCurrentPlayer({
          id: initialPlayerId,
          name: initialPlayerName,
          score: 0,
          isHost: data.isHost,
        });
      });

      socketInstance.on("playerJoined", (data) => {
        console.log("Player joined event received:", data);
        setPlayers(data.players);
      });

      socketInstance.on("playerLeft", (data) => {
        setPlayers(data.players);
        // If host changed and current player is the new host
        if (data.newHostId === initialPlayerId) {
          setIsHost(true);
          // Find current player in updated players list to maintain correct score
          const currentPlayerInList = data.players.find((p: any) => p.id === initialPlayerId);
          setCurrentPlayer({
            id: initialPlayerId,
            name: initialPlayerName,
            score: currentPlayerInList?.score || 0,
            isHost: true
          });
        }
      });

      socketInstance.on("gameStarted", (data) => {
        setGameState("playing");
      });

      socketInstance.on("gameEnded", (data) => {
        setPlayers(data.players); // Update with final scores
        setGameState("results");
      });

      socketInstance.on("disconnect", () => {
        console.log("Disconnected from socket server");
      });

      setSocket(socketInstance);
    };

    // Initial connection
    connectSocket();

    // Cleanup function
    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [roomId, initialPlayerId, initialPlayerName, setPlayers, setIsHost, setCurrentPlayer, setGameState]);

  const startGame = () => {
    if (socket && isHost) {
      socket.emit("startGame", {
        roomId,
        duration: gameDuration,
      });
    }
  }

  const leaveRoom = () => {
    if (socket) {
      // Disconnect socket
      socket.disconnect();
    }
    
    // Clear player data from localStorage
    localStorage.removeItem("playerName");
    localStorage.removeItem("playerId");
    
    // Reset game state
    resetGame();
    
    // Navigate back to home page
    router.push("/");
  }

  const handleReaction = (reacted: boolean) => {
    if (socket && gameState === "playing") {
      socket.emit("playerReaction", {
        roomId,
        playerId: initialPlayerId,
        reacted,
      });
    }
  }

  const playAgain = () => {
    if (socket && isHost) {
      socket.emit("resetGame", { roomId });
      setGameState("waiting");
    }
  }

  // Show connection error
  if (socketError) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-yellow-100 to-orange-100 p-4 flex flex-col items-center justify-center">
        <Card className="p-6 max-w-md w-full bg-white border-2 border-red-300">
          <div className="text-center space-y-4">
            <div className="text-red-500 font-semibold text-lg">Connection Error</div>
            <p>{socketError}</p>
            <Button 
              onClick={() => window.location.reload()}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              Refresh Page
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Show reconnecting state
  if (reconnecting) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-yellow-100 to-orange-100 p-4 flex flex-col items-center justify-center">
        <Card className="p-6 max-w-md w-full bg-white border-2 border-yellow-300">
          <div className="text-center space-y-4">
            <Spinner size="lg" className="mx-auto" />
            <p className="text-orange-700">Reconnecting to game...</p>
          </div>
        </Card>
      </div>
    );
  }

  // Show connecting state
  if (connecting) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-yellow-100 to-orange-100 p-4 flex flex-col items-center justify-center">
          <Card className="p-6 max-w-md w-full bg-white border-2 border-yellow-300">
          <div className="text-center space-y-4">
            <Spinner size="lg" className="mx-auto" />
            <p className="text-orange-700">Connecting to game server...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-100 to-orange-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <GameLogo />
          <div className="flex items-center gap-2">
            <Card className="p-2 bg-white border-yellow-300 flex items-center gap-2">
              <Users className="h-5 w-5 text-orange-500" />
              <span className="font-medium text-orange-700">Room: {roomId}</span>
            </Card>
            <Button
              variant="outline"
              className="border-orange-300 text-orange-700 hover:bg-orange-100"
              onClick={leaveRoom}
            >
              Leave Room
            </Button>
          </div>
        </div>

        {gameState === "waiting" && (
          <WaitingRoom
            players={players}
            isHost={isHost}
            onStartGame={startGame}
            gameDuration={gameDuration}
            onDurationChange={setGameDuration}
          />
        )}

        {gameState === "playing" && (
          <GamePlay onReaction={handleReaction} socket={socket} roomId={roomId} playerId={initialPlayerId} />
        )}

        {gameState === "results" && <GameResults players={players} isHost={isHost} onPlayAgain={playAgain} />}
      </div>
    </div>
  )
}

