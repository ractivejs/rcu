import parse from 'parse';
import make from 'make';
import resolve from 'resolve';
import getName from 'getName';

export default {
	init: function ( copy ) {
		Ractive = copy;
	},

	parse: parse,
	make: make,
	resolve: resolve,
	getName: getName
};
