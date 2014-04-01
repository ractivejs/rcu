module.exports = function ( grunt ) {

	'use strict';

	grunt.registerTask( 'build', [
		'jshint',
		'clean:tmp',
		'requirejs',
		'concat:amd',
		'concat:node',
		'concat:umd',
		'jsbeautifier'
	]);

};
