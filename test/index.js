'use strict';

const test = require('tape');
const isArrowFunction = require('../index');

test('returns false for non-functions', function (t) {
	const nonFuncs = [
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
		42,
		new Date(0),
	];

	t.plan(nonFuncs.length);
	for (const nonFunc of nonFuncs) {
		t.notOk(isArrowFunction(nonFunc), nonFunc + ' is not a function');
	}
	t.end();
});

test('returns false for non-arrow functions', function (t) {
	const fns = [
		function () {},
		function foo() {},
		function foo() { '=>' },
		function foo() { () => {} },
	]

	t.plan(fns.length);
	for (const fn of fns) {
		t.notOk(isArrowFunction(fn), String(fn) + ' is not an arrow function');
	}
	t.end();
});

test('returns false for built-ins', function (t) {
	const fns = [
		setTimeout,
		Date,
		Date.now,
		Promise,
		Promise.all,
		Intl.Collator,
		eval,
		globalThis.eval,
	]

	t.plan(fns.length);
	for (const fn of fns) {
		t.notOk(isArrowFunction(fn), String(fn) + ' is a built-in');
	}

	t.end();
});

test('returns false for alert', function (t) {
	if (typeof globalThis.alert !== 'function') {
		t.skip();
	} else {
		t.notOk(isArrowFunction(globalThis.alert));
	}
	t.end();
});

test('returns false for document.all', function (t) {
	if (typeof document === 'undefined') {
		t.skip();
	} else {
		t.notOk(isArrowFunction(document.all));
	}
	t.end();
});

test('returns false for non-arrow function with faked toString', function (t) {
	const func = function () {};
	func.toString = function () { return '() => {}'; };

	t.notEqual(String(func), Function.prototype.toString.call(func), 'test function has faked toString that is different from default toString');
	t.notOk(isArrowFunction(func), 'non-arrow function with faked toString is not an arrow function');
	t.end();
});

test('returns true for arrow function with faked toString', function (t) {
	const func = () => {};
	func.toString = function () { return 'function () {}'; };

	t.notEqual(String(func), Function.prototype.toString.call(func), 'test function has faked toString that is different from default toString');
	t.ok(isArrowFunction(func), 'arrow function with faked toString is an arrow function');
	t.end();
});

test('returns true for arrow functions', function (t) {
	const fns = [
		(a, b) => a * b,
		() => 42,
		() => function () {},
		() => x => x * x,
		y => x => x * x,
		x => x * x,
		x => { return x * x; },
		(x, y) => { return x + x; },
		(a = Math.random(10)) => {},
		(a = function () {
			if (Math.random() < 0.5) { return 42; }
			return "something else";
		}) => a(),
	];

	t.plan(fns.length);
	for (const fn of fns) {
		t.ok(isArrowFunction(fn), String(fn) + ' is arrow function');
	}
	t.end();
});

test('returns true for async arrow functions', function (t) {
	const fns = [
		async (a, b) => a * b,
		async x => {},
		async () => {},
		async () => { function f() {} },
	];

	t.plan(fns.length);
	for (const fn of fns) {
		t.ok(isArrowFunction(fn), String(fn) + ' is async arrow function');
	}
	t.end();
});

test('returns false for async non-arrow functions', function (t) {
	const fns = [
		async function () {},
		async function foo() {},
		async function () { '=>' },
		async function foo() { '=>' },
	];

	t.plan(fns.length);
	for (const fn of fns) {
		t.notOk(isArrowFunction(fn), String(fn) + ' is async non-arrow function');
	}
	t.end();
});

test('returns false for generator functions', function (t) {
	const fns = [
		function* () { const x = yield; return x || 42; },
		function* gen() { const x = yield; return x || 42; },
		({ *       concise() { const x = yield; return x || 42; } }).concise,
	];

	t.plan(fns.length);
	for (const fn of fns) {
		t.notOk(isArrowFunction(fn), String(fn) + ' is async non-arrow function');
	}
	t.end();
});

