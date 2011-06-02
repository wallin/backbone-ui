// # Backbone-UI
//
//    by Sebastian Wallin (sebastian@popdevelop.com)
//


// # Views - Generic #
// Generic views for layout and structure.
// Needs and extends Backbone.js
(function ($, ns) {

  // Create namespace
  ns = window[ns] = {};

  // ## Superview ##
  // A superview that can contain a number of subviews.  A single view can only
  // be visible at a time.  If this view is subclassed `init` will be called
  // with same arguments as initialize
  ns.SuperView = Backbone.View.extend({
    initialize: function () {
      _.bindAll(this, 'addView', 'setView', 'getView', 'getTitle');
      this.views = {};
      if (typeof(this.init) === 'function') {
        this.init.apply(this, arguments);
      }
    },

    // Adds a named view to the view store
    addView: function (name, view, opts) {
      if (!name || !view) {
        throw 'Cannot add view';
      }
      this.views[name] = view;
    },

    // Displays a view with the specified `name`. Throws an exception if the
    // view cannot be found in the view store.
    setView: function (name) {
      this.currentView = name;
      this.trigger('change', name);
      if (name in this.views) {
        for (var i in this.views) {
          if (this.views.hasOwnProperty(i)) {
            var view = this.views[i];
            var action = i === name ? 'show' : 'hide';
            view.el[action]();
          }
        }
      }
      else {
        throw 'Page not found: ' + name;
      }
    },

    // Returns name of the view currently set
    getView: function () {
      return this.currentView;
    },


    // Get title for a specific view name
    getTitle: function (name) {
      if (name in this.views) {
        return this.views[name].el.attr('title');
      }
      return '';
    }
  });


  // ## ContainerView ##
  // A view containing additional simultaeous views
  // Almost works as a controller
  ns.ContainerView = Backbone.View.extend({
    initialize: function () {
      if (typeof(this.init) === 'function') {
        this.init.apply(this, arguments);
      }
    }
  });

  // ## PopupView ##
  // Provides a popup with close button
  ns.PopupView = Backbone.View.extend({
    tagName: 'div',

    className: 'ui-popup',

    events: {
      'click a.ui-popup-close': 'close'
    },

    initialize: function () {
      _.bindAll(this, 'setContent', 'show', 'hide');
      if (typeof(this.init) === 'function') {
        this.init.apply(this, arguments);
      }
      this.el.append('<div class="ui-popup-shade">');
      this.content = $('<div class="ui-popup-content">').appendTo(this.el);
    },

    setContent: function (el) {
      this.content.empty();
      this.content.append('<a class="ui-popup-close">Close</a>');
      this.content.append(el);
    },

    show: function () {
      this.el.show();
    },

    hide: function () {
      this.el.hide();
    },

    close: function () {
      history.back(1);
    }
  });

  // ## TabController ##
  // Automatically generate tabs for controlling a superview.
  // Needs an `el` to work with. Links will also be generated with href set
  // to `name` plus a `prefix` specified in `opts`
  ns.TabController = Backbone.View.extend({
    tagName: 'ul',

    template: _.template('<li class="<%=className%>"><a href="<%=name%>"><%=title%></a></li>'),

    view: false,

    initialize: function (opts) {
      if (!opts.view) {
        throw 'No view for tab control';
      }
      this.view = opts.view;
      this.prefix = opts.prefix || '';
      _.bindAll(this, 'render');
      // Re-render when selected view changes.
      // Used when view in superview is set programmatically
      this.view.bind('change', this.render);
      this.render();
    },

    // Generate tabs for all views. CSS classes with the views name
    // and selected state will be added
    render: function () {
      this.el.empty();
      var selected = this.view.getView();
      for (var i in this.view.views) {
        if (this.view.views.hasOwnProperty(i)) {
          var item = this.view.views[i];
          var className = this.className + ' ' + i;
          className += i === selected ? ' selected' : '';
          var data = {
            className: className,
            name: this.prefix + i,
            title: this.view.getTitle(i)
          };
          this.el.append(this.template(data));
        }
      }
      return this;
    }
  });
}(jQuery, 'BBUI'));