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

## Declarative syntax ##

Instead of manually calling `addView` for each subview you may use the
declarative syntax in the markup instead:

    <div data-bbui-id='first' data-bbui-type='Backbone.View' data-bbui-title='First tab'></div>

The container will look for elements with the `data-bbui-id` attribute and treat
DOM child nodes on the same level as it's sub-views. There is also a property
`data-bbui-parent= '<id>'` for force a certain parent child to a parent. Using
this syntax it will only be necessary to instantiate the first view:


    // Create container
    var container = new Backbone.SuperView({
      el: $('#container'),
      populate: true
    });


## Parameters ##

- `data-bbui-id`: Unique string for identifying a view. Necessary for automatic
  population of subviews
- `data-bbui-parent`: Option to force a child to belong to a certain parent
  view.
- `data-bbui-title`: Option used by the `TabController` to generate proper tab
  names
- `data-bbui-type`: View type to instantiate with current DOM node as `el`.
