/*! kist-dochopper 0.3.0 - Move elements on page depending on media query. | Author: Ivan Nikolić <niksy5@gmail.com> (http://ivannikolic.com/), 2015 | License: MIT */
!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self);var n=f;n=n.jQuery||(n.jQuery={}),n=n.fn||(n.fn={}),n.dochopper=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
var $ = (typeof window !== "undefined" ? window.$ : typeof global !== "undefined" ? global.$ : null);
var smq = require(10);
var toarray = require(12);
var dom = require(2);
var events = require(3);
var instance = require(6);
var meta = require(7);
var hopOnCondition = require(4);
var emit = require(8)(meta.name);
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
		into = into.call(this.element);
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
			isReady: meta.ns.htmlClass + 'is-ready'
		}
	}

});

module.exports = Dochopper;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],2:[function(require,module,exports){
(function (global){
var $ = (typeof window !== "undefined" ? window.$ : typeof global !== "undefined" ? global.$ : null);

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

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],3:[function(require,module,exports){
(function (global){
var $ = (typeof window !== "undefined" ? window.$ : typeof global !== "undefined" ? global.$ : null);
var meta = require(7);
var hopOnCondition = require(4);
var emit = require(8)(meta.name);

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

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],4:[function(require,module,exports){
(function (global){
var $ = (typeof window !== "undefined" ? window.$ : typeof global !== "undefined" ? global.$ : null);

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

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],5:[function(require,module,exports){
(function (global){
var $ = (typeof window !== "undefined" ? window.$ : typeof global !== "undefined" ? global.$ : null);
var Ctor = require(1);
var meta = require(7);
var isPublicMethod = require(9)(meta.publicMethods);

/**
 * @param  {Object|String} options
 *
 * @return {jQuery}
 */
var plugin = module.exports = function ( options ) {

	options = options || {};

	return this.each(function () {

		var instance = $.data(this, meta.name);

		if ( isPublicMethod(options) && instance ) {
			instance[options]();
		} else if ( $.type(options) === 'object' && !instance ) {
			$.data(this, meta.name, new Ctor(this, options));
		}

	});

};
plugin.defaults = Ctor.prototype.defaults;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],6:[function(require,module,exports){
(function (global){
var $ = (typeof window !== "undefined" ? window.$ : typeof global !== "undefined" ? global.$ : null);
var meta = require(7);
var instance = 0;

module.exports = {
	setup: function () {
		this.uid = instance++;
		this.ens = meta.ns.event + '.' + this.uid;
	},
	destroy: function () {
		$.removeData(this.element, meta.name);
	}
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],7:[function(require,module,exports){
module.exports = {
	name: 'dochopper',
	ns: {
		htmlClass: 'kist-Dochopper',
		event: '.kist.dochopper'
	},
	publicMethods: ['destroy','rehop']
};

},{}],8:[function(require,module,exports){
(function (global){
/* jshint maxparams:false */

var $ = (typeof window !== "undefined" ? window.$ : typeof global !== "undefined" ? global.$ : null);

/**
 * @param  {String} name
 *
 * @return {Function}
 */
module.exports = function ( name ) {

	/**
	 * @param  {Object}   ctx
	 * @param  {String}   eventName
	 * @param  {Array}    data
	 * @param  {jQuery}   triggerEl
	 */
	return function ( ctx, eventName, data, triggerEl ) {
		var el = (ctx.dom && ctx.dom.el) || ctx.$el || $({});
		if ( ctx.options[eventName] ) {
			ctx.options[eventName].apply((el.length === 1 ? el[0] : el.toArray()), data);
		}
		(triggerEl || el).trigger(((name || '') + eventName).toLowerCase(), data);
	};

};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],9:[function(require,module,exports){
(function (global){
var $ = (typeof window !== "undefined" ? window.$ : typeof global !== "undefined" ? global.$ : null);

/**
 * @param  {Array} methods
 *
 * @return {Function}
 */
module.exports = function ( methods ) {

	/**
	 * @param  {String} name
	 *
	 * @return {Boolean}
	 */
	return function ( name ) {
		return typeof(name) === 'string' && $.inArray(name, methods || []) !== -1;
	};

};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],10:[function(require,module,exports){
var extend = require(11);
var mqTypes = ['blank','all','minWidth','minHeight','maxWidth','maxHeight','print'];

/**
 * @param  {Array} rules
 * @param  {String} type
 * @param  {String} prop
 *
 * @return {Boolean}
 */
function itemsValid ( rules, type, prop ) {
	var flag = true;
	for ( var i = 0, rulesLength = rules.length; i < rulesLength; i++ ) {
		if ( typeof(rules[i]) !== type || ( prop && !rules[i].hasOwnProperty(prop) ) ) {
			flag = false;
			break;
		}
	}
	return flag;
}

/**
 * @param  {Array} rules
 * @param  {String} type
 * @param  {String} prop
 *
 * @return {Boolean}
 */
function allValid ( rules, type, prop ) {
	if (
		!rules || !rules.length || typeof(rules) === 'string'
	) {
		return 'none';
	}
	if (
		(type === 'object' && (!prop || typeof(prop) !== 'string')) ||
		!itemsValid(rules, type, prop)
	) {
		return 'some';
	}
	return 'all';
}

/**
 * Normalize between array with strings and array with objects
 *
 * @param  {Array} rules
 * @param  {String} type
 * @param  {String} prop
 *
 * @return {Object}
 */
function prepareRules ( rules, type, prop ) {
	var collection = [];
	var o = {};
	for ( var i = 0, rulesLength = rules.length; i < rulesLength; i++ ) {
		if ( type === 'string' ) {
			o = extend({}, {
				__media: rules[i]
			});
		} else {
			o = extend({}, rules[i]);
			o.__media = rules[i][prop];
		}
		collection.push(o);
	}
	return collection;
}

/**
 * @param  {Boolean} isMax
 *
 * @return {Function}
 */
function determineSortOrder ( isMax ) {

	/**
	 * Determine sort order based on provided arguments
	 *
	 * @param  {Object} a
	 * @param  {Object} b
	 *
	 * @return {Integer}
	 */
	return function ( a, b ) {

		var sortValA = a.sortVal;
		var sortValB = b.sortVal;
		var ruleA = a.item.__media;
		var ruleB = b.item.__media;
		isMax = typeof(isMax) !== 'undefined' ? isMax : false;

		// Consider print for sorting if sortVals are equal
		if ( sortValA === sortValB ) {
			if ( ruleA.match(/print/) ) {
				// a contains print and should be sorted after b
				return 1;
			}
			if ( ruleB.match(/print/) ) {
				// b contains print and should be sorted after a
				return -1;
			}
		}

		// Return descending sort order for max-(width|height) media queries
		if ( isMax ) {
			return sortValB - sortValA;
		}

		// Return ascending sort order
		return sortValA - sortValB;
	};
}

/**
 * @return {Object}
 */
function createCollection () {
	var mqCollection = {};
	for ( var i = 0, mqTypesLength = mqTypes.length; i < mqTypesLength; i++ ) {
		mqCollection[mqTypes[i]] = [];
	}
	return mqCollection;
}

/**
 * @param {Object} collection
 * @param {Array} rules
 *
 * @return {Object}
 */
function addRulesToCollection ( collection, rules ) {

	// Sort media queries by kind, this is needed to output them in the right order
	for ( var i = 0, rulesLength = rules.length; i < rulesLength; i++ ) {

		var item = rules[i];
		var rule = item.__media;
		var collectionType = 'blank';
		var valMatch = rule.match(/\d+/g);

		if ( rule.match(/min-width/) ) {
			collectionType = 'minWidth';
		} else if ( rule.match(/min-height/) ) {
			collectionType = 'minHeight';
		} else if ( rule.match(/max-width/) ) {
			collectionType = 'maxWidth';
		} else if ( rule.match(/max-height/) ) {
			collectionType = 'maxHeight';
		} else if ( rule.match(/print/) ) {
			collectionType = 'print';
		} else if ( rule.match(/all/) ) {
			collectionType = 'all';
		}

		collection[collectionType].push({
			item: item,
			sortVal: valMatch ? valMatch[0] : 0
		});

	}
	return collection;
}

/**
 * @param  {Object} collection
 *
 * @return {Object}
 */
function sortCollection ( collection ) {
	var sorter;
	for ( var collectionType in collection ) {
		if ( collection.hasOwnProperty(collectionType) ) {
			sorter = determineSortOrder(false);
			if ( collectionType === 'maxWidth' || collectionType === 'maxHeight' ) {
				sorter = determineSortOrder(true);
			}
			collection[collectionType].sort(sorter);
		}
	}
	return collection;
}

/**
 * @param  {Object} collection
 * @param  {String} type
 * @param  {String} prop
 *
 * @return {Array}
 */
function transformCollection ( collection, type, prop ) {
	var transformed = [];
	var collectionItem;

	function iterateCollectionItem ( collectionItem ) {
		var resultVal;
		for ( var i = 0, typeLength = collectionItem.length; i < typeLength; i++ ) {
			if ( type === 'string' ) {
				resultVal = collectionItem[i].item.__media;
			} else {
				resultVal = collectionItem[i].item;
				delete resultVal.__media;
			}
			transformed.push(resultVal);
		}
	}

	for ( var i = 0, mqTypesLength = mqTypes.length; i < mqTypesLength; i++ ) {
		iterateCollectionItem(collection[mqTypes[i]]);
	}

	return transformed;
}

/**
 * @param  {Array} rules
 * @param  {String} type
 * @param  {String} prop
 *
 * @return {Array}
 */
function sortInit ( rules, type, prop ) {

	switch ( allValid(rules, type, prop) ) {
		case 'none':
			return [];
		case 'some':
			return rules;
	}

	var collection = createCollection();
	rules = prepareRules(rules, type, prop);
	addRulesToCollection(collection, rules);
	sortCollection(collection);
	return transformCollection(collection, type, prop);
}

/**
 * @param  {Array} rules
 * @param  {String} prop
 *
 * @return {Array}
 */
module.exports = function ( rules, prop ) {
	if ( rules ) {
		if ( prop ) {
			return sortInit(rules, 'object', prop);
		}
		return sortInit(rules, 'string');
	}
	return [];
};

},{}],11:[function(require,module,exports){
module.exports = extend

function extend() {
    var target = {}

    for (var i = 0; i < arguments.length; i++) {
        var source = arguments[i]

        for (var key in source) {
            if (source.hasOwnProperty(key)) {
                target[key] = source[key]
            }
        }
    }

    return target
}

},{}],12:[function(require,module,exports){
module.exports = function(item) {
  if(item === undefined)  return [];
  return Object.prototype.toString.call(item) === "[object Array]" ? item : [item];
}
},{}]},{},[5])(5)
});