test('returns false for async generator functions', function (t) {
	const fns = [
		async function* () {},
		async function* () { yield '=>' },
	];

	t.plan(fns.length);
	for (const fn of fns) {
		t.notOk(isArrowFunction(fn), String(fn) + ' is async non-arrow function');
	}
	t.end();
});

test('returns true for arrow function properties', function (t) {
	const fns = [
		({
			prop: () => {}
		}).prop,
		({
			prop: async () => {}
		}).prop,
		({
			prop: () => { function x() { } }
		}).prop,
		({
			prop: x => { function x() { } }
		}).prop,
		({
			function: () => {}
		}).function,
		({
			'': () => {}
		})[''],
	];

	t.plan(fns.length);
	for (const fn of fns) {
		t.ok(isArrowFunction(fn), String(fn) + ' is arrow prop');
	}
	t.end();
});

test('returns false for non-arrow function properties', function (t) {
	const fns = [
		({
			prop: function () {}
		}).prop,
		({
			prop: async function () {}
		}).prop,
		({
			prop: function* () {}
		}).prop,
		({
			prop: async function* () {}
		}).prop,
		({
			prop: function () { () => {} }
		}).prop,
		({
			'=>': function () {}
		})['=>'],
		({
			'': function () {}
		})[''],
	];

	t.plan(fns.length);
	for (const fn of fns) {
		t.notOk(isArrowFunction(fn), String(fn) + ' is non-arrow prop');
	}
	t.end();
});

test('returns false for methods', function (t) {
	const fns = [
		({
			method() {}
		}).method,
		({
			async method() {}
		}).method,
		({
			*method() {}
		}).method,
		({
			async *method() {}
		}).method,
		({
			method() { return '=>' }
		}).method,
		({
			method() { () => {} }
		}).method,
		({
			'=>'() {}
		})['=>'],
		({
			''() {}
		})[''],
	];

	t.plan(fns.length);
	for (const fn of fns) {
		t.notOk(isArrowFunction(fn), String(fn) + ' is method');
	}
	t.end();
});

test('returns false for classes', function (t) {
	const fns = [
		class {},
		class X { },
		class { '=>' },
		class X { m() { return '=>' } },
		class X { p = () => {} },
	];

	t.plan(fns.length);
	for (const fn of fns) {
		t.notOk(isArrowFunction(fn), String(fn) + ' is class');
	}
	t.end();
});

test('https://github.com/inspect-js/is-arrow-function/issues/26', function (t) {
	// False positive on object methods with arrow functions inside
	const x = {
		foo() {
			return 42
		},
		bar() {
			return (() => 10)()
		},
		buz() {
			// if this was an arrow function, it would have included => in it
			return 123
		},
	};

	t.notOk(isArrowFunction(x.foo));
	t.notOk(isArrowFunction(x.bar));
	t.notOk(isArrowFunction(x.buz));

	t.end();
});

test('https://github.com/inspect-js/is-arrow-function/issues/15', function (t) {
	// False negative for arrow function with closing parenthesis in parameter list

	const arrow = (a = Math.random(10)) => {};
	t.ok(isArrowFunction(arrow));

	const arrow2 = (a = function () {
		if (Math.random() < 0.5) {
			return 42;
		}
		return "something else";
	}) => a();

	t.ok(isArrowFunction(arrow2));

	t.end();
});

test('corner cases', function (t) {
	t.ok(isArrowFunction((a = function () {}) => a()));

	t.notOk(isArrowFunction(function (a = () => {}) {
		return a();
	}));

	t.ok(isArrowFunction(({
		'function name': () => {}
	})['function name']));

	t.ok(isArrowFunction(({
		function文: () => { }
	})['function文']));

	t.notOk(isArrowFunction(({
		'() => {}'() {}
	})['() => {}']));

	t.end();
});
