var fs = require( 'fs' ),
	path = require( 'path' ),
	spelunk = require( 'spelunk' ),

	rcu = require( '../../rcu.node' ),

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

		if ( !deepEqual( expected, actual ) ) {
			console.log( 'expected:\n', expected );
			console.log( 'actual:\n', actual );

			process.exit( 'Failed test "' + t + '"' );
		}

		console.log( 'passed "' + t + '"' );
	}
}


function deepEqual ( a, b ) {
	var i;

	if ( a === null && b === null ) {
		return true;
	}

	if ( typeof a !== 'object' || typeof b !== 'object' ) {
		return a === b;
	}

	if ( isArray( a ) && isArray( b ) ) {
		i = a.length;

		if ( b.length !== i ) {
			return false;
		}

		while ( i-- ) {
			if ( !deepEqual( a[i], b[i] ) ) {
				return false;
			}
		}

		return true;
	}

	for ( i in a ) {
		if ( a.hasOwnProperty( i ) ) {
			if ( !b.hasOwnProperty( i ) || !deepEqual( a[i], b[i] ) ) {
				return false;
			}
		}
	}

	for ( i in b ) {
		if ( b.hasOwnProperty( i ) ) {
			if ( !a.hasOwnProperty( i ) || !deepEqual( a[i], b[i] ) ) {
				return false;
			}
		}
	}

	return true;
}

function isArray ( thing ) {
	return Object.prototype.toString.call( thing ) === '[object Array]';
}
