
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

	module.exports = getStyle;

	function getStyle(string) {
		var result = STYLES[string];
		if (result) {
			return result;
		}
	}

})(module);
