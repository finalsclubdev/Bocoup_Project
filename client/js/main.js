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
            "group/:id": "group"

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
            FC.main.transition( new GroupListView() );
          },
          group: function(id) {
            var group = FC.groups.get(id);
            FC.main.transition( group ? new GroupView({group: group}) : new NotFoundView() );

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
            userid: ""
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
          localStorage: new Backbone.Store("Groups")
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
            FC.users.each(function(u) {
              u.destroy();
            });
            Backbone.history.navigate("", true);
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
              success: function() {
                Backbone.history.navigate("", true);
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
            FC.groups.fetch({
              success: _.bind(function(collection,groups) {
                var data = { groups: FC.groups.toJSON() };
                $(this.el).html(this.template(data));
              },this)
            });
            return this;
          }
        }),

        GroupView = Backbone.View.extend({
          initialize: function() {
            _.bindAll(this);
          },
          template: TMPL.group,
          render: function() {
            var data = this.options.group.toJSON();
            $(this.el).html(this.template(data));
            return this;
          }
        }),

        FC = window.FC = {
          router: new Router(),
          users: new UserCollection(),
          groups: new GroupCollection()
        };

    $(function() {

      FC.users.fetch();

      FC.groups.fetch({
        success: function() {
          // Temporary test data for development
          if (!FC.groups.length) {
            FC.groups.create( {name: "Music Theory 201"} );
            FC.groups.create( {name: "Ad Hoc Learning"} );
            FC.groups.create( {name: "Advanced Tutoring"} );
          }
        }
      });

      FC.main = new MainView({
        el: document.getElementById("main")
      });

      Backbone.history.start();
    });

  });

})(jQuery, _, Backbone);
