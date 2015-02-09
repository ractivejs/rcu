var assert = require( 'assert' );
var sander = require( 'sander' );
var Promise = sander.Promise;

describe( 'rcu.parse()', function () {
	var rcu;

	before( function () {
		return require( '../utils/build' )().then( function ( lib ) {
			rcu = lib;
		});
	});

	sander.readdirSync( __dirname, 'input' ).forEach( function ( input ) {
		var name = input.replace( '.html', '' );
		var output = name + '.json';

		it( name, function () {
			return sander.readFile( __dirname, 'input', input ).then( String ).then( function ( definition ) {
				var actual = rcu.parse( definition );

				return sander.readFile( __dirname, 'output', output ).then( String ).then( JSON.parse ).then( function ( expected ) {
					assert.deepEqual( actual, expected );
				});
			});
		});
	});
});

