/*! kist-dochopper 0.1.3 - Move elements on page depending on media query. | Author: Ivan Nikolić, 2014 | License: MIT */
(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
;(function ( root, factory ) {
	if (typeof define === 'function' && define.amd) {
		define([], factory);
	} else if (typeof exports === 'object') {
		module.exports = factory();
	} else {
		root.sortMediaQueries = factory();
	}
}(this, function ( undefined ) {

	var mqTypes = ['blank','all','minWidth','minHeight','maxWidth','maxHeight','print'];
	var sorter;

	/**
	 * @param  {Object} child
	 * @param  {Object} parent
	 *
	 * @return {Object}
	 */
	function objExtend ( child, parent ) {
		for ( var prop in parent ) {
			if ( parent.hasOwnProperty(prop) ) {
				child[prop] = parent[prop];
			}
		}
		return child;
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
				o = objExtend({}, { __media: rules[i] });
			} else {
				o = objExtend({}, rules[i]);
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

			if ( rule.match(/min-width/) ){
				collectionType = 'minWidth';
			} else if ( rule.match(/min-height/) ){
				collectionType = 'minHeight';
			} else if ( rule.match(/max-width/) ){
				collectionType = 'maxWidth';
			} else if ( rule.match(/max-height/) ){
				collectionType = 'maxHeight';
			} else if ( rule.match(/print/) ){
				collectionType = 'print';
			} else if ( rule.match(/all/) ){
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
	 * @class
	 */
	function MediaQuerySort () {}

	/**
	 * @param  {Array} rules
	 *
	 * @return {Array}
	 */
	MediaQuerySort.prototype.sort = function ( rules ) {
		if ( rules ) {
			return this[typeof(rules[0]) === 'string' ? 'sortString' : 'sortObject'].apply(this, arguments);
		}
		return [];
	};

	/**
	 * @param  {Array} rules
	 *
	 * @return {Array}
	 */
	MediaQuerySort.prototype.sortString = function ( rules ) {
		return sortInit(rules, 'string');
	};

	/**
	 * @param  {Array} rules
	 * @param  {String} prop
	 *
	 * @return {Array}
	 */
	MediaQuerySort.prototype.sortObject = function ( rules, prop ) {
		return sortInit(rules, 'object', prop);
	};

	return new MediaQuerySort();

}));

},{}],2:[function(require,module,exports){
;(function ( $, window, document, undefined ) {

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
	plugin.publicMethods = ['destroy'];

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

				$.each(queue, function ( index, item ) {
					if ( $.isEmptyObject(item) ) {
						return;
					}
					element = element.add(item.into);
					media.push(item.media);
				});

				this.options.hopped.call(null, element, media);
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
		setup: function () {
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

	function getDomConditions () {
		var data = this.dom.el.data('hop-conditions');
		return data ? data : [];
	}

	function setConditions () {

		this.conditions = this.conditions || [];
		this.conditions = this.conditions.concat(getDomConditions.call(this), this.options.conditions);

		this.conditions = smq.sortObject(this.conditions, 'media');

		$.each(this.conditions, $.proxy(function ( index, condition ) {

			condition.get          = {};
			condition.get.media    = window.matchMedia(condition.media);
			condition.get.into     = $('[data-hop-from="' + condition.into + '"]');
			condition.get.listener = $.proxy(hopOnCondition, this, condition.get.into, false);

		}, this));

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
						media: null,
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

		if ( !$.isEmptyObject(data) ) {
			this.hop(data.into, [data.into, data.media]);
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
		events.setup.call(this);

	}

	$.extend(Dochopper.prototype, {

		/**
		 * Switch context on MQ
		 *
		 * @param  {Object} condition
		 * @param  {jQuery} into
		 * @param  {Boolean} initial
		 *
		 * @return {}
		 */
		hop: function ( into, data ) {
			this.dom.content.detach().appendTo(into);
			if ( !this.queue.length ) {
				this.options.hopped.apply(null, data);
				this.dom.el.trigger('hop' + this.instance.ens, data);
			}
		},

		destroy: function () {
			dom.destroy.call(this);
			events.destroy.call(this);
			instance.destroy.call(this);
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

	$.kist = $.kist || {};

	$.fn[plugin.name] = function ( options ) {

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

})( jQuery, window, document );

},{"sort-media-queries":1}]},{},[2])