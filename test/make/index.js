var assert = require( 'assert' );
var sander = require( 'sander' );
var Promise = sander.Promise;

describe( 'rcu.make()', function () {
	var rcu;

	before( function () {
		return require( '../utils/build' )().then( function ( lib ) {
			rcu = lib;
		});
	});

	it( 'creates a simple component', function () {
		return sander.readFile( __dirname, 'input/simple.html' ).then( String ).then( function ( definition ) {
			// TODO rcu.make() should return a promise?
			return new Promise( function ( fulfil, reject ) {
				rcu.make( definition, {}, function ( Component ) {
					var ractive = new Component();

					try {
						assert.deepEqual( ractive.toHTML(), '<h1>Hello world!</h1>' );
						fulfil();
					} catch ( err ) {
						reject( err );
					}
				});
			});
		});
	});
});

