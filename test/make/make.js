var fs = require( 'fs' ),
	path = require( 'path' ),
	rcu = require( '../../rcu.node' ),

	queue = [],
	running;

rcu.init( require( 'ractive' ) );

module.exports = function ( file, description, callback ) {
	queue.push({
		file: file,
		description: description,
		callback: callback
	});

	if ( !running ) {
		run();
	}
};

function run () {
	var test;

	test = queue.shift();

	if ( !test ) {
		running = false;
		return;
	}

	fs.readFile( path.join( __dirname, 'input', test.file ), function ( err, result ) {
		var definition;

		if ( err ) {
			throw err;
		}

		definition = result.toString();

		rcu.make( definition, {

		}, function ( Component ) {
			test.callback( Component );
			run();
		});
	})
}
