// @ts-check

'use strict';

var isCallable = require('is-callable');
var fnToStr = Function.prototype.toString;

/** @param {unknown} fn */
module.exports = function isArrowFunction(fn) {
	if (!isCallable(fn)) {
		return false;
	}

	/** @type {string} */
	var fnStr = fnToStr.call(fn);

	var classRe = /^\s*class[\s/{]/;
	var stripRe = /^\s+|\s+$/g;

	var firstNonSpace = fnStr.search(/\S/);
	var quote = fnStr.search(/['"`]/);

	var paren = fnStr.indexOf('(');
	var brace = fnStr.indexOf('{');
	var arrow = fnStr.indexOf('=>');
	var slash = fnStr.indexOf('/');

	if (firstNonSpace === -1 || arrow === -1 || classRe.test(fnStr)) {
		return false;
	}
	if (brace === -1 || paren === -1 || paren === firstNonSpace) {
		return true;
	}

	var puncts = [
		arrow, brace, paren, slash, quote
	];
	for (var i = 0; i < puncts.length; ++i) {
		puncts[i] = puncts[i] === -1 ? Infinity : puncts[i];
	}
	puncts.sort(function (a, b) {
		return a - b;
	});
	if (puncts[0] === quote) {
		return false;
	}
	if (puncts[0] === arrow) {
		return true;
	}

	var beforeParams = fnStr.slice(0, paren).replace(stripRe, '');
	return !beforeParams || beforeParams === 'async';
};
