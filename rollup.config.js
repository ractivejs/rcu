import nodeResolve from 'rollup-plugin-node-resolve';
import buble from 'rollup-plugin-buble';

export default {
	entry: 'src/rcu.js',
	plugins: [
		nodeResolve({ jsnext: true }),
		buble({ exclude: 'node_modules/**' })
	],
	moduleName: 'rcu'
};
