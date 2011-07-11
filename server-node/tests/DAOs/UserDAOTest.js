var userDAO = require('../../src/DAOs/UserDAO.js');

exports['instantiation'] = function(test) {
  test.expect(1);

  test.equal(
    typeof userDAO,
    'object',
    'userDAO is not set.'
  );

  test.done();
};

exports['login()'] = function(test) {
  test.expect(6);

  test.equal(
    typeof userDAO.login,
    'function',
    'The login() function is not a function.'
  );

  test.ok(userDAO.login('name', 'sessionID'), 'Unable to join a valid user.');

  //Do the same thing again, which should work because session ids match.
  test.ok(userDAO.login('name', 'sessionID'), 'Unable to join a valid user.');

  test.throws(
    function() { userDAO.login('name', 'diff session id') },
    'Did not throw when joining a user with the same name and diff session ID.'
  );

  test.throws(
    function() { userDAO.login(null, 'valid'); },
    'Did not throw on an invalid UID.'
  );

  test.throws(
    function() { userDAO.login('valid', 123); },
    'Did not throw on an invalid session ID.'
  );

  test.done();
};

exports['logout()'] = function(test) {
  test.expect(4);

  test.equal(
    typeof userDAO.logout,
    'function',
    'The logout() function is not a function.'
  );

  test.ok(
    userDAO.logout('name', 'sessionID'),
    'Not able to log a user out that was logged in.'
  );

  test.equal(
    userDAO.logout('name', 'sessionID'),
    false,
    'Logged a user out that was not logged in.'
  );

  userDAO.login('uid', 'sid');

  test.throws(
    function() { userDAO.logout('uid', 'diff sid'); },
    'Did not throw when trying to log someone else out.'
  );

  test.done();
};

exports['disconnect()'] = function(test) {
  test.expect(5);

  test.equal(
    typeof userDAO.disconnect,
    'function',
    'The disconnect() function is not a function.'
  );

  test.equal(
    userDAO.disconnect('unused sid'),
    false,
    'Managed to remove a user by their SID when they were not logged in.'
  );

  test.ok(
    userDAO.login('uid', 'sid'),
    'Was not able to log the user in.'
  );

  test.equal(
    userDAO.disconnect('sid'),
    true,
    'Unable to remove a user by their SID.'
  );

  test.equal(
    userDAO.logout('uid', 'sid'),
    false,
    'The user is still logged in even after disconnecting them.'
  );

  test.done();
};
