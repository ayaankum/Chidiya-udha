const { Server } = require('socket.io');
const { createRedisAdapter } = require('./socket-adapter');

let io;

// Initialize Socket.IO server with Redis adapter
function initializeSocketIO(server) {
  if (io) {
    return io;
  }
  
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST']
    },
    // Use path that works well with Vercel's serverless functions
    path: '/api/socketio',
  });
  
  // Apply Redis adapter for cross-instance communication
  io.adapter(createRedisAdapter());
  
  // Setup your socket event handlers
  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);
    
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
    
    // Add your custom socket events here
    // socket.on('your-event', (data) => { ... });
  });
  
  return io;
}

// Get the existing Socket.IO instance or null
function getIO() {
  return io;
}

module.exports = { initializeSocketIO, getIO };
