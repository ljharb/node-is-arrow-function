'use strict';

/** @param {number} n */
var found = function (n) {
	return n !== -1;
};

/** @param {unknown} fn */
module.exports = function isArrowFunction(fn) {
	if (typeof fn !== 'function') {
		return false;
	}

	/** @type {string} */
	var fnStr = Function.prototype.toString.call(fn);

	var classRe = /^\s*class[\s/{]/;
	var stripRe = /^\s+|\s+$/g;

	var firstNonSpace = fnStr.search(/\S/);
	var quote = fnStr.search(/['"`]/);

	var paren = fnStr.indexOf('(');
	var brace = fnStr.indexOf('{');
	var arrow = fnStr.indexOf('=>');

	if (classRe.test(fnStr)) {
		return false;
	}
	if (!found(arrow) || !found(firstNonSpace)) {
		return false;
	}
	if (!found(brace) || !found(paren)) {
		return true;
	}
	if (found(quote) && quote === firstNonSpace) {
		return false;
	}
	if (paren === firstNonSpace) {
		return true;
	}
	if (Math.min(arrow, brace, paren) === arrow) {
		return true;
	}

	var beforeParams = fnStr.slice(0, paren).replace(stripRe, '');
	if (beforeParams && beforeParams !== 'async') {
		return false;
	}

	return paren < arrow && arrow < brace;
};
