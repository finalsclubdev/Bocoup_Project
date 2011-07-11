var docFactory = require('../../src/factories/DocFactory.js');

exports["makeDocState() input validation"] = function(test) {
  test.expect(5);

  test.equal(
    typeof docFactory.makeDocState,
    'function',
    'makeDocState is not a function.'
  );

  test.equal(
    typeof docFactory.makeDocState({ id: 'bwah' }),
    'object',
    'Did not return a state object.'
  );

  test.throws(
    function() { docFactory.makeDocState({}); },
    'Did not throw an exception on a doc object missing an id.'
  );

  test.throws(
    function() { docFactory.makeDocState(null); },
    'Did not throw an exception on non-object input.'
  );

  test.throws(
    function() { docFactory.makeDocState('hi there'); },
    'Did not throw an exception on string input.'
  );

  test.done();
};

exports["makeDocState() output's functions"] = function(test) {
  test.expect(22);

  var state = docFactory.makeDocState({ id: 'bwah' });

  // Make sure the base functions exist.
  test.equal(
    typeof state.removeCursorObserver,
    'function',
    'removeCursorObserver() does not exist on the state object.'
  );

  test.equal(
    typeof state.joinUser,
    'function',
    'joinUser() does not exist on the state object.'
  );

  test.equal(
    typeof state.addCursorObserver,
    'function',
    'addCursorObserver() does not exist on the state object.'
  );

  test.equal(
    typeof state.updateCursor,
    'function',
    'updateCursor() does not exist on the state object.'
  );

  // Make sure functions that require a user fail when provided a non-existing one.
  test.throws(
    function() { state.updateCursor('non-existing user', 32); },
    'Was able to update the cursor for a non-existing user.'
  );

  test.throws(
    function() { state.joinUser(123); },
    'Was able to set a user with a non-string UID.'
  );

  // Join a user, so everything after this should work with that user.
  var onInitialCursorUpdate = function(uid, pos) {
    test.equal(uid, 'bwah', 'Incorrect UID reported.');
    test.equal(pos, 0, 'Incorrect initial cursor position reported.');
  };

  test.throws(
    function() { state.addCursorObserver(123); },
    'Was able to set a non-function callback.'
  );

  test.doesNotThrow(
    function() { state.addCursorObserver(onInitialCursorUpdate); },
    'Incorrectly threw up on a function.'
  );

  test.doesNotThrow(
    function() { state.joinUser('bwah'); },
    'Incorrectly threw up on a valid user ID.'
  );

  test.ok(
    state.removeCursorObserver(onInitialCursorUpdate),
    'Was not able to remove the onInitialCursorUpdate() observer.'
  );

  var onCursorUpdate = function(uid, pos) {
    test.equal(uid, 'bwah', 'Incorrect UID reported.');
    test.equal(pos, 32, 'Incorrect cursor position reported.');
  };

  test.doesNotThrow(
    function() { state.addCursorObserver(onCursorUpdate); },
    'Incorrect threw up on a valid observer function.'
  );

  test.doesNotThrow(
    function() { state.updateCursor('bwah', 32); },
    'Valid update parameters were not accepted.'
  );

  test.throws(
    function() { state.updateCursor(null, 32); },
    'Invalid UID was accepted.'
  );

  test.throws(
    function() { state.updateCursor('bwah', -1); },
    'Out of range cursor position was accepted.'
  );

  test.throws(
    function() { state.updateCursor('bwah', null); },
    'Invalid cursor position was accepted.'
  );

  test.ok(
    state.removeCursorObserver(onCursorUpdate),
    'Was not able to remove the onCursorUpdate() observer.'
  );

  test.throws(
    function() { state.joinUser('bwah'); },
    'The same user was allowed to join more than once.'
  );

  test.doesNotThrow(
    function() { state.joinUser('notAlreadyJoined'); },
    'A second, non-dupe user was not allowed to join.'
  );

  test.done();
};
