
((module) => {
	'use strict';

	const BOLD = Object.freeze({
		fontWeight: 'bold'
	});

	const UNDERLINE = Object.freeze({
		textDecoration: 'underline'
	});

	const HIDDEN = Object.freeze({
		opacity: '0'
	});

	const STYLES = Object.freeze({
		'1': BOLD,
		'4': UNDERLINE,
		'8': HIDDEN
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
		if (result) {
			return result;
		}
	}

})(module);
