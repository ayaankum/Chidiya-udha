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

      // Track socket-to-player mapping for disconnection handling
      const playerSockets = new Map();

      socket.on("error", (error) => {
        console.error(`Socket ${socket.id} error:`, error);
      });

      // Join a room - store player info in socket.data for disconnect tracking
      socket.on("joinRoom", ({ roomId, playerId, playerName }) => {
        try {
          console.log(`Player ${playerName} (${playerId}) joining room ${roomId}`);
          
          // Store player info in socket data
          socket.data.playerId = playerId;
          socket.data.roomId = roomId;
          socket.data.playerName = playerName;
          
          // Add to tracking map
          playerSockets.set(socket.id, { playerId, roomId, playerName });
          
          // Join the socket to the room
          socket.join(roomId);
          
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

      // Handle explicit leave room request
      socket.on("leaveRoom", () => {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] Socket ${socket.id} explicitly requested to leave room`);
        
        const { playerId, roomId, playerName } = socket.data;
        if (playerId && roomId) {
          console.log(`[${timestamp}] LeaveRoom details:`, {
            playerId,
            playerName,
            roomId,
            socketId: socket.id
          });
        }
        
        handlePlayerLeaving(socket);
      });

      // Handle disconnection - improved implementation with better logging
      socket.on("disconnecting", () => {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] Socket ${socket.id} disconnecting...`);
        
        const { playerId, roomId, playerName } = socket.data;
        if (playerId && roomId) {
          console.log(`[${timestamp}] Disconnection details:`, {
            playerId,
            playerName,
            roomId,
            socketId: socket.id,
            rooms: Array.from(socket.rooms)
          });
        }
        
        handlePlayerLeaving(socket);
      });

      // Improved player leaving handler
      function handlePlayerLeaving(socket: any) {
        const timestamp = new Date().toISOString();
        const { playerId, roomId, playerName } = socket.data;
        
        if (!playerId || !roomId) {
          console.log(`[${timestamp}] Socket ${socket.id} disconnected but had no room/player data`);
          return; // Nothing to clean up
        }
        
        console.log(`[${timestamp}] Player ${playerName} (${playerId}) leaving room ${roomId}`);
        
        const room = rooms[roomId];
        if (!room) {
          console.log(`[${timestamp}] Room ${roomId} not found when player ${playerName} disconnected`);
          return;
        }

        // Verify player is in the room
        const playerIndex = room.players.findIndex((p) => p.id === playerId);
        if (playerIndex === -1) {
          console.log(`[${timestamp}] Player ${playerName} (${playerId}) not found in room ${roomId}`);
          return;
        }

        // Log room state before removal
        console.log(`[${timestamp}] Room ${roomId} before player removal:`, {
          totalPlayers: room.players.length,
          players: room.players.map(p => `${p.name} (${p.id})`),
          gameState: room.gameState,
          hostId: room.hostId
        });

        const player = room.players[playerIndex];
        const wasHost = player.isHost;

        // Remove player from room
        room.players.splice(playerIndex, 1);
        
        // Log room state after removal
        console.log(`[${timestamp}] Room ${roomId} after player removal:`, {
          remainingPlayers: room.players.length,
          players: room.players.map(p => `${p.name} (${p.id})`),
        });

        // If room is empty, cleanup and delete
        if (room.players.length === 0) {
          console.log(`[${timestamp}] Room ${roomId} is empty, cleaning up`);
          if (room.gameInterval) {
            clearInterval(room.gameInterval);
          }
          delete rooms[roomId];
          return;
        }

        // If host left, assign new host
        let newHostId = null;
        if (wasHost && room.players.length > 0) {
          const newHost = room.players[0];
          newHost.isHost = true;
          newHostId = newHost.id;
          room.hostId = newHost.id;
          console.log(`[${timestamp}] New host assigned in room ${roomId}: ${newHost.name} (${newHost.id})`);
        }

        // Force socket to leave room
        socket.leave(roomId);

        // Notify remaining players with improved data
        console.log(`[${timestamp}] ⚠️ Emitting playerLeft event to room ${roomId}`);
        io.to(roomId).emit("playerLeft", {
          players: room.players,
          newHostId,
          leftPlayerId: playerId,
          leftPlayerName: playerName,
          timestamp: Date.now()
        });
        
        // Verify the event was sent
        setTimeout(() => {
          const socketsInRoom = io.sockets.adapter.rooms.get(roomId);
          const socketCount = socketsInRoom ? socketsInRoom.size : 0;
          console.log(`[${timestamp}] Room ${roomId} has ${socketCount} connected sockets after player left`);
        }, 500);
      }
    })
  }

  res.end()
}

export default SocketHandler

