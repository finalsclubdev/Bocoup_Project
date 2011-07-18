var groupValidator = require('../validators/GroupValidator.js');
var docValidator = require('../validators/DocValidator.js');

function makeGroupID(gid) {
  return 'group:' + gid;
}

function makeDocID(id, gid) {
  //%2f being a URL encoded slash ('/')
  return 'doc:' + gid + '%2f' + id;
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

exports.createGroup = function(gid, callback) {
  if(!groupValidator.isValidID(gid)) {
    throw 'Invalid gid.';
  }

  if(typeof callback != 'function') {
    throw 'Invalid callback.';
  }

  gid = 'group:' + gid;

  this.db.put(
    gid,
    {},
    function(err, res) {
      if(!err) {
        callback(err, { id: res._id });
      }
      else {
        if(err.error === 'conflict') {
          err = 'That group already exists.';
        }

        callback(err, res);
      }
    }
  );
};

exports.createDoc = function(doc, callback) {
  if(!docValidator.isValidID(doc.id)) {
    throw 'Invalid document id.';
  }

  if(!groupValidator.isValidID(doc.gid)) {
    throw 'Invalid group id.';
  }

  if(typeof callback !== 'function') {
    throw 'Invalid callback.';
  }

  this.db.put(
    makeDocID(doc.id, doc.gid),
    doc,
    function(err, res) {
      if(err && err.error === 'conflict') {
        err = 'That document already exists.';
      }
      else {
        delete doc._rev;
      }

      callback(err, doc);
    }
  );
};

exports.getDoc = function(id, gid, callback) {
  if(!docValidator.isValidID(id)) {
    throw 'Invalid document id.';
  }

  if(!groupValidator.isValidID(gid)) {
    throw 'Invalid group id.';
  }

  if(typeof callback !== 'function') {
    throw 'Invalid callback.';
  }

  this.db.get(makeDocID(id, gid), function(err, doc) {
    if(!err) {
      doc.id = doc._id.substr(doc._id.indexOf('/') + 1);

      delete doc._id;
      delete doc._rev;
    }

    callback(err, doc);
  });
};
