exports.isValidID = function(id) {
  if(!id || typeof id !== 'string') {
    throw 'Invalid type of ID.';
  }

  if(id.length < 6) {
    throw 'IDs must be at least 6 characters long.';
  }

  if(id.indexOf(' ') >= 0) {
    throw 'IDs cannot have spaces. Replace them with dashes.';
  }

  if(id.indexOf(':') >= 0) {
    throw 'IDs cannot have colons.';
  }

  return true;
};
