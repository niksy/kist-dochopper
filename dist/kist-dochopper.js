/*! kist-dochopper 0.2.6 - Move elements on page depending on media query. | Author: Ivan Nikolić, 2014 | License: MIT */
(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

module.exports = function extend (object) {
    // Takes an unlimited number of extenders.
    var args = Array.prototype.slice.call(arguments, 1);

    // For each extender, copy their properties on our object.
    for (var i = 0, source; source = args[i]; i++) {
        if (!source) continue;
        for (var property in source) {
            object[property] = source[property];
        }
    }

    return object;
};
},{}],2:[function(require,module,exports){
var extend = require('s-extend');
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
			o = extend({}, { __media: rules[i] });
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

var api = {

	/**
	 * @param  {Array} rules
	 *
	 * @return {Array}
	 */
	sort: function ( rules ) {
		if ( rules ) {
			return this[typeof(rules[0]) === 'string' ? 'sortString' : 'sortObject'].apply(this, arguments);
		}
		return [];
	},

	/**
	 * @param  {Array} rules
	 *
	 * @return {Array}
	 */
	sortString: function ( rules ) {
		return sortInit(rules, 'string');
	},

	/**
	 * @param  {Array} rules
	 * @param  {String} prop
	 *
	 * @return {Array}
	 */
	sortObject: function ( rules, prop ) {
		return sortInit(rules, 'object', prop);
	}

};

module.exports = api;

},{"s-extend":1}],3:[function(require,module,exports){
var dochopper = require('./lib/dochopper');

$.kist = $.kist || {};
$.fn[dochopper.name] = dochopper.fn;

},{"./lib/dochopper":4}],4:[function(require,module,exports){
(function (global){
/* jshint latedef:nofunc */

var $ = (typeof window !== "undefined" ? window.$ : typeof global !== "undefined" ? global.$ : null);
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
	},
	constructClasses: function () {

		// Prepare CSS classes
		this.options.classes = {};
		this.options.classesNs = {};

		$.each(plugin.classes, $.proxy(function ( name, value ) {

			var ns        = $.trim(this.options.namespace);
			var pluginNs  = plugin.ns.css;
			var className = pluginNs + value;
			var classNameNs = className;

			if ( /^is[A-Z]/.test(name) ) {
				className = classNameNs = value;
			} else if ( ns !== pluginNs && ns !== '' ) {
				classNameNs = ns + value;
				className = pluginNs + value + ' ' + classNameNs;
			}

			this.options.classesNs[name] = classNameNs;
			this.options.classes[name] = className;

		}, this));

	}
};
plugin.classes = {
	item: '-item',
	isReady: 'is-ready'
};
plugin.publicMethods = ['destroy','rehop'];
plugin.cb = function ( event, data ) {
	if ( this.options[event] ) {
		this.options[event].apply(this.element, data);
	}
	this.dom.el.trigger((plugin.name + event).toLowerCase(), data);
};

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
			.removeClass(this.options.classes.item)
			.removeClass(this.options.classes.isReady);

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
	plugin.cb.call(this, 'hop', args);
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
			.addClass(this.options.classes.item)
			.addClass(this.options.classes.isReady);
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

	plugin.constructClasses.call(this);

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
		hop: function () {},
		namespace: plugin.ns.css
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

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"sort-media-queries":2}]},{},[3]);