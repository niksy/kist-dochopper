/* jshint maxparams: 4 */
;(function ( $, window, document, undefined ) {

	var o                    = {};
	var pluginName           = 'KistDochopper';
	var pluginDomNamespace   = 'kist-dochopper';
	var pluginEventNamespace = 'kist.dochopper';

	var Plugin = function ( element, options ) {

		this._element  = element;
		this.settings  = $.extend( {}, this.defaults, options );

	};

	/**
	 * Default options
	 *
	 * @type {Object}
	 */
	o.defaults = {
		onContextSwitch: function () {}
	};

	/**
	 * Initialize plugin
	 *
	 * @return {Plugin}
	 */
	o.init = function () {

		this.getDomRefs();
		this.getFlowConditions();
		this.setFlowListeners();

		return this;

	};

	/**
	 * Get DOM references
	 *
	 * @return {Plugin}
	 */
	o.getDomRefs = function () {

		this.domRefs         = {};
		this.domRefs.element = $( this._element );

	};

	/**
	 * Get flow conditions. Merge values from `data` attributes and options
	 * passed to plugin initialization.
	 *
	 * @return {Array}
	 */
	o.getFlowConditions = function () {

		var metaData = this.domRefs.element.data(pluginDomNamespace + '-conditions');

		this.flowConditions = [];

		if ( typeof(metaData) != 'undefined' ) {
			this.flowConditions = this.flowConditions.concat(metaData);
		}

		if ( typeof(this.settings.conditions) != 'undefined' ) {
			this.flowConditions = this.flowConditions.concat(this.settings.conditions);
		}

	};

	/**
	 * Set flow listeners
	 */
	o.setFlowListeners = function () {

		if ( this.domRefs.element.length === 0 ) {
			return;
		}

		$.each( this.flowConditions, $.proxy(function ( index, object ) {

			object.generated            = {};
			object.generated.mq         = window.matchMedia( object.onMediaQuery );
			object.generated.flowIntoEl = $('[data-' + pluginDomNamespace + '-flow-from="' + object.flowInto + '"]');

			object.generated.mq.addListener($.proxy (function ( pMq ) {

				this.contextSwitch( pMq, object.generated.flowIntoEl );

			}, this));

			this.contextSwitch( object.generated.mq, object.generated.flowIntoEl, true );

		}, this));

	};

	/**
	 * Switch context on MQ
	 *
	 * @param  {Object} pMqCondition
	 * @param  {$Object} pFlowIntoEl
	 * @param  {Boolean} pInitial
	 *
	 * @return {Ui}
	 */
	o.contextSwitch = function ( pMqCondition, pFlowIntoEl, pInitial ) {

		if ( pMqCondition.matches ) {

			/**
			 * Get flowing content after all initial matching of MQ is done.
			 * This way we can catch non-empty flow-from elements.
			 */
			if ( !('flowingContent' in this.domRefs) ) {
				this.domRefs.flowingContent = this.domRefs.element.children();
			}

			this.domRefs.flowingContent.appendTo( pFlowIntoEl );

		} else {

			$.each( this.flowConditions, $.proxy(function ( index, object ) {

				/**
				 * Exit early if we don’t have generated data (e.g. MQs and DOM refs).
				 */
				if ( !('generated' in object) ) {
					return;
				}

				/**
				 * First matching MQ is good one so we use that for switching
				 * when context is changed.
				 *
				 * @type {Boolean}
				 */
				if ( object.generated.mq.matches === true ) {
					this.contextSwitch( object.generated.mq, object.generated.flowIntoEl );
					return false;
				}

				/**
				 * If no matching MQs have been found, move content to
				 * initial element.
				 *
				 * @type {Boolean}
				 */
				if ( index === (this.flowConditions.length - 1) ) {
					if ( 'flowingContent' in this.domRefs ) {
						this.domRefs.flowingContent.appendTo(this.domRefs.element);
					}
				}

			}, this));

		}

		/**
		 * Set flag when flowing elements are ready.
		 * This is so we can avoid FOUC on contexts where content has to flow.
		 */
		if ( typeof( pInitial ) !== 'undefined' && pInitial === true ) { /* 1 */
			this.domRefs.element.addClass( pluginName + '--is-ready' );
			pFlowIntoEl.addClass( pluginName + '--is-ready' );
		}

		/**
		 * Callback after everything is finished.
		 */
		this.settings.onContextSwitch();
		this.domRefs.element.trigger( pluginEventNamespace + '.contextSwitch' );

	};

	$.extend( Plugin.prototype, o );

	$[ pluginName ]          = {};
	$[ pluginName ].defaults = Plugin.prototype.defaults;

	$.fn[ pluginName ] = function ( options ) {

		this.each(function () {
			if ( !$.data( this, pluginName ) ) {
				$.data( this, pluginName, new Plugin( this, options ).init() );
			}
		});

		return this;
	};

})( jQuery, window, document );
