// Conditions as options
$('.hopper').dochopper({
	conditions: [
		{
			into: 'hop3',
			media: 'screen and (min-width:1000px)'
		},
		{
			into: $('div'),
			media: 'screen and (min-width:1200px)'
		},
		{
			into: function () {
				if ( $('body').hasClass('foo') ) {
					return 'foo2';
				} else {
					return 'hop4';
				}
			},
			media: 'screen and (min-width:1200px)'
		}
	],
	condition: function () {
		return true;
	},
	hop: function ( element, media ) {
		console.log('Hopped!');
	}
});

// Listeners
$('.hopper').on('dochopperhop', function ( e, element, media ) {

});

// Destroy
$('.hopper').dochopper('destroy');
