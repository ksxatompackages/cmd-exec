
(function (module) {
	'use strict';

	var registerPaneItem = require('ksxatomsupports').pane_view.registerPaneItem;
	var createIdListFromURL = require('../lib/create-list.js').fromURL;
	const PKG_NAME = require('../package.json').name;

	module.exports = function createView(name, disposable, id, param) {

		var pathoe = `${__dirname}/view-${name}`;
		var xmlpath = `${pathoe}.xml`;
		var jspath = `${pathoe}.js`;
		var uri = `cmd-exec://${name}${id ? `?id=${id}` : ``}`;

		return createView.create(pathoe, xmlpath, jspath, uri, disposable, param);

	}

	module.exports.create = (pathoe, xmlpath, jspath, uri, disposable, param) => {

		var current = (callback) => {
			load(() => {
				current = show;
				show(callback);
			});
		}

		return main;

		function main(callback) {
			current(typeof callback === 'function' ? callback : () => {});
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

		function show(callback) {
			callback(atom.workspace.open(uri, new OpenPaneItemOptions()));
		}

	}

	class OpenPaneItemOptions {
		constructor() {
			this.split = atom.config.get(`${PKG_NAME}.pane-item-position`);
		}
	}

})(module);
