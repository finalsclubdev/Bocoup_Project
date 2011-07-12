var OperationEnum = require('../enums/OperationEnum.js');

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
    var changeObservers = [];
    var commandBuffer = [];

    function fireCursorChange(uid, pos) {
      if(typeof uid == 'string' && uid && typeof pos == 'number' && pos >= 0) {
        for(var i in cursorObservers) {
          cursorObservers[i](uid, pos);
        }
      }
    }

    function fireDocChange(command, toUser) {
      if(typeof command == 'object') {
        var data = {
          command: command,
        };

        if(toUser && typeof toUser == 'string') {
          data.toUser = toUser;
        }

        for(var i in changeObservers) {
          changeObservers[i](data);
        }
      }
    }

    function replayToUser(uid, startSeq, endSeq) {
      if(typeof startSeq != 'number') {
        throw 'startSeq is not a number';
      }

      if(typeof endSeq != 'number') {
        throw 'endSeq is not a number';
      }

      if(startSeq > endSeq) {
        throw 'startSeq is greater than endSeq';
      }

      for(var i = startSeq; i <= endSeq; i++) {
        fireDocChange(getCommandAtSeq(i), uid);
      }
    }

    function resolveCommandPosition(newCmd, prevCmd) {
      if(newCmd.pos > prevCmd.pos) {
        switch(prevCmd.op) {
          case OperationEnum['INSERT']:
            newCmd.pos += prevCmd.val.length;
            break;

          case OperationEnum['DELETE']:
            newCmd.pos -= prevCmd.val;
            break;

          default:
            throw 'Unsupported OperationEnum during pos conflict resolution.';
        }
      }

      return newCmd;
    }

    function getHeadCommand() {
      return commandBuffer[commandBuffer.length - 1];
    }

    function getNextSeq() {
      return commandBuffer.length;
    }

    function getCommandAtSeq(seq) {
      return commandBuffer[seq];
    }

    function setHeadCommand(command) {
      //TODO validate
      commandBuffer.push(command);
    }

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
      },

      addChangeObserver: function(callback) {
        if(typeof callback != 'function') {
          throw 'Callbacks must be functions.';
        }

        changeObservers.push(callback);
      },

      execCommand: function(command) {
        if(!users[command.uid]) {
          throw 'You must join a document before sending commands to it.';
        }

        if(!OperationEnum[command.op]) {
          throw 'Unsupported OperationEnum op.';
        }

        var headCmd = getHeadCommand();

        // We have to work our OT magic if we are not the first command.
        if(headCmd) {

          //Their asOf is completely out of sequence, so drop them.
          if(command.asOf > headCmd.seq) {
            throw 'Command rejected: asOf value is greater than the head command\'s seq.';
          }

          /*
           * When the new command's asOf seq number is less than the head
           * command's sequence number, then the client was missing commands
           * (out of sync) when they sent this command. We are going to trigger
           * a replay of the range of commands that they have missed, so that
           * they become in sync.
           *
           * We will then resolve the conflict: we iterate over all of the
           * commands that they missed, updating the position depending on what
           * those previous commands did. We can do this because we know the
           * previous command's positions, whether they inserted or removed,
           * and how much they inserted or removed.
           */
          if(command.asOf < headCmd.seq) {
            replayToUser(command.uid, command.asOf + 1, headCmd.seq);            

            //resolve the positions
            for(var i = command.asOf + 1; i <= headCmd.seq; i++) {
              command = resolveCommandPosition(command, getCommandAtSeq(i));
            }
          }

          command.seq = headCmd.seq + 1;
          command.asOf = headCmd.seq;
        }
        else {
          // We are the first command.
          command.seq = 0;
          command.asOf = null;
        }

        setHeadCommand(command);
        fireDocChange(command);

        return command;
      },

      getDocText: function() {
        var doc = '';

        for(var i in commandBuffer) {
          doc = doc.substr(0, commandBuffer[i].pos) + commandBuffer[i].val + doc.substr(commandBuffer[i].pos);
        }

        return doc;
      }
    };
  })(doc);
};

function makeCommand(uid, pos, val, asOf, op) {
  return {
    op: op,
    uid: uid,
    val: val,
    pos: pos,
    asOf: asOf
  };
};

exports.makeInsertCommand = function(uid, pos, val, asOf) {
  return makeCommand(uid, pos, val, asOf, OperationEnum['INSERT']);
};

exports.makeRemoveCommand = function(uid, pos, val, asOf) {
  return makeCommand(uid, pos, val, asOf, OperationEnum['REMOVE']);
};
