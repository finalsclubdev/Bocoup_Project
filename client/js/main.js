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
            "login": "login",
            "groups": "groupList",
            "group/:id": "group",
            "document/:id": "doc"

          },
          home: function() {
            // If there is no user in localStorage, direct to login
            // Otherwise, show the available groups
            Backbone.history.navigate( !FC.users.at(0) ? "login" : "groups", true );
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
            var group = FC.groups.get(id);
            FC.main.transition( group ? new GroupView({group: group}) : new NotFoundView() );
          },
          doc: function(id) {
            var doc = FC.docs.get(id) || FC.docs.create( {title: "Sample Document "+ Math.round(Math.random() * 10000)} );
            FC.main.transition( new DocView({doc: doc}) );
          }
        }),

        MainView = Backbone.View.extend({
          initialize: function() {
            _.bindAll(this);
            FC.header = new HeaderView( {el: $(this.el).prev()[0]} );
          },
          events: {
            "click a.back": "back"
          },
          transition: function(view) {
            FC.header.render();
            $(this.el).html( view.render().el );
          },
          back: function(e) {
            e.preventDefault();
            history.go( -1 );
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
            name: ""
          }
        }),

        GroupCollection = Backbone.Collection.extend({
          model: Group,
          sync: function(method, collection, options) {

            var dfd = jQuery.Deferred().always(function(resp) {
              options.success.call(collection, resp);
            });

            function onRead( groups ) {
              var arrGroups = _.map(groups, function(v, k) {
                return _.extend({id: k}, v);
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
          }
        }),

        Doc = Backbone.Model.extend({
          defaults: {
            title: "",
            content: ""
          }
        }),

        DocCollection = Backbone.Collection.extend({
          model: Doc,
          localStorage: new Backbone.Store("Docs")
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
            var data = _.extend( this.options.group.toJSON(), {docs: FC.docs.toJSON()} );
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
          initialize: function() {
            _.bindAll(this);
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
              content: this.editor.session.getValue()
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
          docs: new DocCollection()
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
      console.log(FC.users.at(0).get("uid") + " logged in, navigating to groups");
      Backbone.history.navigate("groups", true);
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


    colab.addGroupObserver('get', function(groups) {
      console.log('observer got a list of groups', groups);

      //make sure we can retrieve each of the groups individually, by id
      for(var id in groups) {
        colab.getGroup(id);
      }
    });

    colab.addGroupObserver('get', function(group) {
      console.log('observer got a group', group);

      if(group.docs.one) {
        colab.joinDoc(group.docs.one.id);
      }
    });

    colab.addDocObserver('cursor', function(data) {
      console.log('cursor update', data);
    });

    colab.addDocObserver('join', function(docID) {
      console.log('just joined docID', docID);

      //FIRE!
      for(var i = 1; i < 100; i++) {
        colab.updateCursor(i);
      }
    });

    $(function() {

      FC.users.fetch();
      FC.docs.fetch();

      FC.main = new MainView({
        el: document.getElementById("main")
      });

      Backbone.history.start();
    });

  });

})(jQuery, _, Backbone);
