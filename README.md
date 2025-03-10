# Chidiya Udh Online

A real-time multiplayer web game built with **Next.js and WebSockets**, where players join private rooms and react to flying/non-flying objects within **0.5 seconds**. Scores update in real-time, and the game runs for a **custom duration** with a live leaderboard. No backend is required, as the game uses in-memory room management.

## Features

- **Real-time Multiplayer:** Players join private rooms via a unique ID.
- **Fast Reactions:** Players must respond within **0.5 seconds** to flying/non-flying objects.
- **Leaderboards:** Tracks player scores live throughout the game.
- **Custom Game Duration:** Default **10 seconds**, adjustable by the host.
- **No Backend Needed:** Rooms and game state are managed in-memory using WebSockets.
- **Cartoonish UI:** Bright visuals, animations, and sound effects for an engaging experience.

## Tech Stack

- **Frontend & Game Logic:** Next.js (React)
- **Real-time Communication:** WebSockets (Socket.io)
- **State Management:** Zustand
- **Styling:** Tailwind CSS
