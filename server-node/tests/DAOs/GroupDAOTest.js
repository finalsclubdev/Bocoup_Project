var groupDAO = require('../../src/DAOs/GroupDAO.js');

exports['instantiation'] = function(test) {
  test.expect(1);

  test.equal(typeof groupDAO, 'object', 'groupDAO is not an object.');

  test.done();
};

exports['getList()'] = function(test) {
  test.expect(2);

  test.equal(
    typeof groupDAO.getList,
    'function',
    'getList() is not a function.'
  );

  test.doesNotThrow(
    function() { groupDAO.getList(function(err, list) { }); },
    'Threw on valid input.'
  );

  test.done();
};

exports['get()'] = function(test) {
  test.expect(5);

  var callback = function(err, doc) {
  };

  test.equal(
    typeof groupDAO.get,
    'function',
    'get() is not a function.'
  );

  test.throws(
    function() { groupDAO.get(123, callback); },
    'Allowed a non-string ID.'
  );

  test.throws(
    function() { groupDAO.get(null, callback); },
    'Allowed a null ID.'
  );

  test.throws(
    function() { groupDAO.get('valid', null); },
    'Allowed a null function.'
  );

  test.doesNotThrow(
    function() { groupDAO.get('valid123', callback); },
    'Did not allow valid params.'
  );

  test.done();
};

exports['add()'] = function(test) {
  test.expect(4);

  test.equal(
    typeof groupDAO.add,
    'function',
    'add() is not a funciton.'
  );

  test.doesNotThrow(
    function() { groupDAO.add('123123', function() { }); },
    'Threw up on valid input.'
  );

  test.throws(
    function() { groupDAO.add(null, function() { }); },
    'Did not throw up on an invalid name.'
  );

  test.throws(
    function() { groupDAO.add('123123', 123); },
    'Did not throw up on an invalid callback.'
  );

  test.done();
};
