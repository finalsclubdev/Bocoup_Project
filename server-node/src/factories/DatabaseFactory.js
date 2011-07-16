exports.makeLibrary = function() {
  var dbDriver = require('../drivers/CouchDBDatabaseDriver.js');

  var cradle = require('cradle');
  cradle.setup({ host: 'http://sbisbee.cloudant.com' });

  dbDriver.db = new(cradle.Connection)().database('fc');

  return dbDriver;
};
