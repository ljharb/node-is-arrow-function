// @ts-check

'use strict';

/**
 * @typedef {{
 * 	source: string
 * 	minNodeVersion: number
 * }} SourceConfig
 */

/** @typedef {(string | SourceConfig)[]} Sources */

var getNodeVersion = function () {
	if (typeof process === 'object' && process.versions && process.versions.node) {
		var major = process.versions.node.match(/^\d+/);

		if (!major) {
			return -1;
		}

		return Number(major[0]);
	}

	return -1;
};

var MODERN_NODE_CUTOFF = 12;
var CURRENT_NODE_VERSION = getNodeVersion();

/**
 * @param {string | SourceConfig} objOrSource
 * @returns {any}
 */
var parseFromSource = function (objOrSource) {
	var minNodeVersion = -1;
	var source = objOrSource;

	if (typeof objOrSource !== 'string') {
		minNodeVersion = objOrSource.minNodeVersion;
		source = objOrSource.source;
	}

	if (CURRENT_NODE_VERSION < minNodeVersion) {
		return null;
	}

	try {
		// eslint-disable-next-line no-new-func
		return new Function('return (' + source + ')')();
	} catch (e) {
		if (CURRENT_NODE_VERSION >= MODERN_NODE_CUTOFF) {
			// anything we pass to this function should be valid syntax as of modern node versions
			if (e instanceof SyntaxError) {
				throw new SyntaxError('Invalid source: ' + source);
			}
			throw e;
		}
		// if invalid syntax in older versions, we simply ignore them
		return null;
	}
};

/**
 * @param {Sources} objsOrSources
 */
var parseAllFromSource = function (objsOrSources) {
	var objs = [];
	for (var i = 0; i < objsOrSources.length; ++i) {
		var obj = parseFromSource(objsOrSources[i]);
		if (obj) {
			objs.push(obj);
		}
	}
	return objs;
};

/** @type {Sources} */
var syncNonArrowFunctions = [
	'function () {}',
	'function foo() {}',
	'function foo() { "=>"; }',
	'function foo() { () => {} }',
	'function (a = () => {}) {\n		return a();\n	}',
	{
		minNodeVersion: 10,
		source: '({\n			"() => {}"() {}\n		})["() => {}"]'
	},
	'function/* => */() { }',
	'function name/* => */() { }',
	'function/* => */name() { }',
	'function(/* => */) { }',
	'function name(/* => */) { }',

	'({ prop: function () {} }).prop',
	'({ prop: function () { () => {} } }).prop',
	'({ "=>": function () {} })["=>"]',
	'({ "": function () {} })[""]'
];

