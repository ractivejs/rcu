import parse from 'parse';
import make from 'make';
import resolve from 'resolve';
import getName from 'getName';

var rcu = {
	init: function ( copy ) {
		rcu.Ractive = copy;
	},

	parse: parse,
	make: make,
	resolve: resolve,
	getName: getName
};

export default rcu;