(function($,_,Backbone) {

  $(document.documentElement).toggleClass("no-js js");

  // Load all templates upfront and then prepare the application
  $.ajax({
    url: "tmpl/templates.html"
  }).then(function(data) {

    // Compile templates and make them available privately
    var TMPL = {};
    $(data).each(function(i, el) {
      TMPL[el.id] = Handlebars.compile($.trim(el.innerHTML));
    });

    Handlebars.registerHelper("documentName", function(doc) {
      return doc.id || doc.text.substring(0,20) + "...";
    });

    var Router = Backbone.Router.extend({
          routes: {
            "": "home",
            "404": "404",
            "login": "login",
            "groups": "groupList",
            ":groupid": "group",
            ":groupid/:docid": "doc"
          },
          home: function() {
            // If there is no user in localStorage, direct to login
            // Otherwise, show the available groups
            Backbone.history.navigate( !FC.users.at(0) ? "login" : "groups", true );
          },
          404: function() {
            FC.main.transition( new NotFoundView() );
          },
          login: function() {
            FC.main.transition( new LoginView() );
          },
          groupList: function(e) {
            console.log("fetching groups");
            FC.groups.fetch({
              success: function(collection, resp) {
                FC.main.transition( new GroupListView() );
              }
            });
          },
          group: function( slug ) {
            var group = FC.groups.get( slug ),
                respond = {
                  success: function(grp) {
                    FC.main.transition( new GroupView( {group: grp} ) );
                  },
                  error: function(grp) {
                    console.log( "FAILURE", grp);
                  }
                };

            if ( !group ) {
              FC.groups.create({slug: slug}, respond);
            } else {
              group.fetch(respond);
            }
          },
          doc: function(groupid, docid) {
            var doc, group = FC.groups.get( groupid );
            if ( !group ) {
            // There is currently no document creation view, so we'll 404 for now
              // If the group doesn't exist,
              // automatically create it by going to #{groupid}
              return Backbone.history.navigate(groupid, true);
            } 
            doc = group.docs.get(docid);
            if ( !doc ) {
              return Backbone.history.navigate("404", true);
            }
            FC.main.transition( new DocView({doc: doc}) );
          }
        }),

        MainView = Backbone.View.extend({
          initialize: function() {
            _.bindAll(this);
            FC.header = new HeaderView( {el: $(this.el).prev()[0]} );
          },
          events: {
            "click a.back,a.doubleback": "back"
          },
          transition: function(view) {
            FC.header.render();
            $(this.el).html( view.render().el );
          },
          back: function(e) {
            e.preventDefault();
            history.go( $(e.target).hasClass("doubleback") ? -2 : -1 );
          }
        }),

        User = Backbone.Model.extend({
          defaults: {
            uid: ""
          }
        }),

        UserCollection = Backbone.Collection.extend({
          model: User,
          localStorage: new Backbone.Store("Users")
        }),

        Group = Backbone.Model.extend({
          defaults: {
            name: "",
            docs: []
          },
          initialize: function() {
            _.bindAll(this);
            this.docs = new DocCollection( this.get("docs") );
          },
          change: function(e) {
            this.docs.reset( _.map(this.get("docs"), function(doc, d) {
              return doc;
            }));
          },
          sync: function(method, group, options) {
            var dfd = jQuery.Deferred().always(function(resp) {
              options.success.call(group, resp);
            });

            function onRead( grp ) {
              dfd.resolve( grp );
              colab.removeGroupObserver( onRead );
            }

            function onCreate( grp ) {
              dfd.resolve( grp );
              colab.removeGroupObserver( onCreate );
            }

            switch( method ) {
              case "read":
                colab.addGroupObserver("get", onRead);
                colab.getGroup( group.id );
                break;
              case "create":
                colab.addGroupObserver("add", onCreate);
                colab.addGroup( group.get("slug") );
                break;
              case "update":
                break;
              case "delete":
                break;
            }

            return dfd;
          }
        }),

        GroupCollection = Backbone.Collection.extend({
          model: Group,
          sync: function(method, collection, options) {

            var dfd = jQuery.Deferred().always(function(resp) {
              options.success.call(collection, resp);
            });

            function onRead( groups ) {
              // Transform the nested object of groups into an 
              // array of groups with an array of documents
              var arrGroups = _.map(groups, function(v, k) {
                var attrs = _.extend({id: k}, v);
                attrs.docs = _.map(attrs.docs, function(doc, d) {
                  return doc;
                });
                return attrs;
              });
              dfd.resolve( arrGroups );
              colab.removeGroupObserver( onRead );
            }

            switch( method ) {
              case "read":
                colab.addGroupObserver('getGroups', onRead);
                colab.getGroups();
                break;
              case "create":
                break;
              case "update":
                break;
              case "delete":
                break;
            }

            return dfd;

          }
        }),

        Doc = Backbone.Model.extend({
          defaults: {
            name: "",
            text: ""
          },
          join: function() {
            colab.addDocObserver("join", function(doc) { 
              console.log("JOINED", doc);
            });
            console.log("about to join", this.id);
            colab.joinDoc(this.id);
          }
        }),

        DocCollection = Backbone.Collection.extend({
          model: Doc
        }),

        HeaderView = Backbone.View.extend({

          initialize: function() {
            _.bindAll(this);
            this.render();
          },
          template: TMPL.header,
          render: function() {
            var user = FC.users.at( 0 ),
                data = user ? user.toJSON() : {};

            data.connected = FC.connected.isResolved();

            $(this.el).html( this.template( data ) );
            return this;
          },
          events: {
            "submit": "submit"
          },
          submit: function(e) {
            e.preventDefault();
            colab.logout();
          }
        }),

        LoginView = Backbone.View.extend({
          initialize: function() {
            _.bindAll(this);
          },
          template: TMPL.login,
          render: function() {
            $(this.el).html(this.template());
            return this;
          },
          events: {
            "submit": "submit"
          },
          submit: function(e) {
            e.preventDefault();
            FC.users.create(_.extend( $(e.target).serializeObject(), {
                created: +new Date()
              }), {
              success: function(user) {
                colab.login( user.get("uid") );
              }
            });
          }
        }),

        NotFoundView = Backbone.View.extend({
          initialize: function() {
            _.bindAll(this);
          },
          template: TMPL.notFound,
          render: function() {
            $(this.el).html(this.template());
            return this;
          }
        }),

        UnavailableView = NotFoundView.extend({
          template: TMPL.unavailable,
          render: function() {
            $(this.el).html(this.template(this.options));
            return this;
          }
        }),

        GroupListView = Backbone.View.extend({
          initialize: function() {
            _.bindAll(this);
          },
          template: TMPL.groupList,
          render: function() {
            var data = { groups: FC.groups.toJSON() };
            $(this.el).html(this.template(data));
            return this;
          }
        }),

        GroupView = Backbone.View.extend({
          initialize: function(options) {
            _.bindAll(this);
          },
          template: TMPL.group,
          render: function() {
            var data = _.extend( 
              this.options.group.toJSON(),
              {docs: this.options.group.docs.toJSON()}
            );
            console.log(data);
            $(this.el).html(this.template(data));
            return this;
          }
        }),

        // temporary data for generating messages
        tmp = {
          chars: "\n 12345\n67890!\n@#$%^&*()\nabcdef\nghijklmno\npqrstuv\nwxyz",
          actions: ["write", "remove"]
        },

        DocView = Backbone.View.extend({
          template: TMPL.doc,
          initialize: function(options) {
            _.bindAll(this);
            this.doc = options.doc;
            this.doc.join();
            colab.addDocObserver('cursor', function(data) {
              console.log('cursor update', data);
            });

          },
          events: {
            "click .toggleMessages": "toggleMessages"
          },
          generateMessage: function() {
            var msg = {
              act: tmp.actions[ Math.floor(Math.random() * tmp.actions.length) ],
              from: Math.floor(Math.random() * this.editor.session.getValue().length)
            };

            switch (msg.act) {
              case "write":
                msg.val = tmp.chars.charAt( Math.floor(Math.random() * tmp.chars.length) )["to" + (Math.random() > 0.5 ? "Upper" : "Lower") + "Case"]();
                break;
              case "remove":
                msg.val = 1;
                break;
            }

            return msg;

          },
          toggleMessages: function(e) {
            var $t = $(e.target);
            if (this.msgInterval) {
              $t.text("Start Messages");
              this.msgInterval = clearInterval(this.msgInterval);
            } else {
              $t.text("Stop Messages");
              this.msgInterval = setInterval(_.bind(function() {
                this.trigger("socketmessage", this.generateMessage());
              },this),250);
            }
          },
          render: function() {
            var data = this.options.doc.toJSON();
            $(this.el).html(this.template(data));
            this.editor = ace.edit( $(this.el).find("div.editor")[0] );
            this.editor.session.on("change", _.bind(this.change, this) );
            this.bind("socketmessage", this.socketmessage);
            return this;
          },
          change: function(event) {
            var action = event.data.action,
                position = this.getEditPosition(event);

            switch (action) {
            case "insertText":
              break;
            case "removeText":
              break;
            }

            this.options.doc.set({
              text: this.editor.session.getValue()
            });

            this.options.doc.save();
          },
          getEditPosition: function(event) {
            var i = 0,
            pos = 0,
            start = event.data.range.start.row;

            // Calculate the length of all the rows of text before the edit
            while(i <= start) {
              // Make sure that a blank line counts
              pos = pos + (this.editor.session.doc.$lines[i].length || 1);
              i++;
            }

            // Add the column of where the edit was made
            pos = pos + event.data.range.start.column + 1;

            return pos;
          },
          socketmessage: function(msg) {
            this["on" + msg.act.charAt(0).toUpperCase() + msg.act.substr(1)](msg);
          },
          onWrite: function(msg) {
            var value = this.editor.session.getValue();
            this.editor.session.setValue( value.substr(0, msg.from) + msg.val + value.substr(msg.from) );
          },
          onRemove: function(msg) {
            var value = this.editor.session.getValue();
            this.editor.session.setValue(value.substr(0, msg.from - msg.val) + value.substr(msg.from));
          },
          onAnnounce: function(msg) {
            console.log("announce");
          }

        }),

        FC = window.FC = {
          router: new Router(),
          users: new UserCollection(),
          groups: new GroupCollection(),
          // A Deferred we'll use to check for socket connectivity,
          // in order to defer hash history tracking until after the
          // socket is connected and a user stored in localStorage is logged in, 
          // as well as after Group data has been bootstrapped.
          connected: jQuery.Deferred(),
          init: function() {

            // When the document is ready, insert the main view
            $(function() {

              FC.main = new MainView({
                el: document.getElementById("main")
              });

            });

            // Load user from localStorage
            FC.users.fetch();

            // Wait for the connection to be established or unavailable
            // before setting up the remaining handlers or redirecting to #unavailable,
            // and finally starting hash history tracking
            $.when( FC.connected )
            .then( FC.onSocketConnect )
            .fail( FC.onSocketFail )
            .always( function() {
              // Because a loaded list of groups is a prerequesite for loading any document view
              // we'll attempt to grab the groups before starting hash tracking
              $.when( FC.groups.length || FC.groups.fetch() )
              .always( function(groups) {
                Backbone.history.start();
              });
            });

            // Wait 2.5 seconds before considering the socket unavailable
            // and re-routing to an offline state 
            setTimeout(function() {
              FC.connected.reject({msg: "Socket connection timed out!"});
            },2500);

            // Set up observers for socket connection and login
            colab.addUserObserver('connected', function(currUser) {
              var user = FC.users.at(0);
              if (!user) {
                // If there is no user in localStorage,
                // prepare to send the user to login
                window.location.hash = "login";
                FC.connected.resolve({msg: "Connected, but not logged in"});
              } else {
                // If a user exists, we still need to wait for login before
                // resolving the connection deferred
                colab.login( user.get("uid") );
              }
            });

            colab.addUserObserver('loggedIn', function(user) {
              // Once the user is logged in, we can proceed with showing the app
              // Ensure users are not redirected to login after logging in
              // if they navigated directly to #login

              var destHash = window.location.hash.substr(1);
              destHash = destHash == "login" ? "groups" : destHash;
              window.location.hash = destHash;

              console.log(FC.users.at(0).get("uid") + " logged in");
              FC.connected.resolve({msg: "Connected", user: FC.users.at(0)});
            });

          },
          onSocketFail: function( excp ) {
            FC.main.transition( new UnavailableView( excp ) );
            window.location.hash = "unavailable";
          },
          onSocketConnect: function( resp ) {

            colab.addUserObserver('loggedOut', function() {
              // Destroy local user
              FC.users.each(function(u) {
                u.destroy();
              });
              Backbone.history.navigate("login", true);
            });

          }
        };

        FC.init();

  });

})(jQuery, _, Backbone);
