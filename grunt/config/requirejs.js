module.exports = {
	compile: {
		options: {
			out: 'tmp/rcu.js',
			baseUrl: 'src/',
			name: 'rcu',
			optimize: 'none',
			logLevel: 2,
			paths: {
				'ractive': 'empty:'
			},
			onBuildWrite: function( name, path, contents ) {
				return require( 'amdclean' ).clean({
					code: contents,
					prefixTransform: function ( name ) {
						if ( name === 'ractive' ) {
							return 'Ractive';
						}

						return name;
					}
				}) + '\n';
			}
		}
	}
};
