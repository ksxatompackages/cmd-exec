
(function (module, undefined) {
	'use strict';

	var registerPaneItem = require('ksxatomsupports').pane_view.registerPaneItem;
	var createIdListFromURL = require('../lib/create-list.js').fromURL;

	module.exports = function createView(name, disposable, id, param) {

		var pathoe = `${__dirname}/view-${name}`;
		var xmlpath = `${pathoe}.xml`;
		var jspath = `${pathoe}.js`;
		var uri = `cmd-exec://${name}${id ? `?id=${id}` : ``}`;

		return createView.create(pathoe, xmlpath, jspath, uri, disposable, param);

	}

	module.exports.create = (pathoe, xmlpath, jspath, uri, disposable, param) => {

		var current = (...args) => {
			load(() => {
				current = show;
				show(...args);
			});
		}

		return main;

		function main(callback, ...args) {
			current(typeof callback === 'function' ? callback : () => {}, ...args);
		}

		function load(onloadend) {
			var list = createIdListFromURL(xmlpath, (error, list) => {
				if (error) {
					throw error;
				}
				disposable.add(registerPaneItem(list.htmlElement, uri, {title: list.title.textContent}));
				setTimeout(require(jspath).bind(null, list, param));
				setTimeout(onloadend);
			});
		}

		function show(callback, options) {
			callback(atom.workspace.open(uri, options));
		}

	}

})(module);
