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

exports.getGroups = function(callback) {
  if(typeof callback !== 'function') {
    throw 'Invalid callback.';
  }

  this.db.view('app/groups', { include_docs: true }, function(err, res) {
    if(!err) {
      var groups = {};

      for(var i in res.rows) {
        if(res.rows.hasOwnProperty(i)) {
          //removes the 'group:' prefix
          var id = res.rows[i].id.substr(6);

          groups[id] = res.rows[i].doc;

          delete groups[id]._id;
          delete groups[id]._rev;
        }
      }

      res = groups;
    }

    callback(err, res);
  });
};

exports.getDocsByGID = function(gid, callback) {
  if(!groupValidator.isValidID(gid)) {
    throw 'Invalid gid.';
  }

  if(typeof callback !== 'function') {
    throw 'Invalid callback.';
  }

  this.db.view('app/docByGID', { include_docs: true, key: gid }, function(err, res) {
    if(!err) {
      var docs = {};

      for(var i in res.rows) {
        if(res.rows.hasOwnProperty(i)) {
          var id = res.rows[i].id.substr(res.rows[i].id.indexOf('/') + 1);

          docs[id] = res.rows[i].doc;
          docs[id].id = id;

          delete docs[id]._id;
          delete docs[id]._rev;
        }
      }

      res = docs;
    }

    callback(err, res);
  });
};
