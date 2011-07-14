var docFactory = require('../factories/DocFactory.js');
var userValidator = require('../validators/UserValidator.js');
var OperationEnum = require('../enums/OperationEnum.js');

//map of id => doc
var docs = {
  'one': {
    id: 'one',
    gid: 'grpID-A',
    seq: 23,
    text: 'Hello there, how are you today?'
  },
  'two': {
    id: 'two',
    gid: 'grpID-A',
    seq: 100,
    text: 'This is another document.'
  }
};

//map of docid => uid
var docStates = {};

//map of uid => docid
var users = {};

/**
 * Returns a document by its ID.
 *
 * @param {String} id The document's ID.
 *
 * @returns {Object|null} The document object, or null if it doesn't exist.
 */
exports.get = function(id) {
  if(!id || typeof id != 'string') {
    throw 'Invalid document ID.';
  }

  return docs[id] || null;
};

/**
 * Returns an array of documents that are part of a given group.
 *
 * @param {String} gid The group ID.
 *
 * @returns {Object[]} An array of document objects, which include their ID.
 */
exports.getByGID = function(gid) {
  if(!gid || typeof gid != 'string') {
    throw 'Invalid group ID.';
  }

  var res = {};

  for(var docID in docs) {
    if(docs[docID].gid === gid) {
      docs[docID].id = docID;
      res[docID] = docs[docID];
    }
  }

  return res;
};

/**
 * Joins a user to a document by updating the document's state.
 *
 * @param {String} uid The user's ID.
 *
 * @param {String} docID The document's ID.
 *
 * @return {Object|undefined} If we end up creating a new state for the
 * document, then it gets returned. If the document already has a state, then
 * we don't return anything. This gives our parents one chance to subscribe as
 * observers.
 */
exports.join = function(uid, docID) {
  if(!userValidator.isName(uid)) {
    throw 'Invalid UID.';
  }

  if(!docID || typeof docID != 'string') {
    throw 'Invalid document ID.';
  }

  var newDocState = false;

  if(!docStates[docID]) {
    newDocState = true;

    var doc = this.get(docID);

    if(!doc) {
      throw 'That document does not exist yet.';
    }

    docStates[docID] = docFactory.makeDocState(doc);
  }

  users[uid] = docID;
  docStates[docID].joinUser(uid);

  if(newDocState) {
    return docStates[docID];
  }
};

exports.part = function(uid, docID) {
  if(!userValidator.isName(uid)) {
    throw 'Invalid UID.';
  }

  if(!docID || typeof docID != 'string') {
    throw 'Invalid document ID.';
  }

  if(!docStates[docID]) {
    throw 'No one has joined that document, so why are you trying to part with it?';
  }

  docStates[docID].partUser(uid);
};

/**
 * Updates the state of the document by passing the user's new cursor position.
 *
 * @param {String} docID The document's ID.
 *
 * @param {String} uid The user's ID.
 *
 * @param {Number} pos The user's cursor's position.
 */
exports.updateCursor = function(docID, uid, pos) {
  if(!docStates[docID]) {
    throw 'No one has joined that document yet, so why are you sending me cursor positions?';
  }

  docStates[docID].updateCursor(uid, pos);
};

exports.changeDoc = function(docID, op, uid, pos, val, asOf) {
  if(!docStates[docID]) {
    throw 'No one has joined that document yet, so why are you sending me cursor positions?';
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

  docStates[docID].execCommand(cmd);
};

exports.getJoinedUsers = function(docID) {
  if(!docStates[docID]) {
    throw 'No one has joined that document yet, so why are you sending me cursor positions?';
  }

  return docStates[docID].getUsers();
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

  var docID = users[uid];

  if(!docID) {
    return null;
  }

  return docs[docID] || null;
};
