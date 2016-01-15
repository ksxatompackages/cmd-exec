
((module) => {
	'use strict';

	const RESET = Object.freeze({
		fontWeight: '',
		textDecoration: '',
		opacity: '',
		color: '',
		background: ''
	});

	const BOLD = Object.freeze({
		fontWeight: 'bold'
	});

	const UNDERLINE = Object.freeze({
		textDecoration: 'underline'
	});

	const HIDDEN = Object.freeze({
		opacity: '0'
	});

	const RESET_BOLD = Object.freeze({
		fontWeight: ''
	});

	const RESET_UNDERLINE = Object.freeze({
		textDecoration: ''
	});

	const RESET_HIDDEN = Object.freeze({
		opacity: ''
	});


	const STYLES = Object.freeze({
		'0': RESET,
		'1': BOLD,
		'4': UNDERLINE,
		'8': HIDDEN,
		'21': RESET_BOLD,
		'24': RESET_UNDERLINE,
		'28': RESET_HIDDEN
	});

	const COLOR34 = Object.freeze([
		'', '#000', '#F00', '#0F0', '#FF0', '#00F', '#F0F', '#0FF', '#D3D3D3'
	]);

	const COLOR9X = Object.freeze([
		'#A9A9A9', '#FF3232', '#90EE90', '#FFFFE0', '#ADD8E6', '#F022F0', '#E0FFFF', '#FFF'
	]);

	module.exports = getStyle;

	function getStyle(string) {

		var result = STYLES[string];
		if (result || string.length < 2) {
			return result;
		}

		var pattern, index, pname, firstchar = string[0];
		if (firstchar === '1') {
			index = 2;
			pattern = COLOR9X;
			pname = 'background';
		} else {
			index = 1;
			if (firstchar === '4') {
				pattern = COLOR34;
				pname = 'background';
			} else {
				pname = 'color';
				if (firstchar === '3') {
					pattern = COLOR34;
				} else if (firstchar === '9') {
					pattern = COLOR9X;
				} else {
					return;
				}
			}
		}

		return Object.freeze({
			[pname]: pattern[string[index]] || ''
		});

	}

})(module);
