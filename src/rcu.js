import parse from './parse';
import make from './make';
import generateSourceMap from './generateSourceMap';
import resolve from './resolve';
import getName from './getName';

var rcu = {
	init ( copy ) {
		rcu.Ractive = copy;
	},

	parse,
	make,
	generateSourceMap,
	resolve,
	getName
};

export default rcu;