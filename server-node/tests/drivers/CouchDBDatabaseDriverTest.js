var db = require('../../src/drivers/CouchDBDatabaseDriver.js');

exports['instantiation'] = function(test) {
  test.expect(1);

  test.equal(typeof db, 'object', 'The driver was not created.');

  test.done();
};

exports['getGroup()'] = function(test) {
  test.expect(3);

  test.equal(typeof db.getGroup, 'function', 'getGroup() is not a function.');

  test.throws(
    function() { db.getGroup('valid123', null); },
    'Did not throw on an invalid callback.'
  );

  test.throws(
    function() { db.getGroup(123, function() { }); },
    'Did not throw on an invalid group ID.'
  );

  test.done();
};
