var colab = (function(io) {
  /*
   * You can subscribe to different types of events (user, group, and doc,
   * which are the same as the socket groups). You add yourself by pushing
   * an object onto the corresponding array that looks like this:
   * { eventName: 'eventYouListeningFor', callback: function(data) { } }
   *
   * When there's an event that the public should know about, colab will
   * use the notify function to tell you about it.
   */
  var observers = {
    userEvents: [],
    groupEvents: [],
    docEvents: [],

    notify: function(observers, eventName, data) {
      for(var i in observers) {
        if(!observers[i].eventName || observers[i].eventName == eventName || observers[i].eventName.indexOf(eventName+".") === 0 ) {
          observers[i].callback(data);
        }
      }
    },

    remove: function(observers, fn) {
      var removed = false;
      for(var i in observers) {
        if(observers.hasOwnProperty(i)) {
          if (observers[i][typeof fn == "function" ? "callback" : "eventName"] === fn) {
            observers.splice(i, 1);
            removed = true;
          }
        }
      }
      if(!removed) {
        throw 'That is not a function or bound observer name.';
      }
    }
  };

  //A socket wide function for handling errors.
  function onError(msg) {
    if(api && api.onError) {
      api.onError(msg);
    }
    else {
      console.log('err', msg);
    }
  }

  //Stores the current user's info.
  var currUser = {};

  //Stores the current document's info.
  var currDoc = {};

  //The host we're connecting to (node socket.io server).
  var sockHost = 'http://dev.finalsclub.org:1337';

  //Our socket groups.
  var userSock = io.connect(sockHost +'/user');
  var groupSock = io.connect(sockHost +'/group');
  var docSock = io.connect(sockHost +'/doc');

  //Bind to the error events with our global handler.
  userSock.on('err', onError);
  groupSock.on('err', onError);
  docSock.on('err', onError);

  //userSock events.
  userSock.on('connect', function() {
    observers.notify(observers.userEvents, 'connected');
  });

  //The user has been logged in.
  userSock.on('loggedIn', function(uid) {
    currUser = {
      id: uid
    };

    observers.notify(observers.userEvents, 'loggedIn', currUser);
  });

  //The user has been logged out.
  userSock.on('loggedOut', function() {
    currUser = {};
    observers.notify(observers.userEvents, 'loggedOut');
  });

  //groupSock events.
  groupSock.on('getGroups', function(data) {
    observers.notify(observers.groupEvents, 'getGroups', data);
  });

  groupSock.on('get', function(data) {
    observers.notify(observers.groupEvents, 'get', data);
  });

  groupSock.on('add', function(data) {
    observers.notify(observers.groupEvents, 'add', data);
  });

  //dockSock events.
  docSock.on('join', function(data) {
    if(typeof data === 'object') {
      currDoc = data.doc;
    }

    observers.notify(observers.docEvents, 'join', data);
  });

  docSock.on('part', function(uid) {
    if(currUser.id === uid) {
      currDoc = {};
    }

    observers.notify(observers.docEvents, 'part', uid);
  });

  docSock.on('cursor', function(data) {
    observers.notify(observers.docEvents, 'cursor', data);
  });

  docSock.on('change', function(command) {
    if(!currDoc.id) {
      console.warn('Got a change event when not joined to a document.');
    }
    else if(command.asOf == currDoc.seq) {
      console.debug('setting seq to '+command.seq);
      currDoc.seq = command.seq;

      //The editor already has its own edits.
      if(command.uid != currUser.id) {
        observers.notify(observers.docEvents, 'change', command);
      }
    }
  });

  docSock.on('conflict', function(data) {
    console.log('a conflicted change was rejected, doc state updated', data.command);

    currDoc = data.doc;
    observers.notify(observers.docEvents, 'get', data.doc);
  });

  docSock.on('add', function(newDoc) {
    observers.notify(observers.docEvents, 'add', newDoc);
  });

  docSock.on('get', function(doc) {
    observers.notify(observers.docEvents, 'get', doc);
  });

  docSock.on('getByGID', function(docs) {
    observers.notify(observers.docEvents, 'getByGID', docs);
  });

  //Our API, which we can call internally as well.
  var api = {
    //Add an observer to the group events.
    addGroupObserver: function(eventName, callback) {
      observers.groupEvents.push({
        eventName: eventName,
        callback: callback
      });
    },

    //The inverse of addGroupObserver()
    removeGroupObserver: function(fn) {
      observers.remove(observers.groupEvents, fn);
    },

    //Add an observer to the user events.
    addUserObserver: function(eventName, callback) {
      observers.userEvents.push({
        eventName: eventName,
        callback: callback
      });
    },

    //The inverse of addUserObserver()
    removeUserObserver: function(fn) {
      observers.remove(observers.userEvents, fn);
    },

    //Add an observer to the doc events.
    addDocObserver: function(eventName, callback) {
      observers.docEvents.push({
        eventName: eventName,
        callback: callback
      });
    },

    //The inverse of removeDocObserver()
    removeDocObserver: function(fn) {
      observers.remove(observers.docEvents, fn);
    },

    //Establishes a user as logged in
    login: function(name) {
      userSock.emit('login', name);
    },

    //Destroys a user's session
    logout: function() {
      userSock.emit('logout', currUser.id);
    },

    //Tells the API to get a list of available groups
    getGroups: function() {
      groupSock.emit('getGroups');
    },

    //Tells the API to get a specific group by its ID.
    getGroup: function(id) {
      groupSock.emit('get', id);
    },

    /*
     * Tells the API to join a user to a document. Automatically parts them
     * from any currently joined document.
     */
    joinDoc: function(gid, docID) {
      if(currUser.id) {
        if(currDoc.id) {
          api.partDoc();
        }

        docSock.emit('join', {
          uid: currUser.id,
          gid: gid,
          docID: docID
        });
      }
    },

    //Tells the API to part the current user from the currently joined document.
    partDoc: function() {
      if(currUser.id && currDoc.id) {
        docSock.emit('part', {
          uid: currUser.id,
          docID: currDoc.id,
          gid: currDoc.gid
        });
      }
    },

    //Tells the API to update the current user's cursor position.
    updateCursor: function(pos) {
      docSock.emit('cursor', {
        uid: currUser.id,
        docID: currDoc.id,
        pos: pos,
        gid: currDoc.gid
      });
    },

    /**
     * Tells the API to change the document's state.
     *
     * @param {String} op The operation being done: 'INSERT' or 'DELETE'.
     *
     * @param {Number} pos The string position that the operation is being
     * done. If you are deleting the first character, then the pos would be 1
     * (the index AFTER the character you're deleting. This is because you are
     * performing the operation AT a position, not ON a position.
     *
     * @param {mixed} val A string for 'INSERT' or an integer for 'DELETE'
     * (number of characters to be deleted).
     */
    changeDoc: function(op, pos, val) {
      docSock.emit('change', {
        id: currDoc.id,
        gid: currDoc.gid,
        op: op,
        uid: currUser.id,
        pos: pos,
        val: val,
        asOf: (currDoc.seq >= 0) ? currDoc.seq : null
      });
    },

    /**
     * Adds a group.
     *
     * @param {String} name The name of the group. This is not unique.
     */
    addGroup: function(name) {
      groupSock.emit('add', name);
    },

    /**
     * Adds a new document in a group with a given ID. IDs must be strings, >=
     * 6 chars long.
     *
     * @param {String} id The document's ID.
     *
     * @param {String} gid The group's ID that this document is joining.
     */
    addDocument: function(id, gid) {
      docSock.emit('add', { id: id, gid: gid });
    },

    /**
     * Retrieves a full copy of the document. You should not use this function
     * to get changes to the document: that's what the doc observers and
     * joining a document are for.
     *
     * @param {String} id The document's ID.
     *
     * @param {String} gid The group's ID that this document belongs to.
     */
    getDocument: function(id, gid) {
      docSock.emit('get', { id: id, gid: gid });
    },

    /**
     * Returns documents that belong to a particular group.
     *
     * @param {String} gid The group's ID.
     */
    getDocumentsByGID: function(gid) {
      docSock.emit('getByGID', gid);
    },

    /*
     * A system wide error handler. This is for user, document, and group
     * errors generated by the server. Just attach a function to this that
     * takes one parameter (the error). If you don't attach a handler, then
     * they'll just be logged.
     */
    onError: null
  };

  return api;
})(io);
