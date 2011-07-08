exports.makeDocState = function(doc) {
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
          users[uid] = {
            cursorPos: 0
          };
        }

        fireCursorChange(uid, users[uid].cursorPos);
      },

      addCursorObserver: function(callback) {
        cursorObservers.push(callback);
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
