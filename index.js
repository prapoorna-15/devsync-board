const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');

const port = process.env.PORT || 3001;

// Use path.join to resolve directory paths safely on Linux
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

let drawingHistory = [];
let onlineUsers = 0;

io.on('connection', (socket) => {
  onlineUsers++;
  io.emit('users_count', onlineUsers);

  socket.emit('history', drawingHistory);

  socket.on('drawing', (data) => {
    drawingHistory.push(data);
    socket.broadcast.emit('drawing', data);
  });

  socket.on('Clearboard', (data) => {
    drawingHistory = [];
    io.emit('Clearboard', data);
  });

  socket.on('disconnect', () => {
    onlineUsers = Math.max(0, onlineUsers - 1);
    io.emit('users_count', onlineUsers);
  });
});

// Bind to host 0.0.0.0 for Render
http.listen(port, '0.0.0.0', () => {
  console.log('Listening on port ' + port);
});