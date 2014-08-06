/* jshint latedef:nofunc */

var $ = require('jquery');
var smq = require('sort-media-queries');

var plugin = {
	name: 'dochopper',
	ns: {
		css: 'kist-Dochopper',
		event: '.kist.dochopper',
		dom: 'kist-dochopper'
	},
	error: function ( message ) {
		throw new Error(plugin.name + ': ' + message);
	}
};
plugin.classes = {
	item: plugin.ns.css + '-item',
	isReady: 'is-ready'
};
plugin.publicMethods = ['destroy','rehop'];

var dom = {
	setup: function () {
		this.dom         = this.dom || {};
		this.dom.el      = $(this.element);
		this.dom.content = this.dom.el.contents();
	},
	destroy: function () {

		var set = $();

		set = set.add(this.dom.el);

		$.each(this.conditions, $.proxy(function ( index, condition ) {
			set = set.add(condition.get.into);
		}, this));

		set
			.removeClass(plugin.classes.item)
			.removeClass(plugin.classes.isReady);

	}
};

var events = {
	setupInitial: function () {

		this.dom.el.one('init' + this.instance.ens, $.proxy(function ( e, queue ) {

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
				triggerHop.call(this, [element, media]);
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

		this.dom.el.trigger('init' + this.instance.ens, [this.queue]);

	},
	destroy: function () {

		$.each(this.conditions, $.proxy(function ( index, condition ) {
			condition.get.media.removeListener(condition.get.listener);
		}, this));

	}
};

var instance = {
	id: 0,
	setup: function () {
		this.instance     = this.instance || {};
		this.instance.id  = instance.id++;
		this.instance.ens = plugin.ns.event; // + '.' + this.instance.id;
	},
	destroy: function () {
		delete $.data(this.element)[plugin.name];
	}
};

/**
 * @this {Dochopper}
 *
 * @param  {String|Function|jQuery} into
 *
 * @return {jQuery}
 */
function getIntoElement ( into ) {

	var el;

	if ( typeof(into) === 'function' ) {
		into = into.call(this.element);
	}

	if ( typeof(into) === 'string' ) {
		el = '[data-hop-from="' + into + '"]';
	}
	if ( into instanceof jQuery ) {
		el = into;
	}

	return $(el);
}

/**
 * Wrap non-array conditions to array of conditions
 *
 * @param  {*} conditions
 *
 * @return {Array}
 */
function wrapConditions ( conditions ) {
	if ( $.type(conditions) === 'array' ) {
		return conditions;
	}
	return [conditions];
}

/**
 * Get conditions from DOM attribute
 *
 * @return {Array}
 */
function getDomConditions () {
	var data = this.dom.el.data('hop-conditions');
	return data ? wrapConditions(data) : [];
}

function setConditions () {

	this.conditions = this.conditions || [];
	this.conditions = this.conditions.concat(getDomConditions.call(this), wrapConditions(this.options.conditions));

	this.conditions = smq.sortObject(this.conditions, 'media');

	$.each(this.conditions, $.proxy(function ( index, condition ) {

		condition.get          = {};
		condition.get.media    = window.matchMedia(condition.media);
		condition.get.into     = getIntoElement.call(this, condition.into);
		condition.get.listener = $.proxy(hopOnCondition, this, condition.get.into, false);

	}, this));

}

/**
 * @this {Dochopper}
 *
 * @param  {Array} args
 *
 * @return {}
 */
function triggerHop ( args ) {
	this.options.hopped.apply(this.element, args);
	this.dom.el.trigger('hop' + this.instance.ens, args);
}

/**
 * @param  {jQuery} into
 * @param  {Boolean} initial
 * @param  {Object} condition
 *
 * @return {}
 */
function hopOnCondition ( into, initial, condition ) {

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
					into: this.dom.el
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
		this.dom.el.add(into)
			.addClass(plugin.classes.item)
			.addClass(plugin.classes.isReady);
	}

	if ( !$.isEmptyObject(data) && data.media.matches ) {
		this.hop(data.into, data.media);
	}

}

/**
 * @class
 *
 * @param {Element} element
 * @param {Object} options
 */
function Dochopper ( element, options ) {

	this.element = element;
	this.options = $.extend({}, this.defaults, options);

	this.queueActive = [];
	this.queue = [];

	instance.setup.call(this);
	dom.setup.call(this);

	setConditions.call(this);

	events.setupInitial.call(this);
	events.setupListeners.call(this);

}

$.extend(Dochopper.prototype, {

	/**
	 * @param  {jQuery} into
	 * @param  {Object} media
	 *
	 * @return {}
	 */
	hop: function ( into, media ) {
		this.dom.content.detach().appendTo(into);
		if ( !this.queue.length ) {
			triggerHop.call(this, [into, media]);
		}
	},

	destroy: function () {
		dom.destroy.call(this);
		events.destroy.call(this);
		instance.destroy.call(this);
	},

	rehop: function () {

		var set = [];

		$.each(this.conditions, $.proxy(function ( index, condition ) {
			if ( condition.get.media.matches ) {

				var el = getIntoElement.call(this, condition.into);

				// Do this only if new element is not the same as the first cached element
				if ( !condition.get.into.is(el) ) {
					condition.get.into = el;
					condition.get.media.removeListener(condition.get.listener);
					condition.get.listener = $.proxy(hopOnCondition, this, condition.get.into, false);
					condition.get.media.addListener(condition.get.listener);
					set.push([condition.get.into, condition.get.media]);
				}
			}

		}, this));

		if ( set.length ) {
			this.hop.apply(this, set[set.length - 1]);
		}

	},

	/**
	 * Default options
	 *
	 * @type {Object}
	 */
	defaults: {
		conditions: [],
		hopped: function () {}
	}

});

var fn = function ( options ) {

	if ( typeof(options) === 'string' && $.inArray(options, plugin.publicMethods) !== -1 ) {
		return this.each(function () {
			var pluginInstance = $.data(this, plugin.name);
			if ( pluginInstance ) {
				pluginInstance[options]();
			}
		});
	}

	return this.each(function () {
		if ( !$.data(this, plugin.name) ) {
			$.data(this, plugin.name, new Dochopper(this, options));
		}
	});

};

module.exports = {
	name: plugin.name,
	fn: fn
};
