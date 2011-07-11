var validator = require('../../src/validators/UserValidator.js');

exports['isName()'] = function(test) {
  test.expect(3);

  test.ok(validator.isName('bwah'), 'Balked on a valid user name.');

  test.throws(
    function() { validator.isName(123); },
    'Did not throw when given an int for a UID.'
  );

  test.throws(
    function() { validator.isName(''); },
    'Did not throw when given an empty string for a UID.'
  );

  test.done();
};

exports['isSessionID()'] = function(test) {
  test.expect(3);

  test.ok(validator.isSessionID('bwah'), 'Balked on a valid session ID.');

  test.throws(
    function() { validator.isSessionID(123); },
    'Did not throw when given an int for a session ID.'
  );

  test.throws(
    function() { validator.isSessionID(''); },
    'Did not throw when given an empty string for a session ID.'
  );

  test.done();
};
