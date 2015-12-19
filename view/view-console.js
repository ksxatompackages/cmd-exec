
(function (module) {
	'use strict';

	var copySelection = require('ksxatomsupports').clipboard.copySelection;
	var ConsoleHistory = require('../lib/console-history.js');
	var specialcmds = require('../lib/special-commands.js');

	const ENTER_KEY = 0x0D;
	const ESC_KEY = 0x1B;
	const KEY_UP = 0x26;
	const KEY_DOWN = 0x28;
	const NEW_LINE = '\n'.charCodeAt();
	const TAB_CHAR = '\t'.charCodeAt();
	const SPACE_CHAR = 0x20;
	const MINI_EDITOR = Object.freeze({mini: true});
	const OUT_INPUT = Object.freeze(['from-input', 'text-normal']);
	const OUT_DATA = Object.freeze(['from-data', 'text-normal']);
	const OUT_ERROR = Object.freeze(['text-error']);

	module.exports = (elements, param) => {

		function SpecialCommandsParam(command, elements) {
			this.command = command;
			this.elements = elements;
		}

		SpecialCommandsParam.prototype = {
			handleData: handleData,
			handleError: handleError,
			handleClose: handleClose,
			writeStdIn: writeStdIn,
			writeStringBuffer: writeStringBuffer,
			writeCharCode: writeCharCode,
			closePaneItem: closePaneItem
		};

		function main(elements, param) {
			handleCommon(elements, param);
			handleConfig(elements, param.fromConfig);
			handleCloseEvent(elements, param.process);
			handleStdIn(elements, param.process.stdin);
			handleStdOut(elements, param.process.stdout);
			handleStdErr(elements, param.process.stderr);
		}

		function handleCommon(elements, param) {
			((proto) => {
				proto.process = param.process;
				proto.services = param.services;
				proto.fromConfig = param.fromConfig;
				proto.fromScript = param.fromScript;
			})(SpecialCommandsParam.prototype);
			handleCommon.handlePromise = param.handlePromise;
		}

		function handleConfig(elements, config) {
			elements.descriptiondiv.textContent = `Running: ${config.path}`;
			enterStdIn.write = config.hideInputText ? () => {} : writeStringBuffer;
			handleClose.considerClosePaneItem = config.closeOnExit ? closePaneItem : () => {};
			handleSpecialCommand(config);
		}

		function handleCloseEvent(elements, process) {
			process.on('close', handleClose.bind(null, elements));
			process.on('error', (error) => handleError(elements, String(error)));
			handleCommon.handlePromise((paneitem) => {
				handleCommon.paneItem = paneitem;
				paneitem.onDidDestroy(() => process.kill());
			});
		}

		function handleSpecialCommand(config) {
			var list = config.utils;
			if (list instanceof Array) {
				enterStdIn.handleSpecialCommand = (command, elements) => {
					for (let fname of list) {
						if (command === fname || !command.indexOf(`${fname}\x20`)) {
							try {
								return !specialcmds[fname](new SpecialCommandsParam(command, elements));
							} catch (error) {
								handleError(elements, `A JS error has occurred during execution of command '${command}'\nCommand may not be supported\n${error}\n`);
								handleData(elements, `Passing data to stdin by default...\n`);
								return false;
							}
						}
					}
				};
			} else {
				enterStdIn.handleSpecialCommand = () => {};
			}

		}

		function handleClose(elements, exitcode) {
			elements.finaloutputdiv.textContent = `Process finished, exit code: ${exitcode}`;
			elements.inputdiv.remove();
			handleClose.considerClosePaneItem();
		}

		function handleStdIn(elements, stdin) {
			if (!stdin) return;
			var editorutil = buildTextEditor(elements);
			handleControl(editorutil, elements, stdin);
			focusInputElement(editorutil);
			handleCommon.handlePromise((paneitem) => paneitem.onDidActive(() => focusInputElement(editorutil)));
			enterStdIn.history = new ConsoleHistory();
			elements.outputpre.hidden = true;
		}

		function focusInputElement(editorutil) {
			setTimeout(() => editorutil.element.focus());
		}

		function buildTextEditor(elements) {
			var editorutil = require('ksxatomsupports').editor.EditorUtil.new(MINI_EDITOR);
			elements.editordiv.insertBefore(editorutil.element, null);
			return editorutil;
		}

		function handleControl(editorutil, elements, stdin) {
			attachStdInEvent(editorutil.editor, editorutil.element, elements, stdin);
			makeConfirmButton(editorutil.editor, elements, stdin);
		}

		function attachStdInEvent(editor, element, elements, stdin) {
			var handle = handleKeyboardEvent.bind(null, stdin, editor, elements);
			element.addEventListener('keydown', handle, false);
		}

		function handleKeyboardEvent(stdin, editor, elements, event) {
			switch (event.keyCode) {
				case ENTER_KEY:
					return enterStdIn(stdin, editor, elements);
				case ESC_KEY:
					return void editor.setText('');
				case KEY_UP:
					return enterStdIn.history.up(editor);
				case KEY_DOWN:
					return enterStdIn.history.down(editor);
			}
		}

		function makeConfirmButton(editor, elements, stdin) {
			var handle = () => enterStdIn(stdin, editor, elements);
			elements.confirmbutton.addEventListener('click', handle, false);
		}

		function enterStdIn(stdin, editor, elements) {
			var text = editor.getText();
			editor.setText('');
			text && enterStdIn.history.add(text);
			enterStdIn.handleSpecialCommand(text, elements) || writeStdIn(stdin, new Buffer(`${text}\n`), editor.getEncoding(), elements.outputpre);
		}

		function writeStdIn(stdin, data, encoding, outputpre) {
			stdin.write(data, encoding);
			enterStdIn.write(outputpre, data, OUT_INPUT);
		}

		function handleStdOut(elements, stdout) {
			if (!stdout) return;
			stdout.on('data', handleData.bind(null, elements));
		}

		function handleData(elements, data) {
			writeStringBuffer(elements.outputpre, new Buffer(`${data}`), OUT_DATA);
		}

		function handleStdErr(elements, stderr) {
			if (!stderr) return;
			stderr.on('data', handleError.bind(null, elements));
		}

		function handleError(elements, error) {
			writeStringBuffer(elements.outputpre, new Buffer(`${error}\n`), OUT_ERROR);
		}

		function writeStringBuffer(outputpre, string, extraclass) {
			outputpre.hidden = false;
			for (let char of string) {
				writeCharCode(outputpre, char, extraclass);
			}
			outputpre.parentElement.scrollTop = outputpre.parentElement.scrollHeight;
		}

		 function writeCharCode(outputpre, char, extraclass) {
			var ch = document.createElement('span');
			ch.textContent = String.fromCodePoint(char);
		 	extraclass instanceof Array && extraclass.forEach((classname) => ch.classList.add(classname));
		 	outputpre.insertBefore(ch, null);
		 }

		function closePaneItem() {
			setTimeout(() => handleCommon.paneItem.destroy());
		}

		main(elements, param);

	}

})(module);
