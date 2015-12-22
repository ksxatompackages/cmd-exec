
((module) => {

	module.exports = {

		activate: () => setTimeout(() => {
			var CompositeDisposable = require('atom').CompositeDisposable;
			subscriptions = new CompositeDisposable();
			subscriptions.add(atom.contextMenu.add({
				'.cmd-exec .text-copiable': [
					{
						label: 'Copy',
						command: 'cmd-exec:copy'
					}
				]
			}));
		}),

		deactivate: () => setTimeout(() => subscriptions.dispose())

	};

	var subscriptions;

})(module);
