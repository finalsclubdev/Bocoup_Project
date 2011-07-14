var groupValidator = require('../../src/validators/GroupValidator.js');

exports['isValidID()'] = function(test) {
  test.expect(7);

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

  test.ok(
    groupValidator.isValidID('valid-id'),
    'Did not take a valid id.'
  );

  test.done();
};
