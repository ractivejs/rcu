import parse from './parse';
import make from './make';
import resolve from './resolve';
import getName from './getName';

var rcu = {
	init ( copy ) {
		rcu.Ractive = copy;
	},

	parse,
	make,
	resolve,
	getName
};

export default rcu;