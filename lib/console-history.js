
(function (module) {
	'use strict';

	class ConsoleHistory {

		constructor() {
			this.clear();
		}

		clear() {
			this.all = [''];
			this.current = 0;
		}

		get text() {
			return this.all[this.current] || '';
		}

		set text(val) {
			this.all[this.current] = String(val);
		}

		at(index) {
			return this.all[index] || '';
		}

		add(val) {
			var all = this.all;
			val = String(val);
			all[all.length - 1] === val || all.push(val);
			this.current = all.length;
		}

		up(editor) {
			this.current > 0 && --this.current;
			editor.setText(this.text);
		}

		down(editor) {
			this.current < this.all.length && ++this.current;
			editor.setText(this.text);
		}

	}

	module.exports = ConsoleHistory;

})(module);
