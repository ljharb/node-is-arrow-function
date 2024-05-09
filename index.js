'use strict';

/** @param {number} n */
var found = function (n) {
	return n !== -1;
};
/** @param {number} n */
var notFoundGoesLast = function (n) {
	return found(n) ? n : Infinity;
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
	var slash = fnStr.indexOf('/');

	if (!found(firstNonSpace) || !found(arrow) || classRe.test(fnStr)) {
		return false;
	}
	if (!found(brace) || !found(paren) || paren === firstNonSpace) {
		return true;
	}
	if (found(quote) && quote === firstNonSpace) {
		return false;
	}

	var firstPunct = [
		arrow,
		brace,
		paren,
		slash
	].map(notFoundGoesLast).sort(function (a, b) {
		return a - b;
	})[0];

	if (firstPunct === arrow) {
		return true;
	}

	var beforeParams = fnStr.slice(0, paren).replace(stripRe, '');
	return !beforeParams || beforeParams === 'async';
};
