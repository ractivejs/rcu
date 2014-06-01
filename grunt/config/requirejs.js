module.exports = {
	compile: {
		options: {
			out: 'tmp/rcu.js',
			baseUrl: 'amd/',
			name: 'rcu',
			optimize: 'none',
			logLevel: 2,
			paths: {
				'eval2': '../node_modules/eval2/eval2.amd'
			},
			ignore: [ 'fs', 'path' ],
			onBuildWrite: function( name, path, contents ) {
				var depMap = {};

				// get list of dependencies
				contents = contents.replace( /var (\S+) = (__dependency\d+__)\["default"\];/g, function ( match, $1, $2 ) {
					depMap[ $2 ] = $1;
					return '';
				})

				// rename them
				.replace( /__dependency\d+__/g, function ( match ) {
					return depMap[ match ];
				})

				// return default exports
				.replace( '__exports__["default"] =', 'return' )

				// remove __exports__
				.replace( /,?"exports"\]/, ']' )
				.replace( /,?\s*__exports__/, '' );

				return require( 'amdclean' ).clean({
					code: contents
				}) + '\n';
			}
		}
	}
};
