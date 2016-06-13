var assert = require( 'assert' );
var sander = require( 'sander' );
var rcu = require( '../rcu' );

describe( 'rcu.parse()', function () {
	sander.readdirSync( __dirname, 'input' ).forEach( function ( input ) {
		var name = input.replace( '.html', '' );
		var output = name + '.json';

		it( name, function () {
			return sander.readFile( __dirname, 'input', input ).then( String ).then( function ( definition ) {
				var actual = rcu.parse( definition );

				return sander.readFile( __dirname, 'output', output ).then( String ).then( JSON.parse ).then( function ( expected ) {
					if ( expected.template ) expected.template.v = actual.template.v;
					assert.deepEqual( actual, expected );
				});
			});
		});
	});
});
