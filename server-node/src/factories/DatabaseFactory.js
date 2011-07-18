exports.makeLibrary = function() {
  var dbDriver = require('../drivers/CouchDBDatabaseDriver.js');

  var cradle = require('cradle');

  dbDriver.db = new(cradle.Connection)('http://sbisbee.cloudant.com', 5984, {
    raw: true
  }).database('fc');

  return dbDriver;
};
