var $ = require('jquery');
var meta = require('./meta');
var hopOnCondition = require('./hop-on-condition');
var emit = require('kist-toolbox/lib/event-emitter')(meta.name);

module.exports = {
	setupInitial: function () {

		this.$el.one('init' + this.ens, $.proxy(function ( e, queue ) {

			var element = $();
			var media = [];
			var count = 0;

			$.each(queue, function ( index, item ) {
				if ( $.isEmptyObject(item) ) {
					count++;
					return;
				}
				element = element.add(item.into);
				media.push(item.media);
			});

			// Trigger hop only if we have at least one condition active
			if ( count !== queue.length ) {
				emit(this, 'hop', [element, media]);
			}

			while ( queue.length > 0 ) {
				queue.pop();
			}

		}, this));

	},
	setupListeners: function () {

		$.each(this.conditions, $.proxy(function ( index, condition ) {
			condition.get.media.addListener(condition.get.listener);
			hopOnCondition.call(this, condition.get.into, true, condition.get.media);
		}, this));

		this.$el.trigger('init' + this.ens, [this.queue]);

	},
	destroy: function () {

		$.each(this.conditions, function ( index, condition ) {
			condition.get.media.removeListener(condition.get.listener);
		});

	}
};
