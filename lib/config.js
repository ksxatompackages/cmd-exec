
(function (module) {
	'use strict';

	var getActualKey = (key) => `cmd-exec.${key}`;

	class Config {

		get(key) {
			return atom.config.get(getActualKey(key));
		}

		set(key, val) {
			return atom.config.set(getActualKey(key), val);
		}

		forKey(key) {
			return new KeyConfig(key);
		}

		observe(key, observer) {
			return atom.config.observe(getActualKey(key), observer);
		}

		onDidChange(key, callback) {
			return atom.config.onDidChange(getActualKey(key), callback);
		}

	}

	class KeyConfig {

		constructor(key) {
			if (typeof key !== 'string') {
				throw new TypeError("Invalid type of parameter 'key'.");
			}
			this.key = key;
		}

		get value() {
			return config.get(this.key);
		}

		set value(val) {
			config.set(this.key, val);
		}

		observe(observer) {
			return config.observe(this.key, observer);
		}

		onDidChange(callback) {
			return config.onDidChange(this.key, callback);
		}

		get() {
			return this.value;
		}

		set(value) {
			this.value = value;
		}

		valueOf() {
			return this.value;
		}

	}

	var config = module.exports = new Config();

})(module);
