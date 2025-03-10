// This is a client-side script to connect to the Socket.IO server
document.addEventListener('DOMContentLoaded', () => {
  // Connect to Socket.IO server
  const socket = io({
    path: '/api/socketio',
  });
  
  // Log when connected
  socket.on('connect', () => {
    console.log('Connected to Socket.IO server');
    document.getElementById('status').textContent = 'Connected';
  });
  
  // Log when disconnected
  socket.on('disconnect', () => {
    console.log('Disconnected from Socket.IO server');
    document.getElementById('status').textContent = 'Disconnected';
  });
  
  // Handle custom events from server
  socket.on('message', (data) => {
    console.log('Received message:', data);
    const messagesElement = document.getElementById('messages');
    const messageElement = document.createElement('div');
    messageElement.textContent = data;
    messagesElement.appendChild(messageElement);
  });
  
  // Send message to server
  document.getElementById('send').addEventListener('click', () => {
    const input = document.getElementById('message');
    const message = input.value;
    if (message) {
      socket.emit('message', message);
      input.value = '';
    }
  });
});
