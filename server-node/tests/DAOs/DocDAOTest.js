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
  test.expect(5);

  test.equal(
    typeof docDAO.get,
    'function',
    'get() is not a function.'
  );

  test.throws(
    function() { docDAO.get(null, '123123', function() { }); },
    'Did not throw up on invalid doc id.'
  );

  test.throws(
    function() { docDAO.get('123123', null, function() { }); },
    'Did not throw up on invalid group id.'
  );

  test.throws(
    function() { docDAO.get('123123', '123123', 123123); },
    'Did not throw up on invalid callback.'
  );

  test.doesNotThrow(
    function() { docDAO.get('non-existing-valid-id', 'grpID-A', function() { }); },
    'Threw up on valid input.'
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

  test.throws(
    function() { docDAO.getByGID('123123', true); },
    'Did not throw on an invalid callback.'
  );

  docDAO.getByGID('grpID-A', function(err, docs) {
    test.equal(err, null, 'There was an error.');

    test.equal(
      typeof docs,
      'object',
      'Did not get an object of docs back.'
    );

    for(var i in docs) {
      if(docs.hasOwnProperty(i)) {
        test.equal(typeof docs[i], 'object', 'Document is not an object.');

        test.strictEqual(docs[i].id, i, 'IDs do not match.');
      }
    }

    test.done();
  });
};

exports['join()'] = function(test) {

  test.equal(typeof docDAO.join, 'function', 'join() is not a funciton.');

//uid, gid, did, callback
  test.throws(
    function() { docDAO.join(null, '123123', '123123', function() { }); },
    'Does not throw on invalid UID.'
  );

  test.throws(
    function() { docDAO.join('123123', null, '123123', function() { }); },
    'Does not throw on invalid group ID.'
  );

  test.throws(
    function() { docDAO.join('123123', '123123', null, function() { }); },
    'Does not throw on invalid doc ID.'
  );

  test.throws(
    function() { docDAO.join('123123', '123123', '123123', 123123); },
    'Does not throw on invalid callback.'
  );

  test.doesNotThrow(
    function() { docDAO.join('123123', 'grpID-A', 'some-doc-slug', function() { }); },
    'Threw up on valid input.'
  );

  test.throws(
    function() { docDAO.join('123123', 'grpID-A', 'non-existing doc', function() { }); },
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
    function() { docDAO.updateCursor('gid', 'empty doc', 'uid', 3); },
    'Allowed us to update a doc that does not have a state.'
  );

  docDAO.join('uid123123', 'some-doc-slug', 'grpID-A', function(err, state) {
    test.doesNotThrow(
      function() { docDAO.updateCursor('grpID-A', 'some-doc-slug', 'uid123123', 3); },
      'Did not allow us to update a doc that does have a state and that we joined.'
    );

    test.done();
  });
};

exports['getJoinedUsers()'] = function(test) {
  test.expect(4);

  test.throws(
    function() { docDAO.getJoinedUsers('gid123123', 'did123123'); },
    'Did not throw up when no one has joined the doc yet.'
  );

  test.doesNotThrow(
    function() {
      docDAO.join('uiduiduid', 'some-doc-slug', 'grpID-A', function(data, err) {
        test.equal(err, null, 'There was a problem joining the doc.');

        test.doesNotThrow(
          function() { docDAO.getJoinedUsers('grpID-A', 'some-doc-slug'); },
          'Threw up on a valid, existing doc ID.'
        );

        test.done();
      });
    },
    'join() threw'
  );
};

exports['getUserJoinedDoc()'] = function(test) {
  test.expect(7);

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
    function() {
      docDAO.join('bwahuser', 'some-doc-slug', 'grpID-A', function(data, err) {
        test.equal(err, null, 'There was a problem joining the doc.');

        var docID;

        test.doesNotThrow(
          function() { docID = docDAO.getUserJoinedDoc('bwahuser'); },
          'Threw up on a valid uid.'
        );

        test.strictEqual(docID, 'some-doc-slug', 'Did not return the proper doc id.');

        test.done();
      });
    },
    'Threw up on joining the doc.'
  );
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
    function() { docDAO.add('no spaces allowed', 'valid', function() {}); },
    'Allowed an ID with spaces.'
  );

  test.throws(
    function() { docDAO.add(123, 'valid', function() {}); },
    'Allowed a non-string ID.'
  );

  test.throws(
    function() { docDAO.add('valid', 1234, function() {}); },
    'Allowed a non-string gid.'
  );

  test.throws(
    function() { docDAO.add('valid', 'no spaces allowed', function() {}); },
    'Allowed a GID with spaces.'
  );

  test.throws(
    function() { docDAO.add('valid123', 'valid123', 123); },
    'Allowed a non-function callback.'
  );

  test.doesNotThrow(
    function() {
      docDAO.add('123456', '654321', function(err, newDoc) {
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
      });
    },
    'Threw up on valid input.'
  );
};
