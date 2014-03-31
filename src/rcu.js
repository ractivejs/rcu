define([
	'parse',
	'make',
	'resolve',
	'getName'
], function (
	parse,
	make,
	resolve,
	getName
) {

	'use strict';

	return {
		init: function ( copy ) {
			Ractive = copy;
		},

		parse: parse,
		make: make,
		resolve: resolve,
		getName: getName
	};

});
