const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Serve all static files from the public directory
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));

// Fallback route to serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

let drawingHistory = [];
let onlineUsers = 0;

io.on('connection', (socket) => {
  onlineUsers++;
  io.emit('users_count', onlineUsers);

  // Send drawing history to newly connected client
  socket.emit('history', drawingHistory);

  socket.on('drawing', (data) => {
    drawingHistory.push(data);
    socket.broadcast.emit('drawing', data);
  });

  socket.on('Clearboard', () => {
    drawingHistory = [];
    io.emit('Clearboard');
  });

  socket.on('disconnect', () => {
    onlineUsers = Math.max(0, onlineUsers - 1);
    io.emit('users_count', onlineUsers);
  });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});