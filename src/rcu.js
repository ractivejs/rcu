import parse from 'parse';
import make from 'make';
import createFunction from 'createFunction';
import resolve from 'resolve';
import getName from 'getName';

export default {
	init: function ( copy ) {
		Ractive = copy;
	},

	parse: parse,
	make: make,
	createFunction: createFunction,
	resolve: resolve,
	getName: getName
};
