const { createAdapter } = require('@socket.io/redis-adapter');
const Redis = require('ioredis');

// Create Redis clients for pub/sub
const createRedisAdapter = () => {
  // Use Redis URL from environment variables or default to localhost
  const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
  
  const pubClient = new Redis(REDIS_URL);
  const subClient = pubClient.duplicate();
  
  // Handle connection errors
  pubClient.on('error', (err) => {
    console.error('Redis pub client error:', err);
  });
  
  subClient.on('error', (err) => {
    console.error('Redis sub client error:', err);
  });
  
  return createAdapter(pubClient, subClient);
};

module.exports = { createRedisAdapter };
