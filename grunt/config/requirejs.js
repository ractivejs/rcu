module.exports = {
	compile: {
		options: {
			out: 'tmp/ractive-component-utils.js',
			baseUrl: 'src/',
			name: 'ractive-component-utils',
			optimize: 'none',
			logLevel: 2,
			onBuildWrite: function( name, path, contents ) {
				return require( 'amdclean' ).clean({
					code: contents
				}) + '\n';
			}
		}
	}
};
