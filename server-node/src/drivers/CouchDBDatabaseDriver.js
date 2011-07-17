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

exports.createGroup = function(gid, name, callback) {
  if(!groupValidator.isValidID(gid)) {
    throw 'Invalid gid.';
  }

  if(!groupValidator.isValidName(name)) {
    throw 'Invalid group name.';
  }

  gid = 'group:' + gid;

  this.db.save(
    gid,
    {
      name: name
    },
    function(err, res) {
      if(!err) {
        callback(
          err,
          {
            _id: res._id,
            _rev: res._rev,
            name: name
          }
        );
      }
      else {
        callback(err, res);
      }
    }
  );
};
