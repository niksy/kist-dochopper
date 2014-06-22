// Conditions as options
$('.hopper').dochopper({
	conditions: [
		{
			into: 'hop3',
			media: 'screen and (min-width:1000px)'
		},
		{
			into: 'hop1',
			media: 'screen and (min-width:1200px)'
		}
	],
	hopped: function ( element, media ) {
		console.log('Hopped!');
	}
});

// Listeners
$('.hopper').on('hop.kist.dochopper', function ( e, element, media ) {

});

// Destroy
$('.hopper').dochopper('destroy');
