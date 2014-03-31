define([
	'parse',
	'make'
], function (
	parse,
	make
) {

	'use strict';

	return {
		init: function ( copy ) {
			Ractive = copy;
		},

		parse: parse,
		make: make
	};

});
