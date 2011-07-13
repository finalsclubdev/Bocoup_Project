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
        if(!observers[i].eventName || observers[i].eventName === eventName) {
          observers[i].callback(data);
        }
      }
    }
  };

  //A socket wide function for handling errors.
  function onError(msg) {
    console.log('err', msg);
  }

  //Stores the current user's info.
  var currUser = {};

  //Stores the current document's info.
  var currDoc = {};

  //The host we're connecting to (node socket.io server).
  var sockHost = 'http://localhost:1337';

  //Our socket groups.
  var userSock = io.connect(sockHost +'/user');
  var groupSock = io.connect(sockHost +'/group');
  var docSock = io.connect(sockHost +'/doc');

  //Bind to the error events with our global handler.
  userSock.on('err', onError);
  groupSock.on('err', onError);

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

  //dockSock events.
  docSock.on('join', function(docID) {
    currDoc = {
      id: docID,
      lastSeenSeq: null
    };

    observers.notify(observers.docEvents, 'join', docID);
  });

  docSock.on('part', function() {
    currDoc = {};

    observers.notify(observers.docEvents, 'part');
  });

  docSock.on('cursor', function(data) {
    observers.notify(observers.docEvents, 'cursor', data);
  });

  docSock.on('change', function(command) {
    if(!currDoc.id) {
      console.warn('Got a change event when not joined to a document.');
    }
    else if(command.asOf == currDoc.lastSeenSeq) {
      console.debug('setting lastSeenSeq to '+command.seq);
      currDoc.lastSeenSeq = command.seq;

      //The editor already has its own edits.
      if(command.uid != currUser.id) {
        observers.notify(observers.docEvents, 'change', command);
      }
    }
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

    //Add an observer to the user events.
    addUserObserver: function(eventName, callback) {
      observers.userEvents.push({
        eventName: eventName,
        callback: callback
      });
    },

    //Add an observer to the doc events.
    addDocObserver: function(eventName, callback) {
      observers.docEvents.push({
        eventName: eventName,
        callback: callback
      });
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
    joinDoc: function(docID) {
      if(currUser.id) {
        if(currDoc.id) {
          api.partDoc();
        }

        docSock.emit('join', {
          uid: currUser.id,
          docID: docID
        });
      }
    },

    //Tells the API to part the current user from the currently joined document.
    partDoc: function() {
      if(currUser.id && currDoc.id) {
        docSock.emit('part', {
          uid: currUser.id,
          docID: currDoc.id
        });
      }
    },

    //Tells the API to update the current user's cursor position.
    updateCursor: function(pos) {
      docSock.emit('cursor', { uid: currUser.id, docID: currDoc.id, pos: pos });
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
        docID: currDoc.id,
        op: op,
        uid: currUser.id,
        pos: pos,
        val: val,
        asOf: currDoc.lastSeenSeq || null
      });
    }
  };

  return api;
})(io);
