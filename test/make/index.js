var make = require( './make' ),
	assert = require( 'assert' );

make( 'simple.html', 'Simple component', function ( Component ) {
	var ractive = new Component();
	assert.deepEqual( ractive.toHTML(), '<h1>Hello world!</h1>' );
});
