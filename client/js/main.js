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
          group: function(id) {
            // If the groups collection is empty, we have to get the groups collection first
            // Occurs when navigating directly to #[groupid] without having gone to #groups/ first
            // Otherwise, fetch the group immediately
            $.when( FC.groups.length || FC.groups.fetch() ).always( function(groups) {
              var group = FC.groups.get( id );
              if ( !group ) {
                return Backbone.history.navigate("404", true);
              }
              group.fetch({
                success: function(grp) {
                  FC.main.transition( new GroupView( {group: grp} ) );
                },
                error: function(grp) {
                  console.log( "FAILURE", grp);
                }
              });
            });
          },
          doc: function(groupid, docid) {
            // In the same vein as the above case, the groups collection
            // must be populated in case the document was navigated to directly
            $.when( FC.groups.length || FC.groups.fetch() ).always( function(groups) {
              var doc, group = FC.groups.get( groupid );
              if ( !group ) {
                return Backbone.history.navigate("404", true);
              } 
              doc = group.docs.get(docid);
              // There is currently no document creation view, so we'll 404 for now
              if ( !doc ) {
                return Backbone.history.navigate("404", true);
              }
              FC.main.transition( new DocView({doc: doc}) );
            });
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
            console.log("group initialized", this);
            this.docs = new DocCollection( this.get("docs") );
          },
          change: function(e) {
            console.log("group change event", e);
          },
          sync: function(method, group, options) {
            var dfd = jQuery.Deferred().always(function(resp) {
              options.success.call(group, resp);
            });

            function onRead( grp ) {
              dfd.resolve( grp );
            }

            switch( method ) {
              case "read":
                colab.addGroupObserver('get', onRead);
                colab.getGroup( group.id );
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
          groups: new GroupCollection()
        };

    colab.addUserObserver('connected', function(currUser) {
      var user = FC.users.at(0);

      if (user) {
        colab.login( user.get("uid") );
      } else {
        Backbone.history.navigate("login", true);
      }

    });

    colab.addUserObserver('loggedIn', function(user) {
      console.log(FC.users.at(0).get("uid") + " logged in, navigating to original url");
      var destHash = window.location.hash.substr(1);
      // Ensure users are not redirected to login after logging in
      // if they navigated directly to #login
      destHash = destHash == "login" ? "groups" : destHash;
      Backbone.history.navigate( destHash, true );
    });

    colab.addUserObserver('loggedOut', function() {
      // Empty the groups list
      FC.groups.reset();

      // Destroy local user
      FC.users.each(function(u) {
        u.destroy();
      });

      Backbone.history.navigate("login", true);

    });

    colab.addDocObserver('cursor', function(data) {
      console.log('cursor update', data);
    });



    $(function() {

      FC.users.fetch();

      FC.main = new MainView({
        el: document.getElementById("main")
      });

      Backbone.history.start();
    });

  });

})(jQuery, _, Backbone);
