
(function (module) {
	'use strict';

	var _key_iterator = Symbol.iterator;

	module.exports = {
		dialog: dialog,
		notice: notice,
		info: notice('info'),
		warn: notice('warning'),
		error: notice('error'),
		chainFunction: chainFunction,
		isIterable: isIterable,
		repeat: repeat,
		some: some,
		forOf: forOf,
		makeSubProperty: makeSubProperty,
		ternary: ternary,
		makeDefaultProperty: makeDefaultProperty,
		deepJoin: deepJoin,
		tryCatch: tryCatch,
		tryCatchOf: tryCatchOf,
		throwError: throwError,
		createMerelyObject: createMerelyObject,
		clearChildren: clearChildren
	};

	function dialog(title) {
		return (message) =>
			setTimeout(alert.bind(null, message, title));
	}

	function notice(type) {
		return (message, detail) =>
			atom.notifications.add(type, message, {detail: detail});
	}

	function chainFunction(fna, fnb) {
		return (arg) => new chainFunction.Return(fna(arg), fnb(arg));
	}

	chainFunction.array = (fnlist) => {
		var fn = () => chainFunction.NOT_AN_ELEMENT;
		for (let fne of fnlist) {
			ensure(fne);
			fn = chainFunction(fn, fne);
		}
		function ensure(fn) {
			if (typeof fn !== 'function') {
				let error = new TypeError(`An element of parameter 'fnlist' is not a function: ${typeof fn} ${tryConvert.forString(fn)}`);
				error.details = {element: fn, array: fnlist};
				throw error;
			}
		}
		return fn;
	}

	chainFunction.Return = class Return extends Array {

		constructor(a, b) {
			if (a instanceof Return) {
				a.push(b);
				return a;
			} else {
				super();
				this.push(a);
				this.push(b);
			}
		}

		push(element) {
			return element === chainFunction.NOT_AN_ELEMENT ? this.length : super.push(element);
		}

	}

	chainFunction.NOT_AN_ELEMENT = Symbol('NOT_AN_ELEMENT');

	function isIterable(object) {
		return typeof object === 'object' && typeof object[_key_iterator] === 'function';
	}

	function tryConvert(value, type) {
		return tryCatch(() => type(value), (error) => error);
	}

	tryConvert.forString = (value) => tryConvert(value, String);

	tryConvert.forNumber = (value) => tryConvert(value, Number);

	function repeat(action) {
		return new repeat.Return(action);
	}

	repeat.Return = class {

		constructor(action) {
			if (typeof action !== 'function') {
				throw new TypeError(`Parameter 'action' must be a function`)
			}
			this.action = action.bind(null);
		}

		until(isstop) {
			do {
				this.action();
			} while (!isstop());
		}

		times(count) {
			while (count) {
				action(count);
				--count;
			}
		}

	};

	function some(iterable, element, check) {
		for (let el of iterable) {
			if (check(element, el)) {
				return true;
			}
		}
		return false;
	}

	some.equal = (values, value) =>
		some(values, value, some.equal.check);

	some.equal.check = (a, b) => a === b;

	some.equal.typeof = (types, value) =>
		some.equal(types, typeof value);

	some.equiv = (iterable, element, get) =>
		some(iterable, element, equiv.checkOf(get));

	some.equiv.checkOf = (get) =>
		(a, b) => a === get(b);

	some.equiv.forType = (iterable, element, types) =>
		some.equiv(iterable, element, some.equiv.forType.get);

	some.equiv.forType.get = (value) => typeof value;

	function forOf(iterable, callback) {

		var isiter = isIterable(iterable);
		var isfunc = typeof callback === 'function';

		if (isiter && isfunc) {
			return forOf.for.both(iterable, callback);
		}

		if (isiter) {
			return forOf.for.iterable(iterable);
		}

		if (isfunc) {
			return forOf.for.callback(callback);
		}

		throw new TypeError(`Invalid type of arguments.`);

	}

	forOf.gen = function * (iterable, generator) {
		for (let element of iterable) {
			yield * generator(element, iterable);
		}
	}

	forOf.gen.fromCallback = function * (iterable, callback) {
		yield * forOf.gen(iterable, forOf.gen.create(callback));
	}

	forOf.gen.create = (callback) =>
		function * (element, iterable) {
			yield callback(element, iterable);
		}

	forOf.for = (iterable, callback) => {
		for (let element of iterable) {
			callback(element, iterable);
		}
	}

	forOf.for.both = (iterable, callback) =>
		forOf.for.bind(null, iterable, callback);

	forOf.for.iterable = (iterable) =>
		(callback) => forOf.for(iterable, callback);

	forOf.for.callback = (callback) =>
		(iterable) => forOf.for(iterable, callback);

	function makeSubProperty(object, pname, subpname, subval) {
		var sub = object[pname];
		if (some.typeof(['object', 'function'], sub)) {
			sub[subpname] = subval;
		} else {
			object[pname] = {[subpname]: subval};
		}
	}

	function ternary(is, iftrue, iffalse) {
		return (is() ? iftrue : iffalse)();
	}

	ternary.if = (is, act, val) =>
		ternary(is, act, () => val);

	ternary.unless = (is, act, val) =>
		ternary(is, () => val, act);

	ternary.ternary = (is, valiftrue, valiffalse) =>
		ternary(is, () => valiftrue, () => valiffalse);

	ternary.correct = (val, iswrong, getright) =>
		ternary(() => iswrong(val()), getright, val);

	ternary.correct.typeof = (val, wrongtypes, getright) =>
		ternary.correct(val, some.equal.typeof.bind(null, wrongtypes), getright);

	ternary.correct.valof = (val, wrongs, getright) =>
		ternary.correct(val, some.equal.bind(null, wrongs), getright);

	function makeDefaultProperty(object, pname, iswrong, right) {
		if (iswrong(object[pname])) {
			object[pname] = right;
		}
	}

	makeDefaultProperty.typeof = (object, pname, wrongtypes, right) =>
		makeDefaultProperty(object, pname, some.equal.typeof.bind(null, wrongtypes), right);

	makeDefaultProperty.belongs = (object, pname, wrongs, right) =>
		makeDefaultProperty(object, pname, some.equal.bind(null, wrongs), right);

	function deepJoin(array, separator) {
		return array.map((element) => element instanceof Array ? deepJoin(element, separator) : element).join(separator);
	}

	deepJoin.fromAny = (val, sep) => deepJoin([val], sep);

	function tryCatch(callback, onerror, onsuccess, param) {

		var result;

		try {
			result = callback(param)
		} catch (error) {
			return typeof onerror === 'function' && onerror(error, param);
		}

		typeof onsuccess === 'function' && onsuccess(result, param);

		return result;

	}

	tryCatch.of = tryCatchOf;

	function tryCatchOf(callback, onerror, onsuccess) {

		if (typeof callback !== 'function') {
			throw new TypeError(`Parameter 'callback' must be a function.`);
		}

		return (param) =>
			tryCatch(callback, onerror, onsuccess, param);

	}

	tryCatchOf.setTimeout = (callback, timeout) => {
		setTimeout((param) => tryCatch(callback, result.onerror, result.onsuccess, param), timeout);
		var result = new tryCatchOf.setTimeout.Return();
		return result;
	};

	tryCatchOf.setTimeout.Return = class {

		constructor() {
			var res = this;
			res.then = (handle) => (res.onsuccess = handle, res);
			res.catch = (handle) => (res.onerror = handle, res);
		}

		onsuccess() {}

		onerror(error) {
			throw error;
		}

	};

	function throwError(error) {
		throw error;
	}

	function createMerelyObject() {
		return new MerelyObject();
	}

	class MerelyObject {

		constructor() {
			this.object = Object.create(null);
		}

		assign(object) {
			Object.assign(this.object, object);
			return this;
		}

		defineProperty(pname, desc) {
			Object.defineProperty(this.object, pname, desc);
			return this;
		}

		makeData(pname, value, writable, enumerable, configurable) {
			this.defineProperty(pname, {
				value: value,
				writable: writable,
				enumerable: enumerable,
				configurable: configurable
			});
			return this;
		}

		makeAccessor(pname, get, set, enumerable, configurable) {
			this.defineProperty({
				get: get,
				set: set,
				enumerable: enumerable,
				configurable: configurable
			});
			return this;
		}

		newFrozen() {
			return Object.freeze(this.createChild());
		}

		createChild() {
			return Object.create(this.object);
		}

		createClass() {
			base.prototype = this.createChild();
			return class extends base {};
			function base() {}
		}

	}

	createMerelyObject.MerelyObject = MerelyObject;

	function clearChildren(element) {
		for ( ; ; ) {
			let child = element.lastChild;
			if (child) {
				child.remove();
			} else {
				break;
			}
		}
	}

})(module);
