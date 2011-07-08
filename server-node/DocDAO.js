var docFactory = require('./DocFactory.js');

//map of id => doc
var docs = {
  'one': {
    name: 'One Document',
    gid: 'grpID-A',
    seq: 23,
    text: 'Hello there, how are you today?'
  },
  'two': {
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
  return (docs[id]) ? docs[id] : null;
};

/**
 * Returns an array of documents that are part of a given group.
 *
 * @param {String} gid The group ID.
 *
 * @returns {Object[]} An array of document objects, which include their ID.
 */
exports.getByGID = function(gid) {
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
  var newDocState = false;

  if(!docStates[docID]) {
    newDocState = true;
    docStates[docID] = docFactory.makeDocState(exports.get(docID));
  }

  docStates[docID].joinUser(uid);

  return (newDocState) ? docStates[docID] : undefined;
};
