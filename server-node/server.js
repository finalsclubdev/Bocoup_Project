var http = require('http');
var io = require('socket.io').listen(1337);

var userRoutes = io.of('/user')
  .on('connection', function(socket) {

    socket.on('login', function(name) {
      socket.set('name', name, function() {
        socket.emit('loggedIn');
      });
    });

    socket.on('logout', function() {
      socket.set('name', null, function() {
        socket.emit('loggedOut');
      });
    });
  });
