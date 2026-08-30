const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3001;

app.use(express.static(__dirname + '/public'));

// Track active connected users & drawing history
let connectedUsers = 0;
let drawingHistory = [];

function onConnection(socket){
  // Increase count when a user connects and notify all clients
  connectedUsers++;
  io.emit('users_count', connectedUsers);

  // Send accumulated history to the newly connected client
  socket.emit('history', drawingHistory);

  // Store drawing data and broadcast to other users
  socket.on('drawing', function(data){
    drawingHistory.push(data);
    socket.broadcast.emit('drawing', data);
  });

  // Handle board reset: clear server history and broadcast to everyone
  socket.on('Clearboard', function(data){
    drawingHistory = [];
    io.emit('Clearboard', data);
  });

  // Decrease count when a user disconnects and notify remaining clients
  socket.on('disconnect', function(){
    connectedUsers = Math.max(0, connectedUsers - 1);
    io.emit('users_count', connectedUsers);
  });
}

io.on('connection', onConnection);

http.listen(port, () => console.log('Listening on port ' + port));
