var assert = require( 'assert' );
var sander = require( 'sander' );
var SourceMapConsumer = require( 'source-map' ).SourceMapConsumer;
var getLocation = require( './getLocation' );
var rcu = require( '../rcu' );

describe( 'rcu.generateSourceMap()', function () {
	it( 'generates a hi-res sourcemap', function () {
		return sander.readFile( __dirname, 'samples/foo.html' ).then( String ).then( function ( foo ) {
			var definition = rcu.parse( foo );

			var offset = 10;
			var generated = new Array( offset + 1 ).join( '\n' ) + definition.script;

			var sourceMap = rcu.generateSourceMap( definition, {
				hires: true,
				offset: 10,
				source: 'foo.html',
				file: 'foo.js'
			});

			var smc = new SourceMapConsumer( sourceMap );

			var generatedLoc = getLocation( generated, generated.indexOf( 'log' ) );
			var expectedLoc = getLocation( foo, foo.indexOf( 'log' ) );
			var actualLoc = smc.originalPositionFor( generatedLoc );

			assert.equal( actualLoc.line, expectedLoc.line );
			assert.equal( actualLoc.column, expectedLoc.column );

			generatedLoc = getLocation( generated, generated.indexOf( 'alert' ) );
			expectedLoc = getLocation( foo, foo.indexOf( 'alert' ) );
			actualLoc = smc.originalPositionFor( generatedLoc );

			assert.equal( actualLoc.line, expectedLoc.line );
			assert.equal( actualLoc.column, expectedLoc.column );

			assert.deepEqual( sourceMap.mappings, ';;;;;;;;;;AAEQ;AACR,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC;AACrB,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC;AACtB,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC;AAC/B;AACA,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC;AAChB,CAAC,CAAC;AACF,CAAC,CAAC;AACF' );
		});
	});

	it( 'generates a lo-res sourcemap', function () {
		return sander.readFile( __dirname, 'samples/foo.html' ).then( String ).then( function ( foo ) {
			var definition = rcu.parse( foo );
			var sourceMap = rcu.generateSourceMap( definition, {
				source: 'foo.html',
				file: 'foo.js',
				hires: false
			});

			assert.equal( sourceMap.version, 3 );
			assert.equal( sourceMap.file, 'foo.js' );
			assert.deepEqual( sourceMap.sources, [ 'foo.html' ]);
			assert.deepEqual( sourceMap.sourcesContent, [ foo ]);
			assert.deepEqual( sourceMap.names, []);
			assert.deepEqual( sourceMap.mappings, 'AAEQ;AACR;AACA;AACA;AACA;AACA;AACA;AACA;AACA' );
		});
	});

	it( 'generates a lo-res sourcemap with offset', function () {
		return sander.readFile( __dirname, 'samples/foo.html' ).then( String ).then( function ( foo ) {
			var definition = rcu.parse( foo );
			var sourceMap = rcu.generateSourceMap( definition, {
				offset: 10,
				source: 'foo.html',
				file: 'foo.js',
				hires: false
			});

			assert.equal( sourceMap.version, 3 );
			assert.equal( sourceMap.file, 'foo.js' );
			assert.deepEqual( sourceMap.sources, [ 'foo.html' ]);
			assert.deepEqual( sourceMap.sourcesContent, [ foo ]);
			assert.deepEqual( sourceMap.names, []);
			assert.deepEqual( sourceMap.mappings, ';;;;;;;;;;AAEQ;AACR;AACA;AACA;AACA;AACA;AACA;AACA;AACA' );
		});
	});

	it( 'warns on deprecated options.padding, and fixes it after initial warning', function () {
		return sander.readFile( __dirname, 'samples/foo.html' ).then( String ).then( function ( foo ) {
			var warn = global.console.warn;
			var warned = 0;

			global.console.warn = function ( msg ) {
				if ( /deprecated/.test( msg ) ) warned += 1;
			};

			function go () {
				rcu.generateSourceMap( definition, {
					padding: 10,
					source: 'foo.html',
					file: 'foo.js'
				});
			}

			var definition = rcu.parse( foo );
			go();
			go();
			go();

			assert.equal( warned, 1 );

			global.console.warn = warn;
		});
	});
});
