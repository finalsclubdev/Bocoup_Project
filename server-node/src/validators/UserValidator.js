exports.isName = function(name) {
  if(typeof name != 'string' || name == '') {
    throw 'That is an invalid name.';
  }

  return true;
};

exports.isSessionID = function(sessionID) {
  if(!sessionID || typeof sessionID != 'string' || sessionID == '') {
    throw 'Invalid session ID.';
  }

  return true;
};
