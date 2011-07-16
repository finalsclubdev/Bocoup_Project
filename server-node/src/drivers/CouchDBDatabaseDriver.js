function makeGroupID(gid) {
  return 'group:' + gid;
}

exports.getGroup = function(gid, callback) {
  if(typeof callback !== 'function') {
    throw 'Invalid callback.';
  }

  this.db.get(makeGroupID(gid), callback);
};
