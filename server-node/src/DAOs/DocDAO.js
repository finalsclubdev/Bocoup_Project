var docFactory = require('../factories/DocFactory.js');
var userValidator = require('../validators/UserValidator.js');
var OperationEnum = require('../enums/OperationEnum.js');

//map of id => doc
var docs = {
  'one': {
    id: 'one',
    name: 'One Document',
    gid: 'grpID-A',
    seq: 23,
    text: 'Hello there, how are you today?'
  },
  'two': {
    id: 'two',
    name: 'Another Document',
    gid: 'grpID-A',
    seq: 100,
    text: 'This is another document.'
  }
};

var docStates = {};

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
    docStates[docID] = docFactory.makeDocState(exports.get(docID));
  }

  docStates[docID].joinUser(uid);

  if(newDocState) {
    return docStates[docID];
  }
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
    case OperationEnum['INSERT']:
      cmd = docFactory.makeInsertCommand(uid, pos, val, asOf);
      break;

    case OperationEnum['DELETE']:
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
}
