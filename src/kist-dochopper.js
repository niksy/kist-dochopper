var dochopper = require('./lib/dochopper');

$.kist = $.kist || {};
$.fn[dochopper.name] = dochopper.fn;
