import nodeResolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import modifyBabelPreset from 'modify-babel-preset';

export default {
	entry: 'src/rcu.js',
	plugins: [
		nodeResolve({ jsnext: true }),
		babel({
			presets: [ modifyBabelPreset( 'es2015', {
				'transform-typeof-symbol': false,
				'transform-modules-commonjs': false
			})],
			babelrc: false,
			exclude: 'node_modules/**'
		})
	],
	moduleName: 'rcu'
};
