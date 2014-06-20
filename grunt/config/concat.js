module.exports = {
	amd: {
		src: 'tmp/rcu.js',
		dest: 'tmp/rcu.amd.js',
		options: {
			banner: '<%= intro_amd %>',
			footer: '<%= outro_amd %>'
		}
	},
	node: {
		src: 'tmp/rcu.js',
		dest: 'tmp/rcu.node.js',
		options: {
			banner: '<%= intro_node %>',
			footer: '<%= outro_node %>'
		}
	},
	es6: {
		src: 'tmp/rcu.js',
		dest: 'rcu.es6.js',
		options: {
			process: true,
			banner: '<%= banner %>var Ractive;\n\n',
			footer: '\nexport default rcu;'
		}
	},
	umd: {
		src: 'tmp/rcu.js',
		dest: 'tmp/rcu.umd.js',
		options: {
			banner: '<%= intro %>',
			footer: '<%= outro %>'
		}
	},
	banner: {
		files: [{
			expand: true,
			cwd: 'tmp/',
			src: ['rcu.*.js'],
			rename: function ( dest, name ) {
				if ( name === 'rcu.umd.js' ) {
					return 'rcu.js';
				}
				return name;
			},
			dest: ''
		}],
		options: {
			process: true,
			banner: '<%= banner %>'
		}
	}
};
