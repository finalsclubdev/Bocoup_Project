var validators = require('../validators/UserValidator.js');

var users = {};
var sessionIDToName = {}; //maps sock.id => name

exports.login = function(name, sessionID) {
  if(validators.isName(name) && validators.isSessionID(sessionID)) {
    if(users[name]) {
      if(users[name].sessionID === sessionID) {
        return true;
      }

      throw 'That name is already in use.';
    }

    users[name] = {
      joinedAt: new Date().getTime(),
      sessionID: sessionID
    };

    sessionIDToName[sessionID] = name;

    return true;
  }
};

exports.logout = function(name, sessionID) {
  if(validators.isName(name) && validators.isSessionID(sessionID) && users[name]) {
    if(users[name].sessionID != sessionID) {
      throw 'You cannot log other users out.';
    }

    delete users[name];
  }
};

exports.disconnect = function(sessionID) {
  return this.logout(sessionIDToName[sessionID], sessionID);
};
