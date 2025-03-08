import type { Server as NetServer } from "http"
import type { NextApiRequest } from "next"
import { Server as ServerIO } from "socket.io"
import type { NextApiResponseServerIO } from "@/lib/types-server"
import type { GameObject } from "@/lib/types"

// In-memory storage for rooms
const rooms: Record<
  string,
  {
    players: any[]
    gameState: "waiting" | "playing" | "results"
    hostId: string | null
    gameObjects: GameObject[]
    currentObjectIndex: number
    gameInterval: NodeJS.Timeout | null
    gameDuration: number
  }
> = {}

// Game objects database
const gameObjects: GameObject[] = [
  { name: "Bird", image: "/images/bird.png", canFly: true },
  { name: "Airplane", image: "/images/airplane.png", canFly: true },
  { name: "Butterfly", image: "/images/butterfly.png", canFly: true },
  { name: "Bee", image: "/images/bee.png", canFly: true },
  { name: "Helicopter", image: "/images/helicopter.png", canFly: true },
  { name: "Rocket", image: "/images/rocket.png", canFly: true },
  { name: "Bat", image: "/images/bat.png", canFly: true },
  { name: "Dog", image: "/images/dog.png", canFly: false },
  { name: "Cat", image: "/images/cat.png", canFly: false },
  { name: "Car", image: "/images/car.png", canFly: false },
  { name: "Fish", image: "/images/fish.png", canFly: false },
  { name: "Elephant", image: "/images/elephant.png", canFly: false },
  { name: "Penguin", image: "/images/penguin.png", canFly: false },
]

