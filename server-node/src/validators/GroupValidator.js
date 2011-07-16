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

exports.isValidName = function(name) {
  if(typeof name !== 'string') {
    throw 'Invalid type of name.';
  }

  if(name.length <= 0) {
    throw 'Group names must be at least one character.';
  }

  return true;
};
