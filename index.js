
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3001;

app.use(express.static(__dirname + '/public'));

// Track active connected users
let connectedUsers = 0;

function onConnection(socket){
  // Increase count when a user connects and notify all clients
  connectedUsers++;
  io.emit('users_count', connectedUsers);

  socket.on('drawing', function(data){
    socket.broadcast.emit('drawing', data);
  });
  
  socket.on('Clearboard', function(data){
    socket.broadcast.emit('Clearboard', data);
  });

  // Decrease count when a user disconnects and notify remaining clients
  socket.on('disconnect', function(){
    connectedUsers = Math.max(0, connectedUsers - 1);
    io.emit('users_count', connectedUsers);
  });
}

io.on('connection', onConnection);

http.listen(port, () => console.log('Listening on port ' + port));