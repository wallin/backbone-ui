//     backbone-ui.js 0.1.0a
//     by Sebastian Wallin (sebastian@popdevelop.com)
//
// ### What is this?
// **Backbone-ui** is an attempt to create small collection of backbone
// components for creating structured UI layouts. Needs `Backbone` and `jQuery`
// to work
//
// ### Components:
//
// * **ContainerView**: Basic type for grouping many views together
// * **SuperView**: Extends **ContainerView** but will only display one of the views at a time
// * **PopupView**
// * **TabController**


// # Components #
(function ($, ns) {

  // Create namespace if needed
  ns = window[ns] = (window[ns] || {});

  // ## ContainerView
  // A view containing additional simultaneous views.  Provides an option
  // `hideOnAdd` which will hide view elements by default when added. If this
  // view is subclassed `init` will be called with same arguments as initialize.
  //
  // ### Events
  // The view listens for `select` event with a `viewname` argument which will
  // be propagated to a view with corresponding `viewname` if it exists.
  // Currently selected view will recieve an `unselect` event when another
  // or no view in the container becomes selected
  ns.ContainerView = Backbone.View.extend({
    initialize: function () {
      _.bindAll(this,
                'addView', 'removeSingle', 'removeView',
                'getView', 'getTitle', 'select');
      this.hideOnAdd = this.hideOnAdd || this.options.hideOnAdd || false;
      this.views = {};
      this.selected = false;

      if (_.isFunction(this.init)) {
        this.init.apply(this, arguments);
      }
    },

    // ### "Internal" methods
    // Removes a single named view from store and DOM
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

    // Distributes `select` event to correct view. Will trigger `unselect` event
    // to any currently selected view. One argument will be sliced off and the
    // rest will be passed to the selected view
    select: function (name) {
      this.trigger('select', name);
      var args = _.toArray(arguments).slice(1);
      args = args.length > 0 ? args : null;

      if (name && this.selected && this.selected !== name) {
        this.views[this.selected].trigger('unselect');
        this.selected = false;
      }
      if (name && name in this.views) {
        this.selected = name;
        var ctx = this.views[this.selected];
        if (_.isFunction(ctx.select)) {
          ctx.select.apply(ctx, args);
        }
        else {
          ctx.trigger('select', args);
        }
      }
      return this;
    },

    // ### Methods

    // #### addView
    // Adds a named view to the view store.  Will also add it to the DOM if no
    // view element provided. A side effect is that the views `el` will be
    // turned into a jQuery element if not already of that type
    addView: function (name, view, opts) {
      if (!name || !view) {
        throw 'Cannot add view without name or data';
      }
      opts = opts || {};

      if (!(view.el instanceof $)) {
        view.el = $(view.el);
      }
      if (this.hideOnAdd) {
        view.el.hide();
      }

      // Remove existing view with the same name
      if (this.views[name]) {
        this.removeSingle(name);
      }
      this.views[name] = view;

      // Append view to container if nonexistant
      if (view.id) {
        var cls = opts.className || 'ui-view';
        this.el.append(view.el.addClass(cls));
      }
      return this;
    },

    // #### removeView
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

    // #### getView
    // Returns name of the view currently set
    getView: function () {
      return this.selected;
    },


    // #### getTitle
    // Get title for a specific view name. If name is omitted current view will
    // be used (if set). Title is fetched from the `data-view-title` attribute.
    getTitle: function (name) {
      if (name == null && this.selected) {
        name = this.selected;
      }
      if (name in this.views) {
        return this.views[name].el.data('view-title') || name;
      }
      return '';
    }
  });


  // ## Superview
  // A superview extends a **ContainerView** and contain a number of subviews.
  // A single view can only be visible at a time (since option `hideOnAdd` is
  // set to true by default). If this view is subclassed `init` will be called
  // with same arguments as initialize. `initialize` of **ContainerView** will
  // also be called
  ns.SuperView = Backbone.ContainerView.extend({
    initialize: function () {
      _.bindAll(this, 'setView');

      this.hideOnAdd = this.options.hideOnAdd || true;

      this.bind('select', this.setView);

      ns.ContainerView.prototype.initialize.apply(this, arguments);
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

        this.selected = name;
        this.trigger('change', name);
      }
      else if (name) {
        throw 'View not found: ' + name;
      }
      return this;
    }
  });


  // ## PopupView
  // Provides a view used for popups. Will add a shade layer with class
  // `ui-popup-shade`, a content div with class `ui-popup-content` and a close
  // button with class `ui-popup-close`. A custom close-hook can be provided via
  // the `onClose` parameter. This method will be called when the user clicks the
  // close button
  ns.PopupView = Backbone.View.extend({
    tagName: 'div',

    className: 'ui-popup',

    events: {
      'click a.ui-popup-close, div.ui-popup-shade': 'close'
    },

    initialize: function () {
      _.bindAll(this, 'setContent', 'show', 'hide', 'close');
      if (_.isFunction(this.init)) {
        this.init.apply(this, arguments);
      }
      this.el.append('<div class="ui-popup-shade">');
      this.content = $('<div class="ui-popup-content">').appendTo(this.el);
    },

    // ### Methods

    // #### setContent
    setContent: function (el) {
      this.content
        .empty()
        .append('<a class="ui-popup-close">Close</a>')
        .append(el);
      return this;
    },

    // #### show
    show: function () {
      this.el.show();
      return this;
    },

    // #### hide
    hide: function () {
      this.el.hide();
      return this;
    },

    // #### close
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

  // ## TabController
  // Automatically generate tabs from a **ContainerView**. Links will also be
  // generated with `href` set to `name` plus a `prefix` specified in
  // `opts`. Also provides an option for a custom `template` for rendering each
  // tab.
  ns.TabController = Backbone.View.extend({
    tagName: 'ul',

    className: 'ui-tab',

    template: _.template('<li class="<%=className%>"><a href="<%=name%>" data-id="<%=id%>"><%=title%></a></li>'),

    events: {
      'click': 'clickHandler'
    },

    view: false,

    initialize: function (opts) {
      if (!(opts.view instanceof ns.ContainerView)) {
        throw 'No view for tab control';
      }
      this.view = opts.view;
      this.prefix = opts.prefix || '';
      this.template = opts.template || this.template;
      this.onClick = _.isFunction(opts.onClick) ? opts.onClick : false;
      _.bindAll(this, 'render', 'clickHandler');
      // Re-render when selected view changes.
      // Used when view in superview is set programmatically
      this.view.bind('change', this.render);
      this.render();
    },

    // A custom clickhandler can be provided via the `onClick` parameter. This
    // function will be called with the name of the selected view as first
    // parameter
    clickHandler: function (e) {
      var id = $(e.target).data('id');
      if (this.onClick) {
        return this.onClick.apply(this.view, [id, e]);
      }
    },

    // Generate tabs for all views. CSS classes with the views name
    // and selected state will be added
    render: function () {
      this.el.empty();
      var selected = this.view.getView();
      for (var i in this.view.views) {
        if (this.view.views.hasOwnProperty(i)) {
          var data = {
            id: i,
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

  // Offers functionality to paginate over a collection
  ns.PaginatedView = Backbone.View.extend({
    initialize: function () {
      _.bindAll(this, 'nextPage', 'prevPage', '_update');
      this.pageSize = 10;
      this.page = 0;
      this.length = 0;
      if (_.isFunction(this.init)) {
        this.init.apply(this, arguments);
      }
    },
    paginate: function (collection) {
      var start = this.page * this.pageSize;
      var end = ((this.page + 1) * this.pageSize) - 1;
      this.length = collection.length;
      return collection.slice(start, end);
    },
    nextPage: function () {
      if ((this.page + 1) * this.pageSize < this.length) {
        this.page++;
        this.render();
      }
    },

    prevPage: function () {
      if ((this.page - 1) * this.pageSize > 0) {
        this.page--;
        this.render();
      }
    },

    setPage: function () {
      // TODO:
    }
  });
}(jQuery, 'Backbone'));