const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');

const port = process.env.PORT || 3001;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Non-disruptive room state stores
const roomHistory = {};
const roomUsers = {};

io.on('connection', (socket) => {
  // Extract room ID from query params sent by client, or fallback to 'default'
  const roomId = socket.handshake.query.room || 'default';
  socket.join(roomId);

  // Track online users for THIS specific room
  roomUsers[roomId] = (roomUsers[roomId] || 0) + 1;
  io.to(roomId).emit('users_count', roomUsers[roomId]);

  // Initialize room drawing history if empty
  if (!roomHistory[roomId]) {
    roomHistory[roomId] = [];
  }

  // Send history of this room to the newly connected user
  socket.emit('history', roomHistory[roomId]);

  // Handle incoming drawing data (scoped to roomId)
  socket.on('drawing', (data) => {
    if (roomHistory[roomId]) {
      roomHistory[roomId].push(data);
    }
    socket.to(roomId).emit('drawing', data);
  });

  // Handle board clearing (scoped to roomId)
  socket.on('Clearboard', (data) => {
    roomHistory[roomId] = [];
    io.to(roomId).emit('Clearboard', data);
  });

  // Handle disconnect (scoped to roomId)
  socket.on('disconnect', () => {
    roomUsers[roomId] = Math.max(0, (roomUsers[roomId] || 1) - 1);
    io.to(roomId).emit('users_count', roomUsers[roomId]);
  });
});

http.listen(port, '0.0.0.0', () => {
  console.log('Listening on port ' + port);
});