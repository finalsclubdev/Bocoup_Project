var dbFactory = require('../../src/factories/DatabaseFactory.js');

exports['makeLibrary()'] = function(test) {
  test.expect(4);

  var driver;

  test.equal(
    typeof dbFactory.makeLibrary,
    'function',
    'makeLibrary() is not a function.'
  );

  test.doesNotThrow(
    function() { driver = dbFactory.makeLibrary(); },
    'Did not throw an error.'
  );

  test.equal(
    typeof driver.db.get,
    'function',
    'driver.db.get() is not a function on the driver.'
  );

  test.equal(
    typeof driver.db.save,
    'function',
    'driver.db.save() is not a function on the driver.'
  );

  test.done();
};
