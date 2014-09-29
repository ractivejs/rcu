var gobble = require( 'gobble' ),

	node_modules,
	src,
	compiled;

node_modules = gobble( 'node_modules', { static: true });
src = gobble( 'src' ).transform( 'esperanto', { 'defaultOnly': true });

compiled = gobble([ src, node_modules ])
	.transform( 'requirejs', {
		name: 'rcu',
		out: 'rcu.js',
		optimize: 'none',
		paths: {
			eval2: 'eval2/eval2.amd',
			vlq: 'vlq/vlq'
		}
	})
	.transform( 'amdclean', {
		wrap: false
	});

module.exports = compiled;
