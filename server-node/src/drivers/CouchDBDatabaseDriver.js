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

  this.db.save(
    makeDocID(doc.id, doc.gid),
    doc,
    function(err, res) {
      if(!err) {
        doc._rev = res._rev;
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
