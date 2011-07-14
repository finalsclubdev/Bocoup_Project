var groupDAO = require('../../src/DAOs/GroupDAO.js');

exports['instantiation'] = function(test) {
  test.expect(1);

  test.equal(typeof groupDAO, 'object', 'groupDAO is not an object.');

  test.done();
};

exports['getList()'] = function(test) {
  test.expect(6);

  test.equal(
    typeof groupDAO.getList,
    'function',
    'getList() is not a function.'
  );

  var list = groupDAO.getList();

  test.equal(
    typeof list,
    'object',
    'Lists are not objects when they should be.'
  );

  for(var i in list) {
    test.equal(
      typeof list[i],
      'object',
      'A list item does not have the write data type.'
    );

    test.equal(
      typeof list[i].name,
      'string',
      'A list item\'s name is not a string.'
    );
  }

  test.done();
};

exports['get()'] = function(test) {
  test.expect(5);

  test.equal(
    typeof groupDAO.get,
    'function',
    'get() is not a function.'
  );

  var list = groupDAO.getList();

  for(var i in list) {
    test.ok(groupDAO.get(i));
    break; //only do it once
  }

  test.throws(
    function() { groupDAO.get(123); },
    'Allowed a non-string ID.'
  );

  test.throws(
    function() { groupDAO.get(null); },
    'Allowed a null ID.'
  );

  test.strictEqual(
    groupDAO.get('valid, non-existing id'),
    false,
    'Gave us a !== false value for a group that does not exist.'
  );

  test.done();
};

exports['add()'] = function(test) {
  test.expect(7);

  test.equal(
    typeof groupDAO.add,
    'function',
    'add() is not a funciton.'
  );

  var before = groupDAO.getList();

  var numBefore = 0;

  for(var i in before) {
    if(before.hasOwnProperty(i)) {
      numBefore++;
    }
  }

  test.doesNotThrow(
    function() { groupDAO.add('name'); },
    'Threw up on valid input.'
  );

  test.throws(
    function() { groupDAO.add(null); },
    'Did not throw up on an invalid name.'
  );

  var after = groupDAO.getList();
  var numAfter = 0;

  for(var i in after) {
    if(after.hasOwnProperty(i)) {
      numAfter++;

      test.equal(
        typeof after[i].name,
        'string',
        'There is a group without a name.'
      );
    }
  }
    
  test.strictEqual(numAfter, numBefore + 1, 'Group did not get added.');

  test.done();
};
