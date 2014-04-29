import parse from 'parse';
import make from 'make';
import execute from 'execute';
import resolve from 'resolve';
import getName from 'getName';

export default {
	init: function ( copy ) {
		Ractive = copy;
	},

	parse: parse,
	make: make,
	execute: execute,
	resolve: resolve,
	getName: getName
};
