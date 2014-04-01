define([
	'resolve',
	'parse'
], function (
	resolve,
	parse
) {

	'use strict';

	return function makeComponent ( source, options, callback ) {
		var definition,
			baseUrl,
			make,
			loadImport,
			imports,
			loadModule,
			modules,
			remainingDependencies,
			onloaded,
			onerror,
			errorMessage,
			ready;

		options = options || {};

		// Implementation-specific options
		baseUrl    = options.baseUrl || '';
		loadImport = options.loadImport;
		loadModule = options.loadModule;
		onerror    = options.onerror;

		definition = parse( source );

		make = function () {
			var options, fn, component, exports, Component, prop;

			options = {
				template: definition.template,
				css: definition.css,
				components: imports
			};

			if ( definition.script ) {
				try {
					fn = new Function ( 'component', 'require', 'Ractive', definition.script );
				} catch ( err ) {
					errorMessage = 'Error creating function from component script: ' + err.message || err;

					if ( onerror ) {
						onerror( errorMessage );
					} else {
						throw new Error( errorMessage );
					}
				}

				try {
					fn( component, require, Ractive );
				} catch ( err ) {
					errorMessage = 'Error executing component script: ' + err.message || err;

					if ( onerror ) {
						onerror( errorMessage );
					} else {
						throw new Error( errorMessage );
					}
				}

				exports = component.exports;

				if ( typeof exports === 'object' ) {
					for ( prop in exports ) {
						if ( exports.hasOwnProperty( prop ) ) {
							options[ prop ] = exports[ prop ];
						}
					}
				}
			}

			Component = Ractive.extend( options );
			callback( Component );
		};

		// If the definition includes sub-components e.g.
		//     <link rel='ractive' href='foo.html'>
		//
		// ...or module dependencies e.g.
		//     foo = require('foo')
		//
		// ...then we need to load them first, assuming loaders were provided.
		// Either way the callback will be called asychronously
		remainingDependencies = ( definition.imports.length + definition.modules.length );

		if ( remainingDependencies ) {
			onloaded = function () {
				if ( !--remainingDependencies ) {
					if ( ready ) {
						make();
					} else {
						setTimeout( make, 0 ); // cheap way to enforce asynchrony for a non-Zalgoesque API
					}
				}
			};

			if ( definition.imports.length ) {
				if ( !loadImport ) {
					throw new Error( 'Component definition includes imports (e.g. `<link rel="ractive" href="' + definition.imports[0].href + '">`) but no loadImport method was passed to rcu.make()' );
				}

				imports = {};

				definition.imports.forEach( function ( toImport ) {
					var name, path;

					name = toImport.name;
					path = resolve( baseUrl, toImport.href );

					loadImport( name, path, function ( Component ) {
						imports[ name ] = Component;
						onloaded();
					});
				});
			}

			if ( definition.modules.length ) {
				if ( !loadModule ) {
					throw new Error( 'Component definition includes modules (e.g. `require("' + definition.imports[0].href + '")`) but no loadModule method was passed to rcu.make()' );
				}

				modules = {};

				definition.modules.forEach( function ( name ) {
					var path = resolve( baseUrl, name );

					loadModule( name, path, function ( Component ) {
						modules[ name ] = Component;
						onloaded();
					});
				});
			}
		} else {
			setTimeout( make, 0 );
		}

		ready = true;
	};

});
