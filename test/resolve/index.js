var assert = require( 'assert' );

describe( 'rcu.resolve()', function () {
	var rcu, tests;

	before( function () {
		return require( '../utils/build' )().then( function ( lib ) {
			rcu = lib;
		});
	});

	tests = [
		{
			base: '',
			path: 'foo.html',
			expected: 'foo.html'
		},

		{
			base: 'components/',
			path: 'foo.html',
			expected: 'components/foo.html'
		},

		{
			base: 'foo.html',
			path: 'bar.html',
			expected: 'bar.html'
		},

		{
			base: 'components/foo.html',
			path: 'bar.html',
			expected: 'components/bar.html'
		},

		{
			base: 'components/foo.html',
			path: './bar.html',
			expected: 'components/bar.html'
		},

		{
			base: 'components/foo.html',
			path: '../bar.html',
			expected: 'bar.html'
		}
	];

	tests.forEach( function ( test ) {
		it( 'resolves "' + test.path + '" against "' + test.base + '" correctly', function () {
			var resolved = rcu.resolve( test.path, test.base );
			assert.equal( resolved, test.expected );
		});
	});
});


