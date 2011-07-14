var docValidator = require('../../src/validators/DocValidator.js');

exports['isValidID()'] = function(test) {
  test.expect(7);

  test.equal(
    typeof docValidator.isValidID,
    'function',
    'isValidID() is not a function.'
  );

  test.throws(
    function() { docValidator.isValidID(123); },
    'Did not throw up on a non-string id.'
  );

  test.throws(
    function() { docValidator.isValidID(null); },
    'Did not throw up on a null id.'
  );

  test.throws(
    function() { docValidator.isValidID(''); },
    'Did not throw up on an empty string.'
  );

  test.throws(
    function() { docValidator.isValidID('12345'); },
    'Did not throw up on a string <6 characters long.'
  );

  test.throws(
    function() { docValidator.isValidID('no spaces allowed'); },
    'Did not throw up on a string with spaces.'
  );

  test.ok(
    docValidator.isValidID('valid-id'),
    'Did not take a valid id.'
  );

  test.done();
};
