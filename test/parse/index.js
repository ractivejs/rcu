var fs = require( 'fs' ),
	path = require( 'path' ),
	spelunk = require( 'spelunk' ),

	rcu = require( '../../dist/rcu' ),
	assert = require( 'assert' ),

	input, output;

// initialise RCU
rcu.init( require( 'ractive' ) );

spelunk( path.join( __dirname, 'input' ), function ( err, result ) {
	if ( err ) {
		throw err;
	}

	input = result;
	check();
});

spelunk( path.join( __dirname, 'output' ), function ( err, result ) {
	if ( err ) {
		throw err;
	}

	output = result;
	check();
});

function check () {
	if ( input && output ) {
		// we're ready
		test();
		console.log( '\nall rcu.parse tests passed' );
	}
}


function test () {
	var t;

	for ( t in input ) {
		expected = output[ t ];
		actual = rcu.parse( input[ t ] );

		process.stdout.write( '.' );

		try {
			assert.deepEqual( actual, expected, 'Failed' );
		} catch ( err ) {
			console.log( '\nFailed at test "' + t + '"' );
			console.log( 'expected\n', JSON.stringify( expected, null, '  ' ) );
			console.log( 'actual\n', JSON.stringify( actual, null, '  ' ) );

			throw err;
		}
	}
}

