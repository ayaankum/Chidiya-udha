const { createServer } = require('http');
const { initializeSocketIO } = require('../lib/socket-io');
const { parse } = require('url');

// This is the serverless function that will handle WebSocket connections
const SocketHandler = (req, res) => {
  // If it's the first call, we need to upgrade the connection
  if (!res.socket.server.io) {
    console.log('Initializing Socket.IO server...');
    
    // Create an HTTP server
    const httpServer = createServer();
    
    // Initialize Socket.IO with the server
    const io = initializeSocketIO(httpServer);
    
    // Store the io instance on the server object
    res.socket.server.io = io;
    
    // Setup the WebSocket handler to use the same path as Socket.IO
    const pathname = parse(req.url).pathname;
    
    // Handle the upgrade for WebSocket
    if (pathname === '/api/socketio') {
      httpServer.emit('upgrade', req, res.socket, Buffer.alloc(0));
    }
  }
  
  // Send a successful response
  res.end();
};

export default SocketHandler;
