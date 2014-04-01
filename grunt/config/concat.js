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
	umd: {
		src: 'tmp/rcu.js',
		dest: 'tmp/rcu.js',
		options: {
			banner: '<%= intro %>',
			footer: '<%= outro %>'
		}
	},
	banner: {
		files: [{
			expand: true,
			cwd: 'tmp/',
			src: '*.js',
			dest: ''
		}],
		options: {
			process: true,
			banner: '<%= banner %>'
		}
	}
};
