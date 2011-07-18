var dbDriver = require('../factories/DatabaseFactory.js').makeLibrary();
var groupValidator = require('../validators/GroupValidator.js');

var testGroups = {
  'grpID-A': {
    name: 'Group A'
  },
  'grpID-B': {
    name: 'Group B'
  }
};

function generateID() {
  var buff = '';

  for(var i = 0; i < 6; i++) {
    buff += Math.floor(Math.random() * 10);
  }

  return buff;
}

/**
 * Gets a map of all the groups by their id.
 *
 * @returns {Object} An object mapping the group ID to the group object.
 */
exports.getList = function() {
  return testGroups;
};

/**
 * Gets a specific group of documents.
 *
 * @param {String} gid The ID of the group.
 * @returns {Object|false} Either the object or a false value if it doesn't exist.
 */
exports.get = function(gid, callback) {
  if(!groupValidator.isValidID(gid)) {
    throw 'Invalid group id.';
  }

  if(!callback || typeof callback !== 'function') {
    throw 'Invalid callback.';
  }

  dbDriver.getGroup(gid, callback);
};

/**
 * Creates a new group.
 *
 * @param {String} id The id of the group.
 *
 * @param {Function} callback The resulting callback: callback(err, data)
 */
exports.add = function(id, callback) {
  if(!groupValidator.isValidID(id)) {
    throw 'Invalid group ID.';
  }

  if(typeof callback !== 'function') {
    throw 'Invalid callback.';
  }

  dbDriver.createGroup(id, callback);
};
