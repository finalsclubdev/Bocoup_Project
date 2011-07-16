var groupValidator = require('../../src/validators/GroupValidator.js');

exports['isValidID()'] = function(test) {
  test.expect(8);

  test.equal(
    typeof groupValidator.isValidID,
    'function',
    'isValidID() is not a function.'
  );

  test.throws(
    function() { groupValidator.isValidID(123); },
    'Did not throw up on a non-string id.'
  );

  test.throws(
    function() { groupValidator.isValidID(null); },
    'Did not throw up on a null id.'
  );

  test.throws(
    function() { groupValidator.isValidID(''); },
    'Did not throw up on an empty string.'
  );

  test.throws(
    function() { groupValidator.isValidID('12345'); },
    'Did not throw up on a string <6 characters long.'
  );

  test.throws(
    function() { groupValidator.isValidID('no spaces allowed'); },
    'Did not throw up on a string with spaces.'
  );

  test.throws(
    function() { groupValidator.isValidID('no:colons'); },
    'Did not throw up on a colon.'
  );

  test.ok(
    groupValidator.isValidID('valid-id'),
    'Did not take a valid id.'
  );

  test.done();
};

exports['isValidName()'] = function(test) {
  test.expect(5);

  test.equal(
    typeof groupValidator.isValidName,
    'function',
    'isValidName() is not a function.'
  );

  test.throws(
    function() { groupValidator.isValidName(); },
    'Did not throw up on no name.'
  );

  test.throws(
    function() { groupValidator.isValidName(123); },
    'Did not throw up on a non-string.'
  );

  test.throws(
    function() { groupValidator.isValidName(''); },
    'Did not throw up on an empty string.'
  );

  test.doesNotThrow(
    function() { groupValidator.isValidName('valid'); },
    'Threw up on a valid group name.'
  );

  test.done();
};
