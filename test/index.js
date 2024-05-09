'use strict';

var test = require('tape');
var isArrowFunction = require('../index');
var forEach = require('for-each');

var isModernishNodeEnv = function () {
	if (typeof process === 'object' && process.versions && process.versions.node) {
		var major = process.versions.node.match(/^\d+/);
		// eslint-disable-next-line no-magic-numbers
		return major && Number(major[0]) >= 12;
	}

	return false;
};

var IS_MODERNISH_NODE_ENV = isModernishNodeEnv();

var getFromSource = function (objOrSource) {
	if (typeof objOrSource !== 'string') {
		return objOrSource;
	}

	try {
		// eslint-disable-next-line no-new-func
		return new Function('return (' + objOrSource + ')')();
	} catch (e) {
		if (IS_MODERNISH_NODE_ENV) {
			// anything we pass to this function should be valid syntax as of modern node versions
			throw e;
		}
		// if invalid syntax in older versions, we simply ignore them
		return null;
	}
};

var getAllFromSource = function (obj) {
	var objs = [];
	for (var i = 0; i < obj.length; ++i) {
		var fn = getFromSource(obj[i]);
		if (fn) {
			objs.push(fn);
		}
	}
	return objs;
};

test('returns false for non-functions', function (t) {
	var nonFuncs = [
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
	];

	t.plan(nonFuncs.length);
	forEach(nonFuncs, function (nonFunc) {
		t.notOk(isArrowFunction(nonFunc), nonFunc + ' is not a function');
	});
	t.end();
});

test('returns false for non-arrow functions', function (t) {
	var fns = getAllFromSource([
		function () {},
		function foo() {},
		function foo() { '=>'; },
		'function foo() { () => {} }'
	]);

	t.plan(fns.length);
	forEach(fns, function (fn) {
		t.notOk(isArrowFunction(fn), String(fn) + ' is not an arrow function');
	});
	t.end();
});

test('returns false for built-ins', function (t) {
	var fns = [
		setTimeout,
		Date,
		Date.now,
		// eslint-disable-next-line no-eval
		eval
	];

	t.plan(fns.length);
	forEach(fns, function (fn) {
		t.notOk(isArrowFunction(fn), String(fn) + ' is a built-in');
	});

	t.end();
});

test('returns false for alert', function (t) {
	/* global alert */
	if (typeof alert === 'function') {
		t.notOk(isArrowFunction(alert));
	} else {
		t.skip();
	}
	t.end();
});

test('returns false for document.all', function (t) {
	/* global document */
	if (typeof document === 'undefined') {
		t.skip();
	} else {
		t.notOk(isArrowFunction(document.all));
	}
	t.end();
});

test('returns false for non-arrow function with faked toString', function (t) {
	var func = function () {};
	func.toString = function () { return '() => {}'; };

	t.notEqual(String(func), Function.prototype.toString.call(func), 'test function has faked toString that is different from default toString');
	t.notOk(isArrowFunction(func), 'non-arrow function with faked toString is not an arrow function');
	t.end();
});

