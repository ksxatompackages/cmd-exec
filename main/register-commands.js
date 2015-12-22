
function RegisterCommands(Object) {
	'use strict';

	var CompositeDisposable = require('atom').CompositeDisposable;
	var EditorUtil = require('ksxatomsupports').editor.EditorUtil;
	var configOf = require('../lib/config.js').forKey;
	var createHandle = require('../lib/script.js').createHandle;
	var utils = require('../lib/utils.js');
	var getConfigCommands = require('../lib/get-config-commands.js');
	var configview = require('./config-view.js');
	var copySelection = require('ksxatomsupports').clipboard.copySelection;

	var tryCatchOf = utils.tryCatchOf;
	var getRightVal = utils.ternary.correct.valof;

	var getRightWDir = (wdir) => getRightVal(() => wdir, [undefined, null], () => EditorUtil.current.dir);

	var register = this;
	var services = {};

	register.activate = activate;
	register.deactivate = deactivate;
	register.services = services;

	var defaultsubscriptions = new CompositeDisposable();
	var configsubscriptions = new CompositeDisposable();
	var consolesubscriptions = new CompositeDisposable();

	function activate() {
		setTimeout(addCommands);
		setTimeout(observeConfig);
		return defaultsubscriptions;
	}

	function deactivate() {
		defaultsubscriptions.dispose();
		configsubscriptions.dispose();
		consolesubscriptions.dispose();
	}

	function addCommands() {

		// Register utility commands
		defaultsubscriptions.add(atom.commands.add('.cmd-exec .text-copiable', {
			'cmd-exec:copy': copySelection
		}));

		// Register user's commands
		var commands = configOf('commands').value;
		addCommands.fromConfig(commands);

	}

	addCommands.fromConfig = (commands) => {
		if (commands instanceof Array) {
			configsubscriptions = new CompositeDisposable();
			utils.tryCatch(getConfigCommands.bind(null, commands, addUserCommand), commonWarn);
		} else {
			utils.warn(`Config key 'cmd-exec.commands' must be an array of key-value pair objects`);
		}
	}

	function addUserCommand(desc) {
		var caller = tryCatchOf(addUserCommand.createCaller(desc.content), handleError);
		var target = desc.target;
		configsubscriptions.add(atom.commands.add(target, {
			[desc.command]: (event) => caller(new CommandParam(event, handleError))
		}));
	}

	addUserCommand.createCaller = (descriptor) =>
		createHandle(descriptor, addUserCommand.createCallback(descriptor));

	addUserCommand.createCallback = (descriptor) => (param) => {
		handleWorkDir(descriptor, param);
		handleExecArgv(descriptor, param);
		handleProcessAttachment(descriptor, param);
		handleIO(descriptor, param);
	}

	function handleWorkDir(descriptor, param) {
		param.input.options.cwd = getRightWDir(descriptor.wdir);
	}

	function handleExecArgv(descriptor, param) {
		if (param.type === 'fork') {
			param.input.options.args = descriptor.args;
		}
	}

	function handleProcessAttachment(descriptor, param) {
		param.input.options.detached = !descriptor.attached;
	}

	function handleIO(descriptor, param) {
		if (descriptor.console) {
			switch (param.type) {
				case 'require':
					param.viewer = configview.createForChild(descriptor, param);
					break;
				case 'eval':
					param.context.viewer = configview.createForChild(descriptor, param);
					break;
				default:
					configview.handleChildProcess(descriptor, param, consolesubscriptions, param.input.onerror);
					break;
			}
		} else {
			param.oncalled((child) => child.on('error', param.input.onerror));
		}
	}

	function commonWarn(error) {
		console.warn(error);
		utils.warn(`A config value has been ignored because it's invalid: ${error}`, `${error.stack}`);
	}

	function handleError(error) {
		console.log(error);
		utils.error(`Failed to execute command; ${error}`, `${error.stack}`);
	}

	function CommandParam(event, onerror) {
		this.event = event;
		this.workspace = atom.workspace;
		this.views = atom.views;
		this.options = {};
		this.onerror = onerror;
	}

	function observeConfig() {
		configOf('commands').observe(observeConfigCommands);
	}

	function observeConfigCommands(value) {
		configsubscriptions.dispose();
		addCommands.fromConfig(value);
	}

	services.createExecutor = addUserCommand.createCaller;
	services.ExecutorParam = CommandParam;

}

module.exports = new RegisterCommands(Object);
