var http = require('http');
var io = require('socket.io').listen(1337, 'dev.finalsclub.org');

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
        var user = userDAO.getBySessionID(socket.id);

        if(user.id) {
          var doc = docDAO.getUserJoinedDoc(user.id);

          if(doc) {
            docDAO.part(user.id, doc.id);
          }

          userDAO.disconnect(socket.id);
        }
      }
      catch(e) {
        console.warn('userDAO.disconnect() threw an error, but no one was connected to hear it.', e.message);
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
        groupDAO.get(id, function(err, group) {
          if(err) {
            socket.emit('err', err);
          }
          else {
            group.id = id;
            group.docs = docDAO.getByGID(id);

            socket.emit('get', group);
          }
        });
      }
      catch(e) {
        socket.emit('err', e);
      }
    });

    socket.on('add', function(name) {
      try {
        groupDAO.add(name, function(err, group) {
          if(err) {
            socket.emit('err', err);
          }
          else {
            socket.emit('add', group);
          }
        });
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
              if(users.hasOwnProperty(i) && i !== uid) {
                var user = userDAO.get(i);

                if(user) {
                  var sid = user.sessionID;

                  if(socket.namespace.sockets[sid]) {
                    socket.namespace.sockets[sid].emit('cursor', { uid: uid, pos: pos });
                  }
                  else {
                    console.log('No socket found for sessionID "'+sid+'"');
                  }
                }
                else {
                  //TODO do something about it.
                  console.warn('There is a disconnected user still joined to a document.');
                }
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
                if(users.hasOwnProperty(i)) {
                  socket.namespace.sockets[userDAO.get(i).sessionID].emit('change', data.command);
                }
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

    socket.on('add', function(data) {
      try {
        socket.emit('add', docDAO.add(data.id, data.gid));
      }
      catch(e) {
        socket.emit('err', e);
      }
    });
  });
