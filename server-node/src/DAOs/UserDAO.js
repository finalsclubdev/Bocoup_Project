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
  else {
    //the above functions should throw, but putting this here just in case
    throw 'Invalid user name.';
  }
};

/**
 * Logs a user out.
 *
 * @param {String} name The user's name/ID.
 *
 * @param {String} sessionID The session ID from the socket.
 *
 * @returns {Boolean} Whether a user was logged out or not.
 */
exports.logout = function(name, sessionID) {
  if(validators.isName(name) && validators.isSessionID(sessionID) && users[name]) {
    if(users[name].sessionID != sessionID) {
      throw 'You cannot log other users out.';
    }

    delete users[name];
    return true;
  }

  return false;
};

exports.disconnect = function(sessionID) {
  return (sessionIDToName[sessionID]) ?
    this.logout(sessionIDToName[sessionID], sessionID) :
    false;
};
