# Kist Dochopper

Move elements on page depending on media query.

## Usage

1. Include jQuery and plugin.  
For browsers without `matchMedia` API you can use polyfills such as
[matchMedia.js](https://github.com/paulirish/matchMedia.js) and
[media-match](https://github.com/weblinc/media-match).

    ```html
    <script src="jquery.min.js"></script>
    <script src="dist/kist-dochopper.min.js">
    ```

2. Add "hopping" elements to page.

    ```html
    <div class="hopper" data-kist-dochopper-conditions='[{"flowInto":"hop1","onMediaQuery":"screen and (min-width:600px)"},{"flowInto":"hop2","onMediaQuery":"screen and (min-width:900px)"}]'>
    	<b>Original content</b><br />
    </div>
    
    ...
    
    <div data-kist-dochopper-flow-from="hop1"></div>
    <div data-kist-dochopper-flow-from="hop2"></div>
    ```

3. Initialize plugin.

    ```javascript
    $('.hopper').KistDochopper();
    ```

    You also have the ability do define conditions inside plugin initialization.
    This method is described in next section.

## Options

#### `conditions`

Type: `Array`

Contains objects which define conditions where and when should specific element
be moved when MQ is matched or unmatched. Syntax is the same as the one used in
`data-kist-dochopper-conditions` attribute value.

##### Example

```javascript
[
    {
        'flowInto': 'hop3',
        'onMediaQuery': 'screen and (min-width:300px)'
    }
]
```

#### `onContextSwitch`

Type: `Function`

Callback for when context switching is complete, either when entering or exiting media query.

## Events

#### `kist.dochopper.contextSwitch`

Attached to: calling element

Same as `onContextSwitch` option.

## FOUC

It’s not unusual to experience FOUC (Flash Of Unmoved Content) because browser is
waiting to render some other part of document and your hopping portion becomes blank
and takes space where it shouldn’t be taking it.

To prevent this type of problems, you can use some simple CSS trickery to visually
hide elements until they are ready. You have classes like `.KistDochopper--is-ready`
applied when elements are switched to their correct places for current context and
are ready to be displayed.

```css
.hopper {
    height:1px;
    visibility:hidden;
}
.hopper.KistDochopper--is-ready {
    height:auto;
    visibility:visible;
}
```
