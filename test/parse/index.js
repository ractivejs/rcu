var fs = require( 'fs' ),
	path = require( 'path' ),
	spelunk = require( 'spelunk' ),

	rcu = require( '../../rcu.node' ),
	assert = require( 'assert' ),

	input, output;

// initialise RCU
rcu.init( require( 'ractive' ) );

spelunk( path.join( __dirname, 'input' ), function ( err, result ) {
	if ( err ) {
		throw err;
	}

	input = result;
	if ( output ) test();
});

spelunk( path.join( __dirname, 'output' ), function ( err, result ) {
	if ( err ) {
		throw err;
	}

	output = result;
	if ( input ) test();
});


function test () {
	var t;

	for ( t in input ) {
		expected = output[ t ];
		actual = rcu.parse( input[ t ] );

		console.log( '\nTest "' + t + '"' );
		console.log( 'expected\n', expected );
		console.log( 'actual\n', actual );

		assert.deepEqual( actual, expected, 'Failed' );
	}
}

