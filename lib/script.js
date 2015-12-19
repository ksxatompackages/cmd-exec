
(function (module) {
	'use strict';

	var services = module.exports = {
		createHandle: createHandle
	};

	function createHandle(script, callback) {

		switch (typeof script) {

			case 'string':
				return createHandle.fromString(script, 'spawn', callback);

			case 'object':
				if (!script) {
					break;
				}
				if (script instanceof Array) {
					return createHandle.fromArray(script, callback);
				}
				return createHandle.fromString(script.path, script.type, callback);

			case 'undefined':
				break;

			default:
				require('./utils.js').warn(`This value has been ignored because its type is invalid`);

		}

		return () => {};

	}

	createHandle.fromString = function (path, type, callback) {

		if (path instanceof Array) {
			return path.forEach((path) => createHandle.fromString(path, type));
		}

		switch (type) {

			case 'require':

				try {

					let caller = require(path);

					if (typeof caller !== 'function') {
						throw `Invalid type of ${caller}, it must be a function.`;
					}

					return (param) => {
						setTimeout(caller.bind(null, param));
						callback({
							type: 'require',
							file: path,
							caller: caller,
							input: param,
							services: services
						});
					}

				} catch (error) {

					require('./utils.js').error(error);
					break;

				}

			case 'eval':

				 return (param) => {

				 	require('fs')
				 		.readFile(path, 'utf8', (error, content) => {

				 			try {

				 				if (error) {

				 					throw error;

				 				} else {

									let VMContext = require('vm-utils').VMContext;
				 					let context = new VMContext(param.context, {
				 						process: false,
				 						filename: path,
				 						env: process.env
				 					});

				 					Object.assign(context, {
										vm: require('vm'),
										fs: require('fs'),
										child_process: require('child_process'),
										parent: global,
										console: console,
										param: param,
										services: services
									});

									setTimeout(context.run.bind(context, true));

				 					callback({
				 						type: 'eval',
				 						context: context,
				 						code: content,
										file: path,
										input: path,
										services: services
				 					});

				 				}

				 			} catch (error) {

				 				require('./utils.js').error(error);

				 			}

				 		});

				}


			case 'spawn':

				return (param) => {

					var splited = path.split('\x20');
					var args = splited.splice(1);
					var handleChildProcess = () => {};
					setTimeout(() => handleChildProcess(require('child_process').spawn(splited[0], args, param.options)));

					callback({
						type: 'spawn',
						oncalled: (handle) => handleChildProcess = handle,
						file: splited[0],
						args: args,
						input: param,
						services: services
					});

				};

			case 'fork':

				return (param) => {

					var handleChildProcess = () => {};
					setTimeout(() => handleChildProcess(require('child_process').fork(path, param.args, param.options)));

					callback({
						type: 'fork',
						oncalled: (handle) => handleChildProcess = handle,
						file: path,
						args: param.args,
						input: param,
						services: services
					});

				};

			default:
				require('./utils.js').error(`Invalid value of 'type': ${type}`);

		}

		return () => {};

	};

	createHandle.fromArray = function (script, callback) {

		var result = new Set();

		for (let subscript of script) {
			result.add(createHandle(subscript, callback));
		}

		return (param) =>
			result.forEach((caller) => caller(param));

	};

})(module);
