
(function (module) {
	'use strict';

	var utils = require('./utils.js');
	var commands_services = require('../main/register-commands.js').services;

	var NOTIFICATION_TYPES = Object.freeze(['info', 'success', 'warning', 'error']);
	var NOTIFICATION_TYPES_STR = listArrayElementsAsQuoted(NOTIFICATION_TYPES);

	class SpecialCommands {

		ClearScreen(param) {
			if (getCmdArg(param.command).trim()) {
				return true;
			}
			var outputpre = param.elements.outputpre;
			outputpre.hidden = true;
			utils.clearChildren(outputpre);
		}

		ExitProcess(param) {
			if (getCmdArg(param.command).trim()) {
				return true;
			}
			param.closePaneItem();
		}

		Notification(param) {
			var arg = getCmdArg(param.command).trim();
			var type = getCmdKey(arg).trim();
			if (NOTIFICATION_TYPES.indexOf(type) !== -1) {
				atom.notifications.add(type, getCmdArg(arg).trim());
			} else {
				handleError(param)(`Syntax:\n\t${getCmdKey(param.command)} <type> <message>\n - <type> must be one of ${NOTIFICATION_TYPES_STR}`);
			}
		}

		MessageBox(param) {
			alert(getCmdArg(param.command).trim(), 'Message');
		}

		WriteStdIn(param) {
			var data = getCmdArg(param.command);
			data && param.writeStdIn(param.process.stdin, new Buffer(`${data}\n`), 'utf8', param.elements.outputpre);
		}

		WriteStdOut(param) {
			param.handleData(param.elements, getCmdArg(param.command).trim());
		}

		WriteStdErr(param) {
			param.handleError(param.elements, getCmdArg(param.command).trim());
		}

		SpawnNewProcess(param) {
			var path = getCmdArg(param.command);
			if (!path.trim()) {
				handleError(`Syntax:\n\t${getCmdKey(param.command)} <command>\n - <command> must not be empty.`);
				return;
			}
			commands_services.createExecutor(Object.assign({}, param.fromConfig, {
				path: path,
				type: 'spawn'
			}))(new commands_services.ExecutorParam(null, handleError(param)));
		}

		ExecuteNewProcess(param) {
			var path = getCmdArg(param.command);
			if (!path.trim()) {
				handleError(`Syntax:\n\t${getCmdKey(param.command)} <command>\n - <command> must not be empty.`);
			}
			require('child_process').exec(path, {
				encoding: 'utf8',
				cwd: param.fromScript.input.options.cwd
			}, (error, stdout, stderr) => {
				param.handleData(param.elements, `STDOUT: ${stdout}\n`);
				param.handleData(param.elements, `STDERR: ${stderr}\n`);
				error && handleError(param)(`${error}\n`);
			})
		}

		ListEnvironmentVariables(param) {
			if (getCmdArg(param.command)) {
				return true;
			}
			var json = new Buffer(`${JSON.stringify(process.env, '', '\t')}\n`);
			param.handleData(param.elements, json);
		}

		beep() {
			atom.beep();
		}

	}

	((proto) => {
		makeAliases('ClearScreen', ['clear', 'cls', 'clear-screen', 'clrscr', 'clear-console']);
		makeAliases('ExitProcess', ['exit', 'terminate', 'end', 'escape', 'close', 'end-process', 'exit-process']);
		makeAliases('Notification', ['notice', 'popup', 'open-notification', 'show-notification']);
		makeAliases('MessageBox', ['message', 'msgbox', 'dialog', 'alert', 'show-message', 'message-box']);
		makeAliases('WriteStdIn', ['in', 'input', 'enter', 'tell', 'stdin', 'write-stdin'])
		makeAliases('WriteStdOut', ['out', 'output', 'print', 'text', 'echo', 'log', 'write', 'stdout', 'write-stdout']);
		makeAliases('WriteStdErr', ['err', 'error', 'throw', 'exception', 'stderr', 'write-stderr']);
		makeAliases('SpawnNewProcess', ['spawn', 'start', 'new', 'open', 'run', 'new-process', 'create-process', 'start-process', 'spawn-process', 'spawn-new-process', 'CreateProcess', 'SpawnProcess']);
		makeAliases('ExecuteNewProcess', ['exec', 'system', 'exec-process', 'exec-cmd', 'execute', 'execute-command', 'execute-process', 'Execute', 'ExecuteCommand', 'ExecuteProcess'])
		makeAliases('ListEnvironmentVariables', ['var', 'env', 'environ', 'environment', 'environment-variable', 'list-environment-variable', 'EnvironmentVariable'])
		function makeAliases(fname, aliases) {
			aliases.forEach((alias) => proto[alias] = proto[fname]);
		}
	})(SpecialCommands.prototype);

	module.exports = new SpecialCommands();

	function getCmdKey(command) {
		var sp = command.indexOf('\x20');
		return sp === -1 ? command : command.substr(0, sp);
	}

	function getCmdArg(command) {
		var sp = command.indexOf('\x20');
		return sp === -1 ? '' : command.slice(sp + 1);
	}

	function handleError(param) {
		return (error) =>
			param.handleError(param.elements, String(error));
	}

	function listArrayElementsAsQuoted(array) {
		return array.map((element) => `'${element}'`).join(', ');
	}

})(module);
