var docDAO = require('../../src/DAOs/DocDAO.js');

exports['instantiation'] = function(test) {
  test.expect(1);

  test.equal(
    typeof docDAO,
    'object',
    'docDAO is not an object.'
  );

  test.done();
};

exports['get()'] = function(test) {
  test.expect(9);

  test.equal(
    typeof docDAO.get,
    'function',
    'get() is not a function.'
  );

  test.strictEqual(
    docDAO.get('non-existing, valid id'),
    null,
    'Returned a non-null value when there was no doc.'
  );

  test.throws(
    function() { docDAO.get(null); },
    'Does not throw on a null id.'
  );

  test.throws(
    function() { docDAO.get(''); },
    'Does not throw on an empty string.'
  );

  test.throws(
    function() { docDAO.get(123); },
    'Does not throw on an integer for an id.'
  );    

  var doc = docDAO.get('one');

  test.equal(
    typeof doc,
    'object',
    'Got a non-object document.'
  );

  test.equal(
    typeof doc.gid,
    'string',
    'Got a non-string group id.'
  );

  test.equal(
    typeof doc.seq,
    'number',
    'Got a non-numeric sequence number.'
  );

  test.equal(
    typeof doc.text,
    'string',
    'Got a non-string text.'
  );

  test.done();
};

exports['getByGID()'] = function(test) {
  //Not using expect, because we're looping over results.

  test.equal(
    typeof docDAO.getByGID,
    'function',
    'getByGID() is not a function.'
  );

  test.throws(
    function() { docDAO.getByGID(null); },
    'Did not throw on a null GID.'
  );

  test.throws(
    function() { docDAO.getByGID(123); },
    'Did not throw on a true, non-string GID.'
  );

  var docs = docDAO.getByGID('grpID-A');

  test.equal(
    typeof docs,
    'object',
    'Did not get an object of docs back.'
  );

  for(var i in docs) {
    test.equal(typeof docs[i], 'object', 'Document is not an object.');

    test.strictEqual(docs[i].id, i, 'IDs do not match.');
  }

  test.done();
};

exports['join()'] = function(test) {
  test.expect(8);

  test.equal(typeof docDAO.join, 'function', 'join() is not a funciton.');

  test.throws(
    function() { docDAO.join(null, null); },
    'Does not throw on invalid UID.'
  );

  test.throws(
    function() { docDAO.join('valid', null); },
    'Does not throw on invalid doc ID.'
  );

  var state;

  test.doesNotThrow(
    function() { state = docDAO.join('bwah', 'one'); },
    'Got an exception when joining a valid user.'
  );

  test.equal(typeof state, 'object', 'Did not get an object on first join.');

  test.doesNotThrow(
    function() { state = docDAO.join('boo', 'one'); },
    'Got an exception when joining the second valid user.'
  );

  test.equal(
    typeof state,
    'undefined',
    'Got a defined value when joining the second user.'
  );

  test.throws(
    function() { docDAO.join('hi', 'non-existing doc'); },
    'Did not throw when the document does not exist.'
  );

  test.done();
};

exports['updateCursor()'] = function(test) {
  test.expect(3);

  test.equal(
    typeof docDAO.updateCursor,
    'function',
    'updateCursor() is not a function'
  );

  test.throws(
    function() { docDAO.updateCursor('empty doc', 'uid', 3); },
    'Allowed us to update a doc that does not have a state.'
  );

  docDAO.join('uid', 'one');

  test.doesNotThrow(
    function() { docDAO.updateCursor('one', 'uid', 3); },
    'Did not allow us to update a doc that does have a state and that we joined.'
  );

  test.done();
};

exports['getJoinedUsers()'] = function(test) {

  test.expect(6);

  test.throws(
    function() { docDAO.getJoinedUsers('two'); },
    'Did not throw up when no one has joined the doc yet.'
  );

  var users;

  test.doesNotThrow(
    function() { users = docDAO.getJoinedUsers('one'); },
    'Threw up on a valid, existing doc ID.'
  );

  test.equal(
    typeof users,
    'object',
    'Did not return the proper type.'
  );

  for(var i in users) {
    if(users.hasOwnProperty(i)) {
      test.equal(typeof users[i].cursorPos, 'number', 'Invalid cursor position.');
    }
  }

  test.done();
};

exports['getUserJoinedDoc()'] = function(test) {
  test.expect(6);

  test.equal(
    typeof docDAO.getUserJoinedDoc,
    'function',
    'getUserJoinedDoc() is not a function.'
  );

  test.throws(
    function() { docDAO.getUserJoinedDoc(123); },
    'Did not throw up on invalid uid.'
  );

  test.strictEqual(
    docDAO.getUserJoinedDoc('bwahuser'),
    null,
    'Did not return null when the user has not joined any docs yet.'
  );

  test.doesNotThrow(
    function() { docDAO.join('bwahuser', 'one'); },
    'Threw up on joining the doc.'
  );

  var doc;

  test.doesNotThrow(
    function() { doc = docDAO.getUserJoinedDoc('bwahuser'); },
    'Threw up on a valid uid.'
  );

  test.strictEqual(
    doc.id,
    'one',
    'Did not return the proper docID.'
  );

  test.done();
};

exports['changeDoc()'] = function(test) {
  test.expect(3);

  test.equal(
    typeof docDAO.changeDoc,
    'function',
    'changeDoc() is not a function.'
  );

  test.throws(
    function() { docDAO.changeDoc('not existing', 'INSERT', 'bwah', 0, 'a'); },
    'Did not throw on an doc that does not have anyone joined.'
  );

  test.throws(
    function() { docDAO.changeDoc('one', 'invalid op', 'bwah', 0, 'a'); },
    'Did not throw up on an invalid operation.'
  );

  test.done();
};

exports['add()'] = function(test) {
  test.equal(
    typeof docDAO.add,
    'function',
    'add() is not a function.'
  );

  test.throws(
    function() { docDAO.add('no spaces allowed', 'valid'); },
    'Allowed an ID with spaces.'
  );

  test.throws(
    function() { docDAO.add(123, 'valid'); },
    'Allowed a non-string ID.'
  );

  test.throws(
    function() { docDAO.add('valid', 1234); },
    'Allowed a non-string gid.'
  );

  test.throws(
    function() { docDAO.add('valid', 'no spaces allowed'); },
    'Allowed a GID with spaces.'
  );

  var newDoc;

  test.doesNotThrow(
    function() { newDoc = docDAO.add('123456', '654321'); },
    'Threw up on valid input.'
  );

  test.deepEqual(
    newDoc,
    {
      id: '123456',
      gid: '654321',
      seq: null,
      text: ''
    },
    'The created document was not what we were expecting.'
  );

  test.done();
};
