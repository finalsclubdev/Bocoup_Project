var OperationEnum = require('../enums/OperationEnum.js');
var docFactory = require('../factories/DocFactory.js');
var userValidator = require('../validators/UserValidator.js');
var docValidator = require('../validators/DocValidator.js');
var groupValidator = require('../validators/GroupValidator.js');
var dbDriver = require('../factories/DatabaseFactory.js').makeLibrary();

//map of "gid/docid" => uid
var docStates = {};

//map of uid => docid
var users = {};

var docs = {};

function makeDocStatesMapKey(gid, docID) {
  return gid + '/' + docID;
}

/**
 * Creates a new document in a group with a provided ID and returns it.
 *
 * @param {String} id The document's ID. Must be unique.
 *
 * @param {String} gid The group's ID. The group must exist.
 *
 * @param {Function} callback The callback: fn(err, doc)
 */
exports.add = function(id, gid, callback) {
  if(!docValidator.isValidID(id)) {
    throw 'That is not a valid document ID.';
  }

  if(!groupValidator.isValidID(gid)) {
    throw 'That is not a valid group ID.';
  }

  if(typeof callback !== 'function') {
    throw 'Invalid callback.';
  }

  dbDriver.createDoc(
    {
      id: id,
      gid: gid,
      seq: null,
      text: ''
    },
    callback
  );
};

/**
 * Returns a document by its ID.
 *
 * @param {String} id The document's ID.
 *
 * @param {String} gid The group's ID.
 *
 * @param {Function} callback The callback: fn(err, doc)
 */
exports.get = function(id, gid, callback) {
  if(!docValidator.isValidID(id)) {
    throw 'That is not a valid document ID.';
  }

  if(!groupValidator.isValidID(gid)) {
    throw 'That is not a valid group ID.';
  }

  if(typeof callback !== 'function') {
    throw 'Invalid callback.';
  }  

  var mapID = makeDocStatesMapKey(gid, id);

  if(docStates[mapID]) {
    callback(null, docStates[mapID].getDoc());
  }
  else {
    dbDriver.getDoc(id, gid, callback);
  }
};

/**
 * Returns an array of documents that are part of a given group.
 *
 * @param {String} gid The group ID.
 *
 * @param {Function} callback The callback: fn(err, docs)
 */
exports.getByGID = function(gid, callback) {
  if(!gid || typeof gid != 'string') {
    throw 'Invalid group ID.';
  }

  if(typeof callback !== 'function') {
    throw 'Invalid callback.';
  }

  dbDriver.getDocsByGID(gid, callback);
};

/**
 * Joins a user to a document by updating the document's state.
 *
 * @param {String} uid The user's ID.
 *
 * @param {String} docID The document's ID.
 *
 * @param {String} gid The document's group's ID.
 *
 * @param {Function} callback The callback: fn(state, err) - state is only set
 * if the user is the first to join the document. err is only set if there was
 * an error (ex., the document doesn't exist).
 */
exports.join = function(uid, docID, gid, callback) {
  if(!userValidator.isName(uid)) {
    throw 'Invalid UID.';
  }

  if(!docValidator.isValidID(docID)) {
    throw 'Invalid DocID.';
  }

  if(!groupValidator.isValidID(gid)) {
    throw 'Invalid gid.';
  }

  if(typeof callback != 'function') {
    throw 'Invalid callback.';
  }

  var mapID = makeDocStatesMapKey(gid, docID);

  var newDocState = true;

  this.get(docID, gid, function(err, doc) {
    if(err) {
      callback(null, err);
    }
    else if(doc) {
      var newDocState = false;

      if(!docStates[mapID]) {
        newDocState = true;
        docStates[mapID] = docFactory.makeDocState(doc);

        docStates[mapID].addChangeObserver(function(data) {
          if(data.command.seq > 0 && data.command.seq % 20 === 0) {
            var docToPersist = docStates[mapID].flushBuffer();
            console.log('docToPersist', docToPersist);
            //TODO persist the doc
          }
        });
      }

      users[uid] = mapID;
      docStates[mapID].joinUser(uid);

      callback(((newDocState) ? docStates[mapID] : null), null);
    }
    else {
      callback(null, 'Could not find that document.');
    }
  });
};

