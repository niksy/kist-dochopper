var $ = require('jquery');

module.exports = {
	setup: function () {
		this.$el = $(this.element);
		this.$content = this.$el.contents();
	},
	destroy: function () {

		var set = $();

		set = set.add(this.$el);

		$.each(this.conditions, function ( index, condition ) {
			set = set.add(condition.get.into);
		});

		set.removeClass([this.options.classes.item, this.options.classes.isReady].join(' '));

	}
};
