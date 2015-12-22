
function ConfigView() {
	'use strict';

	var CompositeDisposable = require('atom').CompositeDisposable;
	var utils = require('../lib/utils.js');
	var createView = require('../view/create-view.js');

	const PKG_NAME = require('../package.json').name;

	var configview = this;

	var viewid = 0;

	configview.handleChildProcess = (descriptor, param, subscriptions, onerror) => {

		param.oncalled((child) => {
			var disposable = new CompositeDisposable();
			var view = createView('console', disposable, viewid++, {
				fromConfig: descriptor,
				fromScript: param,
				process: child,
				disposable: disposable,
				getView: () => view,
				subscriptions: subscriptions,
				handlePromise: (handle) => handlePromise.all.push(handle),
				services: new ViewerService(descriptor, param)
			});
			view((promise) => promise.then(handlePromise), new OpenPaneItemOptions(descriptor));
			subscriptions.add(disposable);
			typeof onerror === 'function' && child.on('error', handleError);
		});

		var handlePromise = (paneitem) => handlePromise.all.forEach((call) => call(paneitem));
		handlePromise.all = [];

		var handleError = (error) => {
			handlePromise.all.push((paneitem) => paneitem.destroy());
			setTimeout(() => onerror(error));
		};

	};

	configview.createForChild = (descriptor, param) => new ViewerService(descriptor, param);

	configview.view = () => {};

	class OpenPaneItemOptions {
		constructor(descriptor) {
			var split = descriptor.paneItemPosition;
			this.split = split === undefined ? atom.config.get(`${PKG_NAME}.pane-item-position`) : split;
		}
	}

	class ViewerService {

		constructor(descriptor, param) {
			this.fromConfig = descriptor;
			this.fromScript = param;
		}

		notice(type, title, options) {
			atom.notifications.add(type, title, options);
		}

		dialog(title, message, buttons) {
			return atom.applicationDelegate.confirm({
				message: title,
				detailedMessage: message,
				buttons: buttons
			});
		}

		alert(message) {
			tryCatch.message(alert, message);
		}

		prompt(message) {
			return tryCatch.message(prompt, message);
		}

		confirm() {
			return tryCatch.message(confirm, message);
		}

	}

	function tryCatch(callback) {
		utils.tryCatch(callback, handleError);
	}

	tryCatch.message = (callback, message) => tryCatch(() => callback(message));

	function handleError(error) {
		console.warn(error);
		utils.error(`${error}`, `${error.stack}`);
	}

}

module.exports = new ConfigView();
