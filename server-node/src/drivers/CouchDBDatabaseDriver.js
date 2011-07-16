var groupValidator = require('../validators/GroupValidator.js');

function makeGroupID(gid) {
  return 'group:' + gid;
}

exports.getGroup = function(gid, callback) {
  if(!groupValidator.isValidID(gid)) {
    throw 'Invalid gid.';
  }

  if(typeof callback !== 'function') {
    throw 'Invalid callback.';
  }

  this.db.get(makeGroupID(gid), callback);
};
