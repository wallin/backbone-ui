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
  // A view containing additional simultaneous views.  Provides an option
  // `hideOnAdd` which will hide view elements by default when added. If this
  // view is subclassed `init` will be called with same arguments as initialize.
  //
  // ### Events ###
  // The view listens for `select` event with a `viewname` argument which will
  // be propagated to a view with corresponding `viewname` if it exists.
  // Currently selected view will recieve an `unselect` event when another
  // or no view in the container becomes selected
  ns.ContainerView = Backbone.View.extend({
    initialize: function () {
      _.bindAll(this,
                'addView', 'removeSingle', 'removeView',
                'getView', 'getTitle', 'selectView');
      this.hideOnAdd = this.options.hideOnAdd || false;
      this.views = {};
      this.selected = false;

      if (typeof(this.init) === 'function') {
        this.init.apply(this, arguments);
      }

      this.bind('select', this.selectView);
    },

    // Adds a named view to the view store.  Will also add it to the DOM if no
    // view element provided. A side effect is that the views `el` will be
    // turned into a jQuery element
    addView: function (name, view, opts) {
      if (!name || !view) {
        throw 'Cannot add view without name or data';
      }
      opts = opts || {};

      view.el = $(view.el);
      if (this.hideOnAdd) {
        view.el.hide();
      }

      this.views[name] = view;

      // Append view to container if nonexistant
      if (view.id) {
        var cls = opts.className || 'ui-view';
        this.el.append(view.el.addClass(cls));
      }
      return this;
    },

    removeSingle: function (name) {
      try {
        this.views[name].el.remove();
        delete this.views[name];
        if (this.selected === name) {
          this.selected = false;
        }
      } catch (e) { }
      return this;
    },

    // Removes a view from view store and DOM.  Removes all views if no `name`
    // is specified
    removeView: function (name) {
      if (!name) {
        _.each(_.keys(this.views), function (i) {
          this.removeSingle(i);
        }, this);
      }
      else {
        this.removeSingle(name);
      }
      return this;
    },

    // Returns name of the view currently set
    getView: function () {
      return this.selected;
    },


    // Get title for a specific view name. If name is omitted current view will
    // be used (if set)
    getTitle: function (name) {
      if (typeof name === undefined && this.selected) {
        name = this.selected;
      }
      if (name in this.views) {
        return this.views[name].el.data('view-title') || name;
      }
      return '';
    },

    // Distributes `select` event to correct view. Will trigger `unselect` event
    // to any currently selected view
    selectView: function (name) {
      if (this.selected && this.selected !== name) {
        this.views[this.selected].trigger('unselect');
        this.selected = false;
      }
      if (name && name in this.views && this.selected !== name) {
        this.selected = name;
        this.views[this.selected].trigger('select');
      }
      return this;
    }
  });


  // ## Superview ##
  // A superview that can contain a number of subviews.  A single view can only
  // be visible at a time (since option `hideOnAdd` is set to true by
  // default). If this view is subclassed `init` will be called with same
  // arguments as initialize.
  ns.SuperView = Backbone.ContainerView.extend({
    initialize: function () {
      _.bindAll(this, 'setView');

      this.hideOnAdd = this.options.hideOnAdd || true;
      this.views = {};

      this.bind('select', this.setView);

      if (typeof(this.init) === 'function') {
        this.init.apply(this, arguments);
      }
    },

    // Displays a view with the specified `name`. Throws an exception if the view
    // cannot be found in the view store.
    setView: function (name) {
      if (name in this.views) {
        if (this.selected) {
          this.views[this.selected].el.hide();
          this.views[this.selected].trigger('hide');
        }
        this.views[name].el.show();
        this.views[name].trigger('show');

        this.selectView(name);
        this.trigger('change', name);
      }
      else {
        throw 'View not found: ' + name;
      }
      return this;
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
      _.bindAll(this, 'setContent', 'show', 'hide', 'close');
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
      return this;
    },

    show: function () {
      this.el.show();
      return this;
    },

    hide: function () {
      this.el.hide();
      return this;
    },

    close: function () {
      if (_.isFunction(this.options.onClose)) {
        this.options.onClose();
      }
      else {
        this.hide();
      }
      return this;
    }
  });

  // ## TabController ##
  // Automatically generate tabs for controlling a superview.  Needs an `el` to
  // work with. Links will also be generated with `href` set to `name` plus a
  // `prefix` specified in `opts`. Also provides an option for a custom
  // `template` for rendering each element
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