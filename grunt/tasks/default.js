module.exports = function ( grunt ) {

	'use strict';

	grunt.registerTask( 'default', [
		'build',
		'test',
		'concat:banner'
	]);
};
