import nodeResolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';

export default {
	entry: 'src/rcu.js',
	plugins: [
		nodeResolve({ jsnext: true }),
		babel()
	],
	moduleName: 'rcu'
};