/**
 * Parts a user from a document.
 *
 * @param {String} uid The user's ID.
 *
 * @param {String} gid The document's group's ID.
 *
 * @param {String} docID The document's ID.
 *
 * @param {Function} callback The callback: fn(err).
 */
exports.part = function(uid, gid, docID, callback) {
  if(!userValidator.isName(uid)) {
    throw 'Invalid UID.';
  }

  if(!docValidator.isValidID(docID)) {
    throw 'Invalid document ID.';
  }

  if(!groupValidator.isValidID(gid)) {
    throw 'Invalid group ID.';
  }

  var mapID = makeDocStatesMapKey(gid, docID);

  if(!docStates[mapID]) {
    throw 'No one has joined that document, so why are you trying to part with it?';
  }

  var err;

  try {
    if(!docStates[mapID].partUser(uid)) {
      err = 'You just tried to part a user from a document that they were not joined to.';
    }
  }
  catch(e) {
    err = e;
  }

  callback(err || null);
};

/**
 * Updates the state of the document by passing the user's new cursor position.
 *
 * @param {String} gid The document's group ID.
 *
 * @param {String} docID The document's ID.
 *
 * @param {String} uid The user's ID.
 *
 * @param {Number} pos The user's cursor's position.
 */
exports.updateCursor = function(gid, docID, uid, pos) {
  var mapID = makeDocStatesMapKey(gid, docID);

  if(!docStates[mapID]) {
    throw 'No one has joined that document yet, so why are you sending me cursor positions?';
  }

  docStates[mapID].updateCursor(uid, pos);
};

/**
 * Submits a change to a document.
 *
 * @param {String} gid The document's group's ID.
 *
 * @param {String} docID The document's ID.
 *
 * @param {String} op The operation (from OperationEnum).
 *
 * @param {String} uid The user's ID.
 *
 * @param {Number} pos The string position to do the operation at.
 *
 * @param {String|Number} val The value for the operation. A letter, or
 * letters, for INSERT or the number of characters to remove on DELETE.
 *
 * @param {Number} asOf The last seen sequence number.
 *
 * @returns {Object} If the change was behind the buffer, then the current
 * state of the document is returned. It needs to be sent to the client so they
 * can update their state and resend the command. Doesn't return anything if
 * the command executed.
 */
exports.changeDoc = function(gid, docID, op, uid, pos, val, asOf) {
  var mapID = makeDocStatesMapKey(gid, docID);

  if(!docStates[mapID]) {
    throw 'No one has joined that document yet, so why are you sending me changes?';
  }

  var cmd;

  switch(op) {
    case OperationEnum.INSERT:
      cmd = docFactory.makeInsertCommand(uid, pos, val, asOf);
      break;

    case OperationEnum.DELETE:
      cmd = docFactory.makeDeleteCommand(uid, pos, val, asOf);
      break;

    default:
      throw 'Unsupported document operation: '+ op +'.';
  }

  var result = docStates[mapID].execCommand(cmd);

  if(result.id && result.gid) {
    return result;
  }
};

exports.getJoinedUsers = function(gid, docID) {
  var mapID = makeDocStatesMapKey(gid, docID);

  if(!docStates[mapID]) {
    throw 'No one has joined that document yet, so why are you asking for joined users?'; 
  }

  return docStates[mapID].getUsers();
};

/**
 * Returns the document ID that the user has joined to, null if they aren't on
 * any documents.
 *
 * @param {String} uid The user's ID.
 *
 * @returns {String|null} The document's ID, or null if they are not currently
 * joined to a document.
 */
exports.getUserJoinedDoc = function(uid) {
  if(typeof uid !== 'string') {
    throw 'Invalid user id.';
  }

  return (users[uid]) ? users[uid].substr(users[uid].indexOf('/') + 1) : null;
};
