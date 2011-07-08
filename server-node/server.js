var http = require('http');
var io = require('socket.io').listen(1337);

var userDAO = require('./UserDAO.js');
var groupDAO = require('./GroupDAO.js');
var docDAO = require('./DocDAO.js');

var userRoutes = io.of('/user')
  .on('connection', function(socket) {
    socket.on('login', function(name) {
      try {
        if(userDAO.login(name, socket.id)) {
          socket.emit('loggedIn', name);
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

var groupRoutes = io.of('/group')
  .on('connection', function(socket) {
    socket.on('getList', function() {
      try {
        socket.json.emit('getList', groupDAO.getList());
      }
      catch(e) {
        socket.emit('err', e);
      }
    });

    socket.on('get', function(id) {
      try {
        var group = groupDAO.get(id);

        if(group) {
          group.id = id;
          group.docs = docDAO.getByGID(id);
        }

        socket.json.emit('get', group);
      }
      catch(e) {
        socket.emit('err', e);
      }
    });
  });

var docRoutes = io.of('/doc')
  .on('connection', function(socket) {
    socket.on('join', function(data) {
      try {
        var state = docDAO.join(data.uid, data.docID);

        if(state) {
          state.addCursorObserver(function(uid, pos) {
            socket.json.emit('cursor', { uid: uid, pos: pos });
          });
        }

        socket.emit('join', data.docID);
      }
      catch(e) {
        socket.emit('err', e);
      }
    });

    socket.on('cursor', function(data) {
      try {
        docDAO.updateCursor(data.docID, data.uid, data.pos);
      }
      catch(e) {
        socket.emit('err', e);
      }
    });
  });
