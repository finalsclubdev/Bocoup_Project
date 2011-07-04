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
            "groups": "groups"

          },
          home: function() {
            // If there is no user in localStorage, direct to login
            // Otherwise, show the available groups
            Backbone.history.navigate( !FC.users.at(0) ? "login" : "groups", true );
          },
          login: function() {
            FC.main.transition( new LoginView() );
          },
          groups: function(e) {
            FC.main.transition( new GroupsView() );
          }
        }),

        MainView = Backbone.View.extend({
          initialize: function() {
            _.bindAll(this);
            FC.header = new HeaderView( {el: $(this.el).prev()[0]} );
          },
          transition: function(view) {
            FC.header.render();
            $(this.el).html( view.render().el );
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

        GroupsView = Backbone.View.extend({
          initialize: function() {
            _.bindAll(this);
          },
          template: TMPL.groups,
          render: function() {
            $(this.el).html(this.template(data));
            return this;
          }
        }),

        FC = window.FC = {
          router: new Router(),
          users: new UserCollection()
        };

    $(function() {

      FC.users.fetch();

      FC.main = new MainView({
        el: document.getElementById("main")
      });

      Backbone.history.start();
    });

  });

})(jQuery, _, Backbone);
