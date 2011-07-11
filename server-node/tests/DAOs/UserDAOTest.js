var userDAO = require('../../src/DAOs/UserDAO.js');

exports['login()'] = function(test) {
  test.expect(1);

  test.equal(
    typeof userDAO.login,
    'function',
    'The login() function is not a function.'
  );

  test.done();
};

exports['logout()'] = function(test) {
  test.expect(1);

  test.equal(
    typeof userDAO.logout,
    'function',
    'The logout() function is not a function.'
  );

  test.done();
};

exports['disconnect()'] = function(test) {
  test.expect(1);

  test.equal(
    typeof userDAO.disconnect,
    'function',
    'The disconnect() function is not a function.'
  );

  test.done();
};
