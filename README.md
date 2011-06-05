# Backbone UI #
Trying to create some re-useable components from things i often find myself
doing

Might grow mature in the future

## Example usage ##
Example use of the superview and tabcontroller. Se complete example in `example`
directory

    // Create container
    var container = new Backbone.SuperView({
      el: $('#container')
    });

    // Add views
    container.addView('first', new Backbone.View({
      el: $('#first')
    }));

    container.addView('second', new Backbone.View({
      el: $('#second')
    }));

    container.addView('third', new Backbone.View({
      el: $('#third')
    }));

    // Create a controller
    var nav = new Backbone.TabController({
      view: container,
      el: $('#navigation'),
      onClick: function (name) {
        container.setView(name);
        return false;
      }
    });

    // Set initial view
    container.setView('first');
