# kist-dochopper

Move elements on page depending on media query.

## Installation

```sh
bower install niksy/kist-dochopper
```

## API

### `Element.dochopper([options])`

Returns: `jQuery`

#### options

Type: `Object`

##### conditions

Type: `Array`

Contains objects which define conditions where and when should specific element be moved when media query is matched or unmatched.

##### hopped

Type: `Function`  
Provides: `Array|jQuery, Array|Object`

Callback for when context switching is complete, either when entering or exiting media query.

Array for first and second argument will be returned on plugin initialization. Every array contains list of currently active conditions, first argument containing elements which had their content filled with initial content, and second argument containing list of media query objects which are currently activate and correspond to list of containing elements in first argument.

Every next condition matching or unmatching will return active jQuery element and media query object.

### Events

#### `hop.kist.dochopper`

See [options → hopped](#hopped).

### Data attributes

#### `hop-conditions`

Type: `JSON Object`

See [options → conditions](#conditions).

#### `hop-from`

Type: `String`

Name of the element in which will the content hop to.

## Examples

Set proper HTML markup.

```html
<div class="hopper hopper-a">
	<b>Content A</b>
</div>

<div class="hopper hopper-b" data-hop-conditions='[{"into":"hop3","media":"screen and (min-width:900px)"},{"into":"hop4","media":"screen and (min-width:1400px)"}]'>
	<b>Content B</b>
</div>

<div data-hop-from="hop1"></div>
<div data-hop-from="hop2"></div>
<div data-hop-from="hop3"></div>
<div data-hop-from="hop4"></div>
```

Initialize plugin.

```js
$('.hopper-a').dochopper({
	conditions: [
		{
			into: 'hop1',
			media: 'screen and (min-width:1000px)'
		},
		{
			into: 'hop2',
			media: 'screen and (min-width:1200px)'
		}
	],
	hopped: function ( element, media ) {
		// Hopped!
	}
});

$('.hopper-b').dochopper();

$('.hopper-a, .hopper-b').on('hop.kist.dochopper', function ( e, element, media ) {
	// Hopped!
});
```

Destroy plugin instance.

```js
$('.hopper').dochopper('destroy');
```

## Caveats

### FOUC

It’s not unusual to experience FOUC (Flash Of Unmoved Content) because browser is waiting to render some other part of document and your hopping portion becomes blank and takes space where it shouldn’t be taking it.

To prevent this type of problems, you can use some simple CSS trickery to visually hide elements until they are ready. You have classes like `.kist-Dochopper.is-ready` applied when elements are switched to their correct places for current context and are ready to be displayed.

```css
.hopper {
	height:1px;
	visibility:hidden;
}
.hopper.kist-Dochopper.is-ready {
	height:auto;
	visibility:visible;
}
```

### Delegated events

If you have delegated events on some elements which will at some point be switched to another place, those events won’t work as intended since now those elements are in the new place.

### Combination of `min-` and `max-` media queries

If you use combination of `min-` and `max-` media queries (e.g. `screen and (min-width:100px) and (max-width:299px)`), those media queries won’t be shown in inital list of media queries which where activated if the current viewport is larger than that media query condition. This is normal media query listener behavior.

Also, exiting that media query will trigger next matching query and the last ones which also match current viewport.

## Browser support

Tested in IE8+ and all modern browsers.

## License

MIT © [Ivan Nikolić](http://ivannikolic.com)










