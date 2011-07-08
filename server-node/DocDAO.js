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

/**
 * Returns a document by its ID.
 *
 * @param {String} id The document's ID.
 * @returns {Object|null} The document object, or null if it doesn't exist.
 */
exports.get = function(id) {
  return (docs[id]) ? docs[id] : null;
};

/**
 * Returns an array of documents that are part of a given group.
 *
 * @param {String} gid The group ID.
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
