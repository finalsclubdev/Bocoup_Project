var http = require('http');
var io = require('socket.io').listen(1337);

var userDAO = require('./src/DAOs/UserDAO.js');
var groupDAO = require('./src/DAOs/GroupDAO.js');
var docDAO = require('./src/DAOs/DocDAO.js');

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
    socket.on('getGroups', function() {
      try {
        socket.json.emit('getGroups', groupDAO.getList());
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
          state.addCursorObserver(function(docID, uid, pos) {
            var users = docDAO.getJoinedUsers(docID);

            for(var i in users) {
              if(i !== uid) {
                socket.namespace.sockets[userDAO.get(i).sessionID].emit('cursor', { uid: uid, pos: pos });
              }
            }
          });

          state.addChangeObserver(function(data) {
            if(data.toUser) {
              socket.namespace.sockets[userDAO.get(data.toUser).sessionID].emit('change', data.command);
            }
            else {
              var users = docDAO.getJoinedUsers(data.docID);

              for(var i in users) {
                socket.namespace.sockets[userDAO.get(i).sessionID].emit('change', data.command);
              }
            }
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

    socket.on('change', function(data) {
      try {
        docDAO.changeDoc(data.docID, data.op, data.uid, data.pos, data.val, data.asOf);
      }
      catch(e) {
        socket.emit('err', e);
      }
    });
  });
