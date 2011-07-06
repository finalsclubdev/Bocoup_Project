var http = require('http');
var io = require('socket.io').listen(1337);

var userDAO = require('./UserDAO.js');

var userRoutes = io.of('/user')
  .on('connection', function(socket) {
    socket.on('login', function(name) {
      try {
        if(userDAO.login(name, socket.id)) {
          socket.emit('loggedIn');
        }
      }
      catch(e) {
        socket.emit('err', e);
      }
    });

    socket.on('logout', function(name) {
      try {
        if(userDAO.logout(name, socket.id)) {
          socket.emit('loggedOut');
        }
      }
      catch(e) {
        socket.emit('err', e);
      }
    });

    socket.on('disconnect', function() {
      try {
        userDAO.disconnect(socket.id);
      }
      catch(e) {
        console.warn('userDAO.disconnect() threw an error, but no one was connected to hear it.', e);
      }
    });
  });
