var colab = (function(io) {
  /*
   * You can subscribe to different types of events (user, group, and doc,
   * which are the same as the socket groups). You add yourself by pushing
   * an object onto the corresponding array that looks like this:
   * { eventName: 'eventYouListeningFor', callback: function(data) { } }
   *
   * When there's an event that the public should know about, colab will
   * use the notify function to tell you about it.
   */
  var observers = {
    userEvents: [],
    groupEvents: [],
    docEvents: [],

    notify: function(observers, eventName, data) {
      for(var i in observers) {
        if(!observers[i].eventName || observers[i].eventName === eventName) {
          observers[i].callback(data);
        }
      }
    }
  };

  //A socket wide function for handling errors.
  function onError(msg) {
    console.log('err', msg);
  }

  //The host we're connecting to (node socket.io server).
  var sockHost = 'http://localhost:1337';

  //Our socket groups.
  var userSock = io.connect(sockHost +'/user');
  var groupSock = io.connect(sockHost +'/group');

  //Bind to the error events with our global handler.
  userSock.on('err', onError);
  groupSock.on('err', onError);

  //userSock events.
  userSock.on('connect', function() {
    //Once we're connected, ask the user for a name and send it.
    userSock.emit('login', prompt('Provide a name.'));

    //The user has been logged in.
    userSock.on('loggedIn', function() {
      console.log('logged in');

      observers.notify(observers.userEvents, 'loggedIn');
    });

    //The user has been logged out.
    userSock.on('loggedOut', function() {
      console.log('logged out');

      observers.notify(observers.userEvents, 'loggedOut');
    });
  });

  //groupSock events.
  groupSock.on('getList', function(data) {
    observers.notify(observers.groupEvents, 'getList', data);
  });

  //Our API, which we can call internally as well.
  var api = {
    //Add an observer to the group events.
    addGroupObserver: function(eventName, callback) {
      observers.groupEvents.push({
        eventName: eventName,
        callback: callback
      });
    },

    //Add an observer to the user events.
    addUserObserver: function(eventName, callback) {
      observers.userEvents.push({
        eventName: eventName,
        callback: callback
      });
    }
  };

  //Our internal observers.
  api.addUserObserver('loggedIn', function() {
    //Once we've logged in, refresh our list of doc groups.
    groupSock.emit('getList');
  });

  return api;
})(io);