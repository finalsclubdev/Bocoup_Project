var testGroups = {
  'grpID-A': {
    name: 'Group A'
  },
  'grpID-B': {
    name: 'Group B'
  }
};

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
exports.get = function(gid) {
  if(!gid || typeof gid != 'string') {
    throw 'Invalid group id.';
  }

  return (testGroups[gid]) ? testGroups[gid] : false;
};
