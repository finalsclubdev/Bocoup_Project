exports.makeDocState = function(doc) {
  if(typeof doc != 'object') {
    throw 'You failed to provide a document object.';
  }

  if(!doc.id || typeof doc.id != 'string') {
    throw 'That doc object has an invalid id.';
  }
  
  return (function(doc) {
    var users = {}; 
    var cursorObservers = [];

    function fireCursorChange(uid, pos) {
      if(typeof uid == 'string' && uid && typeof pos == 'number' && pos >= 0) {
        for(var i in cursorObservers) {
          cursorObservers[i](uid, pos);
        }
      }
    };

    return {
      joinUser: function(uid) {
        if(typeof uid == 'string' && uid) {
          if(users[uid]) {
            throw 'That user has already joined.';
          }

          users[uid] = {
            cursorPos: 0
          };

          fireCursorChange(uid, users[uid].cursorPos);
        }
        else {
          throw 'That is not a valid UID.';
        }
      },

      addCursorObserver: function(callback) {
        if(typeof callback != 'function') {
          throw 'Callbacks must be functions.';
        }

        cursorObservers.push(callback);
      },

      removeCursorObserver: function(callback) {
        for(var i in cursorObservers) {
          if(cursorObservers[i] === callback) {
            cursorObservers.splice(i, 1);
            return true;
          }
        }

        return false;
      },

      updateCursor: function(uid, pos) {
        if(!users[uid]) {
          throw 'That user has not joined this document yet.';
        }

        if(typeof pos != 'number' || pos < 0) {
          throw 'That is not a valid cursor position.';
        }

        users[uid].cursorPos = pos;

        fireCursorChange(uid, users[uid].cursorPos);
      }
    };
  })(doc);
};
