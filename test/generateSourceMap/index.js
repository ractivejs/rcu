var assert = require( 'assert' );
var sander = require( 'sander' );

describe( 'rcu.generateSourceMap()', function () {
	var rcu;

	before( function () {
		return require( '../utils/build' )().then( function ( lib ) {
			rcu = lib;
		});
	});

	it( 'generates a sourcemap', function () {
		return sander.readFile( __dirname, 'samples/foo.html' ).then( String ).then( function ( foo ) {
			var definition = rcu.parse( foo );
			var sourceMap = rcu.generateSourceMap( definition, {
				source: 'foo.html',
				file: 'foo.js'
			});

			assert.equal( sourceMap.version, 3 );
			assert.equal( sourceMap.file, 'foo.js' );
			assert.deepEqual( sourceMap.sources, [ 'foo.html' ]);
			assert.deepEqual( sourceMap.sourcesContent, [ foo ]);
			assert.deepEqual( sourceMap.names, []);
			assert.deepEqual( sourceMap.mappings, 'AAEQ;AACR;AACA;AACA;AACA;AACA;AACA' );
		});
	});

	it( 'generates a sourcemap with offset', function () {
		return sander.readFile( __dirname, 'samples/foo.html' ).then( String ).then( function ( foo ) {
			var definition = rcu.parse( foo );
			var sourceMap = rcu.generateSourceMap( definition, {
				offset: 10,
				source: 'foo.html',
				file: 'foo.js'
			});

			assert.equal( sourceMap.version, 3 );
			assert.equal( sourceMap.file, 'foo.js' );
			assert.deepEqual( sourceMap.sources, [ 'foo.html' ]);
			assert.deepEqual( sourceMap.sourcesContent, [ foo ]);
			assert.deepEqual( sourceMap.names, []);
			assert.deepEqual( sourceMap.mappings, ';;;;;;;;;;AAEQ;AACR;AACA;AACA;AACA;AACA;AACA' );
		});
	});

	it( 'warns on deprecated options.padding, and fixes it after initial warning', function () {
		return sander.readFile( __dirname, 'samples/foo.html' ).then( String ).then( function ( foo ) {
			var log = global.console.log;
			var logged = false;

			global.console.log = function ( msg ) {
				assert.ok( /deprecated/.test( msg ) );
				logged = true;
			}

			function go () {
				var sourceMap = rcu.generateSourceMap( definition, {
					padding: 10,
					source: 'foo.html',
					file: 'foo.js'
				});

				assert.equal( sourceMap.version, 3 );
				assert.equal( sourceMap.file, 'foo.js' );
				assert.deepEqual( sourceMap.sources, [ 'foo.html' ]);
				assert.deepEqual( sourceMap.sourcesContent, [ foo ]);
				assert.deepEqual( sourceMap.names, []);
				assert.deepEqual( sourceMap.mappings, ';;;;;;;;;;AAEQ;AACR;AACA;AACA;AACA;AACA;AACA' );
			}

			var definition = rcu.parse( foo );
			go();
			go();
			go();

			assert.ok( logged );

			global.console.log = log;
		});
	});
});

