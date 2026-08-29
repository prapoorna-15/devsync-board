
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3001;

app.use(express.static(__dirname + '/public'));

function onConnection(socket){
  socket.on('drawing', function(data){
    socket.broadcast.emit('drawing', data);
  });
  
  socket.on('Clearboard', function(data){
    socket.broadcast.emit('Clearboard', data);
  });
}

io.on('connection', onConnection);

http.listen(port, () => console.log('Listening on port ' + port));