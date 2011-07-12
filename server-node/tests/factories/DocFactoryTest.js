var docFactory = require('../../src/factories/DocFactory.js');
var OperationEnum = require('../../src/enums/OperationEnum.js');

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
  test.expect(27);

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

  test.equal(
    typeof state.addChangeObserver,
    'function',
    'addChangeObserver() does not exist on the state object.'
  );

  test.equal(
    typeof state.execCommand,
    'function',
    'execCommand() does not exist on the state object.'
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

  test.throws(
    function() { state.execCommand(docFactory.makeInsertCommand('uid', 0, 'a', 32)); },
    'Was able to exec a command from a user that has not joined.'
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

  var validCommand = docFactory.makeInsertCommand('bwah', 0, 'a', 32);
  
  test.doesNotThrow(
    function() { state.execCommand(validCommand); },
    'Threw up on a valid command op and uid.'
  );

  var invalidCommand = validCommand;
  invalidCommand.op = 'asdf';

  test.throws(
    function() { state.execCommand(invalidCommand); },
    'Did not throw up on a invalid command op.'
  );

  test.done();
};

exports['makeInsertCommand()'] = function(test) {
  test.expect(1);

  test.deepEqual(
    docFactory.makeInsertCommand('uid', 0, 'a', null),
    {
      uid: 'uid',
      asOf: null,
      pos: 0,
      val: 'a',
      op: OperationEnum['INSERT']
    },
    'Invalid insert command returned.'
  );
    
  test.done();
};

exports['OT'] = function(test) {
  var state = docFactory.makeDocState({ id: 'someDoc' });

  state.addChangeObserver(function(data) {
    if(typeof data.command.asOf == 'number') {
      test.ok(data.command.asOf + 1 === data.command.seq, 'asOf and seq are diff by >1.');
    }
  });

  state.joinUser('uid');
  state.joinUser('otherUser');

  state.execCommand(docFactory.makeInsertCommand('uid', 0, 'b', null));
  state.execCommand(docFactory.makeInsertCommand('uid', 1, 'w', 0));
  state.execCommand(docFactory.makeInsertCommand('uid', 2, 'a', 1));
  state.execCommand(docFactory.makeInsertCommand('uid', 3, 'h', 2));

  //duplicate the 'a' out of seq order
  state.execCommand(docFactory.makeInsertCommand('otherUser', 2, 'a', 1));

  test.strictEqual(state.getDocText(), 'bwaah');

  //add an ! at the end out of seq order
  state.execCommand(docFactory.makeInsertCommand('uid', 4, '!', 3));
  test.strictEqual(state.getDocText(), 'bwaah!');

  //delete the first a
  state.execCommand(docFactory.makeDeleteCommand('uid', 3, 1, 5));
  test.strictEqual(state.getDocText(), 'bwah!');

  //delete the ! at the end
  state.execCommand(docFactory.makeDeleteCommand('uid', 5, 1, 6));
  test.strictEqual(state.getDocText(), 'bwah');

  //insert after where the ! used to be out of seq order
  state.execCommand(docFactory.makeInsertCommand('otherUser', 6, 'h', 5));
  test.strictEqual(state.getDocText(), 'bwahh');

  /*
   * Join a new user, have them send an update with an old seq #, and make sure
   * they get a replay. But only check toUser for old seq #'s.
   */
  state.joinUser('lagger');

  state.addChangeObserver(function(data) {
    if(data.command.seq < 9) {
      test.strictEqual(data.toUser, 'lagger', 'toUser not set properly.');
    }
    else {
      test.strictEqual(data.toUser, undefined, 'toUser set when it should not be.');
    }
  });

  //this triggers both (2) observer callbacks
  state.execCommand(docFactory.makeInsertCommand('lagger', 0, 'l', 0));

  test.done();  
};
