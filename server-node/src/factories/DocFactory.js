var OperationEnum = require('../enums/OperationEnum.js');
var docValidator = require('../validators/DocValidator.js');
var groupValidator = require('../validators/GroupValidator.js');

exports.makeDocState = function(doc) {
  if(typeof doc != 'object') {
    throw 'You failed to provide a document object.';
  }

  if(!docValidator.isValidID(doc.id)) {
    throw 'That doc object has an invalid id. Likely a database problem.';
  }

  if(!groupValidator.isValidID(doc.gid)) {
    throw 'That doc object has an invalid gid. Likely a database problem.';
  }
  
  return (function(doc) {
    var users = {}; 
    var cursorObservers = [];
    var changeObservers = [];
    var commandBuffer = [];

    function fireCursorChange(uid, pos) {
      if(typeof uid == 'string' && uid && typeof pos == 'number' && pos >= 0) {
        for(var i in cursorObservers) {
          if(cursorObservers.hasOwnProperty(i)) {
            cursorObservers[i](doc.gid, doc.id, uid, pos);
          }
        }
      }
    }

    function fireDocChange(command, toUser) {
      if(typeof command == 'object') {
        var data = {
          docID: doc.id,
          gid: doc.gid,
          command: command
        };

        if(toUser && typeof toUser == 'string') {
          data.toUser = toUser;
        }

        for(var i in changeObservers) {
          if(changeObservers.hasOwnProperty(i)) {
            changeObservers[i](data);
          }
        }
      }
    }

    function replayToUser(uid, startSeq, endSeq) {
      //TODO if startSeq is < the lowest command seq we have, then force them
      //to reload the entire doc.

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
          case OperationEnum.INSERT:
            newCmd.pos += prevCmd.val.length;
            break;

          case OperationEnum.DELETE:
            newCmd.pos -= prevCmd.val;
            break;

          default:
            throw 'Unsupported OperationEnum during pos conflict resolution.';
        }
      }

      return newCmd;
    }

    function getTailCommand() {
      return commandBuffer[0];
    }

    function getHeadCommand() {
      return commandBuffer[commandBuffer.length - 1];
    }

    function getBufferUsage() {
      return commandBuffer.length;
    }

    function getNextSeq() {
      return commandBuffer.length;
    }

    function getCommandAtSeq(seq) {
      if(commandBuffer.length) {
        return null;
      }

      for(var i in commandBuffer) {
        if(commandBuffer.hasOwnProperty(i)) {
          if(commandBuffer[i].seq === seq) {
            return commandBuffer[i].seq;
          }

          if(seq < commandBuffer[i].seq) {
            return null;
          }
        }
      }
    }

    function setHeadCommand(command) {
      commandBuffer.push(command);
    }

    function flushCommands() {
      commandBuffer = [];
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

          if(getBufferUsage() > 0) {
            replayToUser(uid, getTailCommand().seq, getHeadCommand().seq);
          }

          fireCursorChange(uid, users[uid].cursorPos);
        }
        else {
          throw 'That is not a valid UID.';
        }
      },

      partUser: function(uid) {
        if(typeof uid === 'string' && uid) {
          if(!users[uid]) {
            throw 'That user is not on this document.';
          }

          delete users[uid];

          return true;
        }
        else {
          throw 'That is not a valid UID.';
        }

        return false;
      },

      numUsers: function() {
        var num = 0;

        for(var i in users) {
          if(users.hasOwnProperty(i)) {
            num++;
          }
        }

        return num;
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

      removeChangeObserver: function(callback) {
        if(typeof callback != 'function') {
          throw 'Callbacks must be functions';
        }

        for(var i in changeObservers) {
          if(changeObservers.hasOwnProperty(i) && callback === changeObservers[i]) {
            delete changeObservers[i];
            return true;
          }
        }

        return false;
      },

      /**
       * Merges the change into the current document's state, performing OT if
       * required and managing conflicts.
       *
       * @param {Object} command The command to perform. Build it with
       * makeInsert() or makeDelete().
       *
       * @returns {Object} Returns the updated command (with its new asOf and
       * seq) when there was no problem. In some cases the client will be so
       * behind that it cannot be resolved (likely due to lagging so far behind
       * the buffer), in which case the document will be returned. If the
       * document is returned, then it should be sent to the user so they can
       * update their internal state.
       */
      execCommand: function(command) {
        if(!users[command.uid]) {
          throw 'You must join a document before sending commands to it.';
        }

        if(!OperationEnum[command.op]) {
          throw 'Unsupported OperationEnum op.';
        }

        var headCmd = getHeadCommand();
        var tailCmd = getTailCommand();

        if(
          doc.seq !== null &&
          (
            (doc.seq >= 0 && command.asOf === null) ||
            (tailCmd && command.asOf < tailCmd.seq) ||
            (!headCmd && command.asOf != doc.seq)
          )
        ) {
          /*
           * There was a flush while the client missed some change events
           * (likely due to lag). We need to send them the internal document
           * state so that they can update theirs.
           *
           * Two ways to know that this happened: (1) the buffer is empty and
           * the command's asOf does not match the doc state's. (2) The
           * command's asOf is less than the buffer's youngest command's seq.
           */
          return doc;
        }
        else if(headCmd) {
          // We have to work our OT magic if we are not the first command in the buffer.

          //Their asOf is completely out of sequence, so drop them.
          if(command.asOf > headCmd.seq) {
            return doc;
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
          if(doc.seq) {
            if(command.asOf !== doc.seq) {
              //This should never happen because of the logic above, but better
              //safe than sorry.
              throw 'Not sure what to do with this command based on sequencing, so dropping it to protect the document.';
            }

            //There were other commands before, but not since a persist/flush.
            command.seq = doc.seq + 1;
          }
          else {
            //We are the first command ever for this doc.
            command.seq = 0;
            command.asOf = null;
          }
        }

        setHeadCommand(command);
        fireDocChange(command);

        return command;
      },

      getDocText: function() {
        var text = doc.text || '';

        for(var i in commandBuffer) {
          if(commandBuffer.hasOwnProperty(i)) {
            switch(commandBuffer[i].op) {
              case OperationEnum.INSERT:
                text = text.substr(0, commandBuffer[i].pos) +
                        commandBuffer[i].val +
                        text.substr(commandBuffer[i].pos);
                break;

              case OperationEnum.DELETE:
                text = text.substr(0, commandBuffer[i].pos - commandBuffer[i].val) +
                        text.substr(commandBuffer[i].pos);
                break;
            }
          }
        }

        return text;
      },

      getUsers: function() {
        return users;
      },

      /*
       * When called, the buffer is iterated over and the doc object is
       * updated. Those commands that are iterated over are removed from the
       * buffer. The updated doc object is then returned so that it can be
       * persisted.
       */
      flushBuffer: function() {
        var headCommand = getHeadCommand();

        // There might not have been any changes.
        if(headCommand) {
          doc.text = this.getDocText();
          doc.seq = headCommand.seq;

          flushCommands();
        }

        return {
          id: doc.id,
          gid: doc.gid,
          seq: doc.seq,
          text: doc.text
        };
      },

      /*
       * Takes the internal document state, applies any buffered commands to it
       * (meaning OT), and returns that updated document state. This operation
       * does not flush the commands buffer or update the internal state: use
       * flushBuffer() for that.
       */
      getDoc: function() {
        var newDoc = {
          id: doc.id,
          gid: doc.gid,
          text: doc.text,
          seq: doc.seq
        };

        var headCommand = getHeadCommand();

        if(headCommand) {
          newDoc.text = this.getDocText();
          newDoc.seq = headCommand.seq;
        }

        return newDoc;
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
}

exports.makeInsertCommand = function(uid, pos, val, asOf) {
  return makeCommand(uid, pos, val, asOf, OperationEnum.INSERT);
};

exports.makeDeleteCommand = function(uid, pos, val, asOf) {
  return makeCommand(uid, pos, val, asOf, OperationEnum.DELETE);
};
