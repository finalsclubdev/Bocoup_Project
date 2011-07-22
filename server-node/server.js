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
          var docInfo = docDAO.getUserJoinedDoc(user.id);

          if(docInfo) {
            docDAO.part(user.id, docInfo.gid, docInfo.id, function(err) {
              if(err) {
                throw err;
              }
            });
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
        groupDAO.getList(function(err, data) {
          if(err) {
            socket.emit('err', err);
          }
          else {
            socket.emit('getGroups', data);
          }
        });
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
            docDAO.getByGID(group.id, function(err, docs) {
              if(err) {
                socket.emit('err', err);
              }
              else {
                group.docs = docs;
                socket.emit('get', group);
              }
            });
          }
        });
      }
      catch(e) {
        socket.emit('err', e);
      }
    });

    socket.on('add', function(id) {
      try {
        groupDAO.add(id, function(err, group) {
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
        docDAO.join(data.uid, data.docID, data.gid, function(state, err) {
          if(err) {
            socket.emit('err', err);
          }
          else if(state) {
            // Add a listener for the cursor change event.
            state.addCursorObserver(function(gid, docID, uid, pos) {
              var users = docDAO.getJoinedUsers(gid, docID);

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

            // Add a listener for the document change event (commands).
            state.addChangeObserver(function(data) {
              if(data.toUser) {
                socket.namespace.sockets[userDAO.get(data.toUser).sessionID].emit('change', data.command);
              }
              else {
                var users = docDAO.getJoinedUsers(data.gid, data.docID);

                for(var i in users) {
                  if(users.hasOwnProperty(i)) {
                    socket.namespace.sockets[userDAO.get(i).sessionID].emit('change', data.command);
                  }
                }
              }
            });
          }

          // Tell them that they joined after everything is set up.
          docDAO.get(data.docID, data.gid, function(err, doc) {
            if(err) {
              socket.emit('err', err);
            }
            else {
              socket.emit('join', {
                doc: doc,
                users: docDAO.getJoinedUsers(doc.gid, doc.id)
              });
            }
          });
        });
      }
      catch(e) {
        socket.emit('err', e);
      }
    });

    socket.on('part', function(data) {
      try {
        docDAO.part(data.uid, data.gid, data.docID, function(err) {
          if(err) {
            socket.emit('err', err);
          }
          else {
            socket.emit('part', data.uid);

            var users = docDAO.getJoinedUsers(data.gid, data.docID);

            for(var i in users) {
              if(users.hasOwnProperty(i)) {
                var user = userDAO.get(i);

                if(user) {
                  var sid = user.sessionID;

                  if(socket.namespace.sockets[sid]) {
                    socket.namespace.sockets[sid].emit('part', data.uid);
                  }
                }
              }
            }
          }
        });
      }
      catch(e) {
        socket.emit('err', e);
      }
    });

    socket.on('cursor', function(data) {
      try {
        docDAO.updateCursor(data.gid, data.docID, data.uid, data.pos);
      }
      catch(e) {
        socket.emit('err', e);
      }
    });

    socket.on('change', function(data) {
      try {
        var doc = docDAO.changeDoc(
                            data.gid,
                            data.id,
                            data.op,
                            data.uid,
                            data.pos,
                            data.val,
                            data.asOf
                          );

        if(doc) {
          socket.emit('conflict', {
            doc: doc,
            command: data
          });
        }
      }
      catch(e) {
        socket.emit('err', e);
      }
    });

    socket.on('add', function(data) {
      try {
        docDAO.add(data.id, data.gid, function(err, doc) {
          if(err) {
            socket.emit('err', err);
          }
          else {
            socket.emit('add', doc);
          }
        });
      }
      catch(e) {
        socket.emit('err', e);
      }
    });

    socket.on('get', function(data) {
      try {
        docDAO.get(data.id, data.gid, function(err, doc) {
          if(err) {
            socket.emit('err', err);
          }
          else {
            socket.emit('get', doc);
          }
        });
      }
      catch(e) {
        socket.emit('err', e);
      }
    });

    socket.on('getByGID', function(gid) {
      try {
        docDAO.getByGID(gid, function(err, docs) {
          if(err) {
            socket.emit('err', err);
          }
          else {
            socket.emit('getByGID', docs);
          }
        });
      }
      catch(e) {
        socket.emit('err', e);
      }
    });
  });