/** @type {Sources} */
var syncArrowFunctions = [
	'() => {}',
	'(a, b) => a * b',
	'() => 42',
	'() => function () {}',
	'() => x => x * x',
	'y => x => x * x',
	'x => x * x',
	'x => { return x * x; }',
	'(x, y) => { return x + x; }',
	'(a = Math.random(10)) => {}',
	'(a = function () {\n			if (Math.random() < 0.5) { return 42; }\n			return "something else";\n}) => a()',
	'(a = function () {}) => a()',
	'({\n			"function name": () => { }\n		})["function name"]',
	'({\n		 	function文: () => { }\n		}).function文',
	'/* function */x => { }',
	'x/* function */ => { }',
	'/* function */() => { }',
	'()/* function */ => { }',
	'(/* function */) => {}',

	'({ prop: () => {} }).prop',
	'({ prop: () => { function x() { } } }).prop',
	'({ prop: x => { function x() { } } }).prop',
	'({ function: () => {} }).function',
	'({ "": () => {} })[""]'
];
/** @type {Sources} */
var asyncNonArrowFunctions = [
	'async function () {}',
	'async function foo() {}',
	'async function () { "=>" }',
	'async function foo() { "=>" }',

	'({ prop: async function () {} }).prop'
];
/** @type {Sources} */
var asyncArrowFunctions = [
	'async (a, b) => a * b',
	'async x => {}',
	'async () => {}',
	'async () => { function f() {} }',

	'({ prop: async () => {} }).prop'
];
/** @type {Sources} */
var syncGeneratorFunctions = [
	'function* () { var x = yield; return x || 42; }',
	'function* gen() { var x = yield; return x || 42; }',
	'({ *       concise() { var x = yield; return x || 42; } }).concise',
	'({ prop: function* () {} }).prop'
];
/** @type {Sources} */
var asyncGeneratorFunctions = [
	'async function* () {}',
	'async function* () { yield "=>" }',
	'({ prop: async function* () {} }).prop'
];
/** @type {Sources} */
var syncMethods = [
	'({ method() {} }).method',
	'({ method() {} }).method',
	'({ method() { return "=>" } }).method',
	'({ method() { () => {} } }).method',
	{
		minNodeVersion: 10,
		source: '({ "=>"() {} })["=>"]'
	},
	{
		minNodeVersion: 10,
		source: '({ "x =>"() {} })["x =>"]'
	},
	{
		minNodeVersion: 10,
		source: '({ ""() {} })[""]'
	},
	{
		minNodeVersion: 10,
		source: '(() => { var obj1 = { "x => {}": "a" }; var obj2 = { [obj1["x => {}"]]() {} }; return obj2.a })()'
	},
	{
		minNodeVersion: 10,
		source: '(() => { var obj1 = { "x => {}": "a" }; var obj2 = { [obj1[\'x => {}\']]() {} }; return obj2.a })()'
	},
	{
		minNodeVersion: 10,
		source: '(() => { var obj1 = { "x => {}": "a" }; var obj2 = { [obj1[`x => {}`]]() {} }; return obj2.a })()'
	}
];
/** @type {Sources} */
var asyncMethods = [
	'({ async method() {} }).method',
	'({ async method() {} }).method',
	'({ async method() { return "=>" } }).method',
	'({ async method() { () => {} } }).method',
	{
		minNodeVersion: 10,
		source: '({ async "=>"() {} })["=>"]'
	},
	{
		minNodeVersion: 10,
		source: '({ async "x =>"() {} })["x =>"]'
	},
	{
		minNodeVersion: 10,
		source: '({ async ""() {} })[""]'
	}
];
/** @type {Sources} */
var syncGeneratorMethods = [
	'({ *method() {} }).method',
	'({ *method() {} }).method',
	'({ *method() { return "=>" } }).method',
	'({ *method() { () => {} } }).method',
	{
		minNodeVersion: 10,
		source: '({ *"=>"() {} })["=>"]'
	},
	{
		minNodeVersion: 10,
		source: '({ *"x =>"() {} })["x =>"]'
	},
	{
		minNodeVersion: 10,
		source: '({ *""() {} })[""]'
	}
];
/** @type {Sources} */
var asyncGeneratorMethods = [
	'({ async *method() {} }).method',
	'({ async *method() {} }).method',
	'({ async *method() { return "=>" } }).method',
	'({ async *method() { () => {} } }).method',
	{
		minNodeVersion: 10,
		source: '({ async *"=>"() {} })["=>"]'
	},
	{
		minNodeVersion: 10,
		source: '({ async *"x =>"() {} })["x =>"]'
	},
	{
		minNodeVersion: 10,
		source: '({ async *""() {} })[""]'
	}
];
/** @type {Sources} */
var classes = [
	'class {}',
	'class X { }',
	'class { "=>" }',
	'class X { m() { return "=>" } }',
	'class X { p = () => {} }'
];

var helpers = {
	parseFromSource: parseFromSource,
	parseAllFromSource: parseAllFromSource
};

var fixtures = {
	syncNonArrowFunctions: parseAllFromSource(syncNonArrowFunctions),
	syncArrowFunctions: parseAllFromSource(syncArrowFunctions),
	asyncNonArrowFunctions: parseAllFromSource(asyncNonArrowFunctions),
	asyncArrowFunctions: parseAllFromSource(asyncArrowFunctions),
	syncGeneratorFunctions: parseAllFromSource(syncGeneratorFunctions),
	asyncGeneratorFunctions: parseAllFromSource(asyncGeneratorFunctions),
	syncMethods: parseAllFromSource(syncMethods),
	asyncMethods: parseAllFromSource(asyncMethods),
	syncGeneratorMethods: parseAllFromSource(syncGeneratorMethods),
	asyncGeneratorMethods: parseAllFromSource(asyncGeneratorMethods),
	classes: parseAllFromSource(classes)
};

module.exports = {
	helpers: helpers,
	fixtures: fixtures
};
