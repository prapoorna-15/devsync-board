const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const path = require('path');

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html on root request
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Store drawing history in memory
let drawingHistory = [];
let onlineUsers = 0;

// Socket.IO Connection Handler
io.on('connection', (socket) => {
  onlineUsers++;
  io.emit('users_count', onlineUsers);

  // Send past drawings to the newly connected user
  socket.emit('history', drawingHistory);

  // Listen for incoming drawings and broadcast
  socket.on('drawing', (data) => {
    drawingHistory.push(data);
    socket.broadcast.emit('drawing', data);
  });

  // Listen for clear board command
  socket.on('Clearboard', () => {
    drawingHistory = [];
    io.emit('Clearboard');
  });

  // Handle user disconnect
  socket.on('disconnect', () => {
    onlineUsers = Math.max(0, onlineUsers - 1);
    io.emit('users_count', onlineUsers);
  });
});

// Dynamic port binding for Render deployment
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});