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

exports['createGroup()'] = function(test) {
  test.equal(typeof db.createGroup, 'function', 'createGroup() is not a function.');

  test.throws(
    function() { db.createGroup(123, function() { }); },
    'Invalid gid.'
  );

  test.throws(
    function() { db.createGroup('gid', true); },
    'Invalid callback.'
  );

  test.doesNotThrow(
    function() {
      var id = ''+Math.floor(Math.random() * 1000000);

      db.createGroup(id, function(err, data) {
        test.equal(err, null, 'There was an error.');

        test.done();
      });
    },
    'Threw despite a perfectly fine callback.'
  );
};
