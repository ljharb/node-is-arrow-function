// @ts-check

'use strict';

var test = require('tape');
var isArrowFunction = require('../index');
var forEach = require('for-each');
var f = require('./fixtures');
var fixtures = f.fixtures;
var helpers = f.helpers;

/**
 * @typedef {{
 * 	when: string
 * 	expect: boolean
 * 	items: unknown[]
 * }} TestConfig
 */

/**
 * @param {TestConfig} config
 */
var testItems = function (config) {
	var when = config.when;
	var expect = config.expect;
	var items = config.items;

	test('returns ' + expect + ' when ' + when, function (t) {
		if (items.length === 0) {
			t.skip();
			t.end();
			return;
		}
		t.plan(items.length);
		forEach(items, function (item) {
			t[expect ? 'ok' : 'notOk'](isArrowFunction(item), String(item) + ' is ' + when);
		});
		t.end();
	});
};

testItems({
	when: 'not a function',
	expect: false,
	items: [
		true,
		false,
		null,
		undefined,
		{},
		[],
		/a/g,
		'string',
		'() => {}',
		'function () {}',
		// eslint-disable-next-line no-magic-numbers
		42,
		new Date(0)
	]
});

testItems({ when: 'not an arrow function', expect: false, items: fixtures.syncNonArrowFunctions });
testItems({ when: 'arrow function', expect: true, items: fixtures.syncArrowFunctions });
testItems({ when: 'async arrow function', expect: true, items: fixtures.asyncArrowFunctions });
testItems({ when: 'async non-arrow function', expect: false, items: fixtures.asyncNonArrowFunctions });
testItems({ when: 'generator function', expect: false, items: fixtures.syncGeneratorFunctions });
testItems({ when: 'async generator function', expect: false, items: fixtures.asyncGeneratorFunctions });
testItems({ when: 'method', expect: false, items: fixtures.syncMethods });
testItems({ when: 'async method', expect: false, items: fixtures.asyncMethods });
testItems({ when: 'generator method', expect: false, items: fixtures.syncGeneratorMethods });
testItems({ when: 'async generator method', expect: false, items: fixtures.asyncGeneratorMethods });
testItems({ when: 'class', expect: false, items: fixtures.classes });

testItems({
	when: 'built-in',
	expect: false,
	items: [
		setTimeout,
		Date,
		Date.now,
		// eslint-disable-next-line no-eval
		eval
	]
});

testItems({
	when: 'alert',
	expect: false,
	/* global alert */
	items: typeof alert === 'function' ? [alert] : []
});

testItems({
	when: 'document.all',
	expect: false,
	/* global document */
	items: typeof document === 'undefined' ? [] : [document.all]
});

test('returns false for non-arrow function with faked toString', function (t) {
	var func = function () {};
	func.toString = function () { return '() => {}'; };

	t.notEqual(String(func), Function.prototype.toString.call(func), 'test function has faked toString that is different from default toString');
	t.notOk(isArrowFunction(func), 'non-arrow function with faked toString is not an arrow function');
	t.end();
});

test('returns true for arrow function with faked toString', function (t) {
	var func = helpers.parseFromSource('() => {}');
	if (!func) {
		t.skip();
		t.end();
		return;
	}

	func.toString = function () { return 'function () {}'; };

	t.notEqual(String(func), Function.prototype.toString.call(func), 'test function has faked toString that is different from default toString');
	t.ok(isArrowFunction(func), 'arrow function with faked toString is an arrow function');
	t.end();
});

test('https://github.com/inspect-js/is-arrow-function/issues/26', function (t) {
	// False positive on object methods with arrow functions inside
	var x = helpers.parseFromSource('{\n		foo() {\n			return 42\n		},\n		bar() {\n			return (() => 10)()\n		},\n		buz() {\n			// if this was an arrow function, it would have included => in it\n			return 123\n		},\n	}');
	if (!x) {
		t.skip();
		t.end();
		return;
	}

	t.notOk(isArrowFunction(x.foo));
	t.notOk(isArrowFunction(x.bar));
	t.notOk(isArrowFunction(x.buz));

	t.end();
});

test('https://github.com/inspect-js/is-arrow-function/issues/15', function (t) {
	// False negative for arrow function with closing parenthesis in parameter list

	var fns = helpers.parseAllFromSource([
		'(a = Math.random(10)) => {}',
		'(a = function () {\n		if (Math.random() < 0.5) {\n			return 42;\n		}\n		return "something else";\n	}) => a()'
	]);

	t.plan(fns.length);
	forEach(fns, function (fn) {
		t.ok(isArrowFunction(fn), String(fn) + ' is arrow function');
	});
	t.end();
});
