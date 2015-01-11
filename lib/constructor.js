var $ = require('jquery');
var smq = require('sort-media-queries');
var toarray = require('toarray');
var dom = require('./dom');
var events = require('./events');
var instance = require('./instance');
var meta = require('./meta');
var hopOnCondition = require('./hop-on-condition');
var emit = require('kist-toolbox/lib/event-emitter')(meta.name);
var jQuery = $;

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
		into = into.call(this.element, this.$el);
	}

	if ( typeof(into) === 'string' ) {
		el = '[data-' + this.options.hopFromDataProp + '="' + into + '"]';
	}
	if ( into instanceof jQuery ) {
		el = into;
	}

	return $(el);
}

/**
 * Get conditions from DOM attribute
 *
 * @return {Array}
 */
function getDomConditions () {
	var data = this.$el.data(this.options.hopConditionsDataProp);
	return data ? toarray(data) : [];
}

function setConditions () {

	this.conditions = this.conditions || [];
	this.conditions = this.conditions.concat(getDomConditions.call(this), toarray(this.options.conditions));

	this.conditions = smq(this.conditions, 'media');

	$.each(this.conditions, $.proxy(function ( index, condition ) {

		condition.get          = {};
		condition.get.media    = window.matchMedia(condition.media);
		condition.get.into     = getIntoElement.call(this, condition.into);
		condition.get.listener = $.proxy(hopOnCondition, this, condition.get.into, false);

	}, this));

}

/**
 * @class
 *
 * @param {Element} element
 * @param {Object} options
 */
function Dochopper ( element, options ) {

	this.element = element;
	this.options = $.extend(true, {}, this.defaults, options);

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
		this.$content.detach().appendTo(into);
		if ( !this.queue.length ) {
			emit(this, 'hop', [into, media]);
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

	defaults: {
		conditions: [],
		hop: $.noop,
		hopFromDataProp: 'hop-from',
		hopConditionsDataProp: 'hop-conditions',
		classes: {
			item: meta.ns.htmlClass + '-item',
			isReady: 'is-ready'
		}
	}

});

module.exports = Dochopper;