test('returns true for arrow function with faked toString', function (t) {
	var func = getFromSource('() => {}');
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

test('returns true for arrow functions', function (t) {
	var fns = getAllFromSource([
		'(a, b) => a * b',
		'() => 42',
		'() => function () {}',
		'() => x => x * x',
		'y => x => x * x',
		'x => x * x',
		'x => { return x * x; }',
		'(x, y) => { return x + x; }',
		'(a = Math.random(10)) => {}',
		'(a = function () {\n			if (Math.random() < 0.5) { return 42; }\n			return "something else";\n}) => a()'
	]);

	t.plan(fns.length);
	forEach(fns, function (fn) {
		t.ok(isArrowFunction(fn), String(fn) + ' is arrow function');
	});
	t.end();
});

test('returns true for async arrow functions', function (t) {
	var fns = getAllFromSource([
		'async (a, b) => a * b',
		'async x => {}',
		'async () => {}',
		'async () => { function f() {} }'
	]);

	t.plan(fns.length);
	forEach(fns, function (fn) {
		t.ok(isArrowFunction(fn), String(fn) + ' is async arrow function');
	});
	t.end();
});

test('returns false for async non-arrow functions', function (t) {
	var fns = getAllFromSource([
		'async function () {}',
		'async function foo() {}',
		'async function () { "=>" }',
		'async function foo() { "=>" }'
	]);

	t.plan(fns.length);
	forEach(fns, function (fn) {
		t.notOk(isArrowFunction(fn), String(fn) + ' is async non-arrow function');
	});
	t.end();
});

test('returns false for generator functions', function (t) {
	var fns = getAllFromSource([
		'function* () { var x = yield; return x || 42; }',
		'function* gen() { var x = yield; return x || 42; }',
		'({ *       concise() { var x = yield; return x || 42; } }).concise'
	]);

	t.plan(fns.length);
	forEach(fns, function (fn) {
		t.notOk(isArrowFunction(fn), String(fn) + ' is async non-arrow function');
	});
	t.end();
});

test('returns false for async generator functions', function (t) {
	var fns = getAllFromSource([
		'async function* () {}',
		'async function* () { yield "=>" }'
	]);

	t.plan(fns.length);
	forEach(fns, function (fn) {
		t.notOk(isArrowFunction(fn), String(fn) + ' is async non-arrow function');
	});
	t.end();
});

test('returns true for arrow function properties', function (t) {
	var fns = getAllFromSource([
		'({ prop: () => {} }).prop',
		'({ prop: async () => {} }).prop',
		'({ prop: () => { function x() { } } }).prop',
		'({ prop: x => { function x() { } } }).prop',
		'({ function: () => {} }).function',
		'({ "": () => {} })[""]'
	]);

	t.plan(fns.length);
	forEach(fns, function (fn) {
		t.ok(isArrowFunction(fn), String(fn) + ' is arrow prop');
	});
	t.end();
});

test('returns false for non-arrow function properties', function (t) {
	var fns = getAllFromSource([
		'({ prop: function () {} }).prop',
		'({ prop: async function () {} }).prop',
		'({ prop: function* () {} }).prop',
		'({ prop: async function* () {} }).prop',
		'({ prop: function () { () => {} } }).prop',
		'({ "=>": function () {} })["=>"]',
		'({ "": function () {} })[""]'
	]);

	t.plan(fns.length);
	forEach(fns, function (fn) {
		t.notOk(isArrowFunction(fn), String(fn) + ' is non-arrow prop');
	});
	t.end();
});

test('returns false for methods', function (t) {
	var fns = getAllFromSource([
		'({ method() {} }).method',
		'({ async method() {} }).method',
		'({ method() {} }).method',
		'({ async *method() {} }).method',
		'({ method() { return "=>" } }).method',
		'({ method() { () => {} } }).method',
		'({ "=>"() {} })["=>"]',
		'({ ""() {} })[""]'
	]);

	t.plan(fns.length);
	forEach(fns, function (fn) {
		t.notOk(isArrowFunction(fn), String(fn) + ' is method');
	});
	t.end();
});

test('returns false for classes', function (t) {
	var fns = getAllFromSource([
		'class {}',
		'class X { }',
		'class { "=>" }',
		'class X { m() { return "=>" } }',
		'class X { p = () => {} }'
	]);

	t.plan(fns.length);
	forEach(fns, function (fn) {
		t.notOk(isArrowFunction(fn), String(fn) + ' is class');
	});
	t.end();
});

test('https://github.com/inspect-js/is-arrow-function/issues/26', function (t) {
	// False positive on object methods with arrow functions inside
	var x = getFromSource('{\n		foo() {\n			return 42\n		},\n		bar() {\n			return (() => 10)()\n		},\n		buz() {\n			// if this was an arrow function, it would have included => in it\n			return 123\n		},\n	}');
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

	var fns = getAllFromSource([
		'(a = Math.random(10)) => {}',
		'(a = function () {\n		if (Math.random() < 0.5) {\n			return 42;\n		}\n		return "something else";\n	}) => a()'
	]);

	t.plan(fns.length);
	forEach(fns, function (fn) {
		t.ok(isArrowFunction(fn), String(fn) + ' is arrow');
	});
	t.end();
});

test('corner cases', function (t) {
	var arrowFns = getAllFromSource([
		'(a = function () {}) => a()',
		'({\n			"function name": () => { }\n		})["function name"]',
		'({\n		 	function文: () => { }\n		}).function文',
		'/* function */x => { }',
		'x/* function */ => { }',
		'/* function */() => { }',
		'()/* function */ => { }',
		'(/* function */) => {}'
	]);

	var nonArrowFns = getAllFromSource([
		'function (a = () => {}) {\n		return a();\n	}',
		'({\n			"() => {}"() {}\n		})["() => {}"]',
		'function/* => */() { }',
		'function name/* => */() { }',
		'function/* => */name() { }',
		'function(/* => */) { }',
		'function name(/* => */) { }'
	]);

	t.plan(arrowFns.length + nonArrowFns.length);

	forEach(arrowFns, function (fn) {
		t.ok(isArrowFunction(fn), String(fn) + ' is arrow fn');
	});

	forEach(nonArrowFns, function (fn) {
		t.notOk(isArrowFunction(fn), String(fn) + ' is not arrow fn');
	});

	t.end();
});