const SocketHandler = (_: NextApiRequest, res: NextApiResponseServerIO) => {
  if (res.socket.server.io) {
    console.log("Socket is already running")
  } else {
    console.log("Socket is initializing")
    const httpServer: NetServer = res.socket.server as any
    const io = new ServerIO(httpServer, {
      path: "/api/socketio",
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    })
    res.socket.server.io = io

    io.on("connection", (socket) => {
      console.log(`Socket connected: ${socket.id}`)

      socket.on("error", (error) => {
        console.error(`Socket ${socket.id} error:`, error);
      });

      // Join a room
      socket.on("joinRoom", ({ roomId, playerId, playerName }) => {
        try {
          console.log(`Player ${playerName} (${playerId}) joining room ${roomId}`);
          
          socket.join(roomId);
          socket.data.playerId = playerId; // Store playerId in socket data
          socket.data.roomId = roomId;  // Store room ID in socket data
          
          // Create room if it doesn't exist
          if (!rooms[roomId]) {
            rooms[roomId] = {
              players: [],
              gameState: "waiting",
              hostId: playerId, // First player is the host
              gameObjects: [],
              currentObjectIndex: 0,
              gameInterval: null,
              gameDuration: 10,
            }
          }

          // Check if player already exists in room
          const existingPlayerIndex = rooms[roomId].players.findIndex(p => p.id === playerId);
          
          if (existingPlayerIndex >= 0) {
            console.log(`Player ${playerName} (${playerId}) already in room, updating name`);
            // Update existing player's name
            rooms[roomId].players[existingPlayerIndex].name = playerName;
          } else {
            // Add new player
            const isHost = rooms[roomId].players.length === 0 || rooms[roomId].hostId === playerId;
            if (isHost) {
              rooms[roomId].hostId = playerId;
            }

            const player = {
              id: playerId,
              name: playerName,
              score: 0,
              isHost,
            };

            rooms[roomId].players.push(player);
          }

          // Get a clean players array with no duplicates
          const uniquePlayers = Object.values(
            rooms[roomId].players.reduce((acc: Record<string, any>, player) => {
              acc[player.id] = player;
              return acc;
            }, {})
          );
          
          // Update room players to ensure no duplicates
          rooms[roomId].players = uniquePlayers;

          // Notify player they've joined
          socket.emit("roomJoined", {
            players: uniquePlayers,
            isHost: rooms[roomId].hostId === playerId,
          });

          // Notify other players
          socket.to(roomId).emit("playerJoined", {
            players: uniquePlayers,
          });
          
          console.log(`Room ${roomId} players:`, uniquePlayers);
        } catch (error) {
          console.error("Error in joinRoom handler:", error);
          socket.emit("error", { message: "Failed to join room" });
        }
      })

      // Start game
      socket.on("startGame", ({ roomId, duration }) => {
        const room = rooms[roomId]
        if (!room) return

        room.gameState = "playing"
        room.gameDuration = duration || 10

        // Shuffle and select game objects
        room.gameObjects = [...gameObjects].sort(() => Math.random() - 0.5).slice(0, room.gameDuration)

        room.currentObjectIndex = 0

        // Notify all players game has started
        io.to(roomId).emit("gameStarted", {
          duration: room.gameDuration,
        })

        // Start game loop
        let timeRemaining = room.gameDuration
        let objectTimeRemaining = 0.5 // 0.5 seconds per object

        room.gameInterval = setInterval(() => {
          if (timeRemaining <= 0) {
            // End game
            clearInterval(room.gameInterval as NodeJS.Timeout)
            room.gameState = "results"
            io.to(roomId).emit("gameEnded", {
              players: room.players,
            })
            return
          }

          objectTimeRemaining -= 0.1

          if (objectTimeRemaining <= 0) {
            // Show next object
            const object = room.gameObjects[room.currentObjectIndex]
            io.to(roomId).emit("newObject", {
              object,
              timeToReact: 0.5,
            })

            room.currentObjectIndex = (room.currentObjectIndex + 1) % room.gameObjects.length
            objectTimeRemaining = 0.5
          }

          io.to(roomId).emit("updateTimeLeft", {
            timeLeft: objectTimeRemaining * 1000,
            gameTimeLeft: timeRemaining,
          })

          timeRemaining -= 0.1
        }, 100)
      })

      // Player reaction
      socket.on("playerReaction", ({ roomId, playerId, reacted }) => {
        const room = rooms[roomId]
        if (!room || room.gameState !== "playing") return

        const currentObject =
          room.gameObjects[(room.currentObjectIndex === 0 ? room.gameObjects.length : room.currentObjectIndex) - 1]

        const isCorrect = (reacted && currentObject.canFly) || (!reacted && !currentObject.canFly)

        // Update player score
        const playerIndex = room.players.findIndex((p) => p.id === playerId)
        if (playerIndex !== -1) {
          if (isCorrect) {
            room.players[playerIndex].score += 10
          } else {
            room.players[playerIndex].score -= 5
            if (room.players[playerIndex].score < 0) {
              room.players[playerIndex].score = 0
            }
          }
        }

        // Notify player of result
        io.to(roomId).emit("reactionResult", {
          playerId,
          correct: isCorrect,
        })

        // Update all players with new scores
        io.to(roomId).emit("updateScores", {
          players: room.players,
        })
      })

      // Reset game
      socket.on("resetGame", ({ roomId }) => {
        const room = rooms[roomId]
        if (!room) return

        // Reset game state
        room.gameState = "waiting"
        room.currentObjectIndex = 0

        // Reset player scores
        room.players = room.players.map((player) => ({
          ...player,
          score: 0,
        }))

        // Clear any existing game interval
        if (room.gameInterval) {
          clearInterval(room.gameInterval)
          room.gameInterval = null
        }

        // Notify all players
        io.to(roomId).emit("gameReset", {
          players: room.players,
        })
      })

      // Handle disconnection
      socket.on("disconnecting", () => {
        // Get all rooms this socket is in
        const socketRooms = Array.from(socket.rooms).filter((room) => room !== socket.id)

        socketRooms.forEach((roomId) => {
          const room = rooms[roomId]
          if (!room) return

          // Find player
          const playerIndex = room.players.findIndex((p) => p.id === socket.data.playerId)
          if (playerIndex === -1) return

          const player = room.players[playerIndex]
          const wasHost = player.isHost

          // Remove player
          room.players.splice(playerIndex, 1)

          // If room is empty, delete it
          if (room.players.length === 0) {
            if (room.gameInterval) {
              clearInterval(room.gameInterval)
            }
            delete rooms[roomId]
            return
          }

          // If host left, assign new host
          let newHostId = null
          if (wasHost && room.players.length > 0) {
            const newHost = room.players[0]
            newHost.isHost = true
            newHostId = newHost.id
            room.hostId = newHost.id
          }

          // Notify remaining players
          io.to(roomId).emit("playerLeft", {
            players: room.players,
            newHostId,
          })
        })
      })
    })
  }

  res.end()
}

export default SocketHandler

