var $ = require('jquery');

/**
 * @param  {jQuery} into
 * @param  {Boolean} initial
 * @param  {Object} condition
 */
var hopOnCondition = module.exports = function ( into, initial, condition ) {

	var data = {};

	if ( condition.matches ) {
		data = {
			media: condition,
			into: into
		};
		this.queueActive.push(data);
	} else {
		if ( !initial ) {
			this.queueActive.pop();
			if ( this.queueActive.length === 0 ) {
				data = {
					media: {
						matches: true,
						media: 'root'
					},
					into: this.$el
				};
			} else {
				data = this.queueActive[this.queueActive.length - 1];
			}
		}
	}

	/**
	 * Set flag when flowing elements are ready.
	 * This is so we can avoid FOUC on contexts where content has to flow.
	 */
	if ( initial ) {
		this.queue.push(data);
		this.$el.add(into)
			.addClass([this.options.classes.item, this.options.classes.isReady].join(' '));
	}

	if ( !$.isEmptyObject(data) && data.media.matches ) {
		this.hop(data.into, data.media);
	}

};
