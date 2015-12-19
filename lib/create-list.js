
(function (module) {
	'use strict';

	var runInNewContext = require('vm').runInNewContext;
	var createMerelyObject = require('./utils.js').createMerelyObject;

	var evalExpr = (jscode, context) => runInNewContext(`(${jscode})`, context);

	var _key_list = Symbol('Elements from template');

	module.exports = {
		fromElement: fromElement,
		fromDocument: fromDocument,
		fromSource: fromSource,
		fromURL: fromURL,
		applyTemplate: applyTemplate,
		applyTemplateDeep: applyTemplateDeep,
		applyButtonFeature: applyButtonFeature,
		makeShowerButton: makeShowerButton,
		keyElementList: _key_list
	}

	function fromElement(element) {
		var list = Object.create(null);
		(function mapper(element) {
			var pname = element.id;
			if (pname) {
				list[pname] = element;
			}
			Array.from(element.children).forEach(mapper);
		})(element);
		return list;
	}

	function fromDocument(document) {
		return fromElement(document.documentElement);
	}

	function fromSource(source) {
		return fromDocument(new DOMParser().parseFromString(source, 'text/xml'));
	}

	function fromURL(url, callback) {
		return require('fs').readFile(url, 'utf8', (error, source) => callback(error, fromSource(source)));
	}

	function applyTemplate(target, source) {
		var content = document.importNode(source.content, true);
		var result = fromElement(content);
		target.insertBefore(content, null);
		return result;
	}

	function applyTemplateDeep(target, list) {
		return (function mapper(target) {
			var result = new Return();
			var sublist = null;
			var tname = target.getAttribute('import-template');
			if (tname) {
				var source = list[tname];
				if (source) {
					sublist = target[_key_list] = applyTemplate(target, source);
					Object.getOwnPropertyNames(sublist).forEach((id) => {
						var element = sublist[id];
						Object.assign(element, evalExpr(target.getAttribute(id)));
						result.sublists[id] = applyTemplateDeep(element, createMerelyObject().assign(list).assign(sublist).object);
					});
				}
			}
			result.elements = sublist;
			result.children = Array.from(target.children).map((child) => applyTemplateDeep(child, list));
			return result;
		})(target);
		function Return() {
			this.sublists = Object.create(null);
		}
	}

	function applyButtonFeature(target, list) {
		var id = target.getAttribute('show-hide');
		if (id) {
			let element = list[id];
			if (element instanceof HTMLElement) {
				makeShowerButton(target, element);
			} else {
				throw new TypeError(`Property 'id' of parameter 'list' is not an HTMLElement: id = ${id}`);
			}
		}
	}

	function makeShowerButton(shower, view) {
		turnShowerState();
		shower.addEventListener('click', () => {
			var hidden = view.hidden = !view.hidden;
			turnShowerState();
		}, false);
		function turnShowerState() {
			shower.textContent = view.hidden ? 'Show' : 'Hide';
		}
	}

})(module);
