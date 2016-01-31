import npm from 'rollup-plugin-npm';
import babel from 'rollup-plugin-babel';

export default {
	entry: 'src/rcu.js',
	plugins: [
		npm({ jsnext: true }),
		babel()
	],
	moduleName: 'rcu'
};
