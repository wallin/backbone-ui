// # Backbone-UI
//
// by Sebastian Wallin (sebastian@popdevelop.com)
//
// A small collection of backbone components for creating structured UI 
// layouts. Needs `Backbone` and `jQuery` to work
//


(function ($, ns) {

  // Create namespace if needed
  ns = window[ns] = (window[ns] || {});

  // ## ContainerView ##
  // A view containing additional simultaneous views.
  // Almost works as a controller. If this view is subclassed `init` will be called
  // with same arguments as initialize
  ns.ContainerView = Backbone.View.extend({
    initialize: function () {
      _.bindAll(this, 'addView', 'removeSingle', 'removeView', 'getView', 'getTitle');
      this.views = {};
      if (typeof(this.init) === 'function') {
        this.init.apply(this, arguments);
      }
    },

    // Adds a named view to the view store.
    // Will also add it to the DOM if no view element provided
    // A side effect is that the views `el` will be turned into a jQuery element
    addView: function (name, view, opts) {
      if (!name || !view) {
        throw 'Cannot add view without name or data';
      }
      opts = opts || {};
      view.el = $(view.el).hide();
      this.views[name] = view;

      // Append view to container if nonexistant
      if (view.id) {
        var cls = opts.className || 'ui-view';
        this.el.append(view.el.addClass(cls));
      }
    },

    removeSingle: function (name) {
      try {
        this.views[name].el.remove();
        delete this.views[name];
        if (this.currentView === name) {
          this.currentView = false;
        }
      } catch (e) { }
    },

    // Removes a view from view store and DOM.
    // Removes all views if no name is specified
    removeView: function (name) {
      if (!name) {
        _.each(_.keys(this.views), function (i) {
          this.removeSingle(i);
        }, this);
      }
      else {
        this.removeSingle(name);
      }
    },

    // Returns name of the view currently set
    getView: function () {
      return this.currentView;
    },


    // Get title for a specific view name. If name is omitted current view will
    // be used (if set)
    getTitle: function (name) {
      if (typeof name === undefined && this.currentView) {
        name = this.currentView;
      }
      if (name in this.views) {
        return this.views[name].el.data('tab-title') || name;
      }
      return '';
    },

    setView: $.noop
  });


  // ## Superview ##
  // A superview that can contain a number of subviews.  A single view can only
  // be visible at a time. If this view is subclassed `init` will be called
  // with same arguments as initialize
  ns.SuperView = Backbone.ContainerView.extend({
    initialize: function () {
      _.bindAll(this, 'setView');
      this.views = {};

      if (typeof(this.init) === 'function') {
        this.init.apply(this, arguments);
      }
    },

    // Displays a view with the specified `name`. Throws an exception if the view
    // cannot be found in the view store.
    setView: function (name) {
      var c = this.currentView;
      if (name in this.views) {
        if (c) {
          this.views[c].el.hide();
          this.views[c].trigger('hide');
        }
        this.views[name].el.show();
        this.views[name].trigger('show');

        this.currentView = name;
        this.trigger('change', name);
      }
      else {
        throw 'View not found: ' + name;
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
      this.content
        .empty()
        .append('<a class="ui-popup-close">Close</a>')
        .append(el);
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

    className: 'ui-tab',

    template: _.template('<li class="<%=className%>"><a href="<%=name%>"><%=title%></a></li>'),

    view: false,

    initialize: function (opts) {
      if (!opts.view) {
        throw 'No view for tab control';
      }
      this.view = opts.view;
      this.prefix = opts.prefix || '';
      this.template = opts.template || this.template;
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
          var data = {
            className: this.className + ' ' + i,
            name: this.prefix + i,
            title: this.view.getTitle(i)
          };
          // Indicate whether item matches currently active view
          data.className += i === selected ? ' selected' : '';
          this.el.append(this.template(data));
        }
      }
      return this;
    }
  });
}(jQuery, 'Backbone'));