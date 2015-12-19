
(function module(module) {
	'use strict';

	var utils = require('./utils.js');

	var isIterable = utils.isIterable;
	var forOf = utils.forOf;
	var _key_iterator = Symbol.iterator;

	module.exports = (commands, callback) =>
		new CommandMap(commands).forEach(callback);

	class CommandMap {

		constructor(list) {
			if (list === undefined || list === null) {
				this.list = [];
				return;
			}
			if (!isIterable(list)) {
				SubTypeError.cause(`Parameter 'list'`, `an array`, list);
			}
			this.list = list;
		}

		* [_key_iterator]() {
			for (let desc of this.list) {
				yield * iterate(desc);
			}
		}

		forEach(callback) {
			for (let element of this) {
				callback(element, this);
			}
		}

	}

	function * iterate(desc, generator) {

		var target = desc.target;

		if (isIterable(target)) {
			yield * forOf.gen(target, bridge);
			return;
		}

		if (typeof target !== 'string') {
			yield null;
			return;
		}

		yield * bridge(target);

		function * bridge(target) {
			var data = desc.data;
			if (typeof data !== 'object' || data instanceof Array) {
				SubTypeError.cause(`'desc.data'`, `an object`, data);
			}
			for (let command in data) {
				yield new iterate.Element(target, command, data[command], data);
			}
		}

	}

	iterate.Element = function (target, command, content, data) {
		var element = this;
		element.target = target;
		element.command = command;
		element.content = content;
		element.data = data;
	}

	class SubTypeError extends TypeError {

		constructor(varname, righttype, object) {
			var stringified = JSON.stringify(object);
			super(`${varname} must be ${righttype}: ${stringified}`);
			this.varname = varname;
			this.righttype = righttype;
			this.object = object;
			this.stringified = stringified;
		}

		cause() {
			throw this;
		}

		static create(varname, righttype, object) {
			return new SubTypeError(varname, righttype, object);
		}

		static cause(varname, righttype, object) {
			SubTypeError.create(varname, righttype, object).cause();
		}

	}

})(module);
