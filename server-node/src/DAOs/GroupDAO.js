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
exports.get = function(gid) {
  if(!gid || typeof gid != 'string') {
    throw 'Invalid group id.';
  }

  return (testGroups[gid]) ? testGroups[gid] : false;
};

/**
 * Creates a new group.
 *
 * @param {String} slug The url slug of the group, initially serves as group name
 */
exports.add = function(slug) {
  if(!slug || typeof slug != 'string') {
    throw 'Invalslug group name.';
  }

  if(testGroups[slug]) {
    throw 'A group with that slug already exists.';
  }

  testGroups[slug] = { name: slug, id: slug, docs: {} };

  return testGroups[slug];
};
