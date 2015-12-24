
(function (module) {
	'use strict';

	var services = module.exports = {
		createHandle: createHandle
	};

	function createHandle(script, callback) {

		switch (typeof script) {

			case 'string':
				return createHandle.fromString(script, 'spawn', false, callback);

			case 'object':
				if (!script) {
					break;
				}
				if (script instanceof Array) {
					return createHandle.fromArray(script, callback);
				}
				return createHandle.fromString(script.path, script.type, script.useJSTemplateString, callback);

			case 'undefined':
				break;

			default:
				require('./utils.js').warn(`This value has been ignored because its type is invalid`);

		}

		return () => {};

	}

	createHandle.fromString = function (tpath, type, jstmplstr, callback) {

		if (tpath instanceof Array) {
			return path.forEach((tpath) => createHandle.fromString(tpath, type));
		}

		var getPath = jstmplstr ? createHandle.fromString.makePath : (path) => path;

		switch (type) {

			case 'require':

				try {

					let path = getPath(tpath);
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

					var path = getPath(tpath);

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

				};


			case 'spawn':

				return (param) => {

					var path = getPath(tpath);
					var splited = path.split('\x20');
					var args = splited.splice(1);
					var handleChildProcess = () => {};
					setTimeout(() => handleChildProcess(require('child_process').spawn(splited[0], args, param.options)));

					callback({
						type: 'spawn',
						oncalled: (handle) => handleChildProcess = handle,
						path: path,
						file: splited[0],
						args: args,
						input: param,
						services: services
					});

				};

			case 'fork':

				return (param) => {

					var path = getPath(tpath, param.tmplstrvars);
					var handleChildProcess = () => {};
					setTimeout(() => handleChildProcess(require('child_process').fork(path, param.args, param.options)));

					callback({
						type: 'fork',
						oncalled: (handle) => handleChildProcess = handle,
						path: path,
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

	createHandle.fromString.makePath = function (path) {

		var run = require('vm').runInNewContext;
		var EditorUtil = require('ksxatomsupports').editor.EditorUtil;
		var BaseClass = require('./utils.js')
			.createMerelyObject()
				.makeData('CURRENT_FILE', EditorUtil.current.file)
				.makeData('CURRENT_DIR', EditorUtil.current.dir)
				.makeData('path', require('path'))
				.makeData('fs', require('fs'))
				.makeData('os', require('os'))
				.makeData('url', require('url'))
				.makeData('env', Object.assign({}, process.env))
				.makeData('utils', require('./utils.js'))
				.makeData('JSON', JSON)
				.makeData('Math', Math)
				.makeData('console', console)
				.createClass()
		;

		class Context extends BaseClass {
			get out() {
				return run(`\`${path}\``, this);
			}
		}

		return new Context().out;

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
