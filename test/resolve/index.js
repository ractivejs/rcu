var rcu = require( '../../rcu.node' ),
	assert = require( 'assert' ),
	tests;

tests = [

	{
		base: '',
		path: 'foo.html',
		result: 'foo.html'
	},

	{
		base: 'components/',
		path: 'foo.html',
		result: 'components/foo.html'
	},

	{
		base: 'foo.html',
		path: 'bar.html',
		result: 'bar.html'
	},

	{
		base: 'components/foo.html',
		path: 'bar.html',
		result: 'components/bar.html'
	},

	{
		base: 'components/foo.html',
		path: './bar.html',
		result: 'components/bar.html'
	},

	{
		base: 'components/foo.html',
		path: '../bar.html',
		result: 'bar.html'
	}

];

tests.forEach( function ( test ) {
	var resolved;

	console.log( '\n' );
	console.log( 'path: "' + test.path + '"' );
	console.log( 'base: "' + test.base + '"' );
	console.log( 'expected: "' + test.result + '"' );
	resolved = rcu.resolve( test.path, test.base );
	console.log( 'actual:   "' + resolved + '"' );

	resolved = rcu.resolve( test.path, test.base );
	assert.equal( resolved, test.result );
});
