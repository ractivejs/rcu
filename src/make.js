define([
	'resolve',
	'parse'
], function (
	resolve,
	parse
) {

	'use strict';

	return function makeComponent ( source, config, callback ) {
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

		config = config || {};

		// Implementation-specific config
		baseUrl    = config.baseUrl || '';
		loadImport = config.loadImport;
		loadModule = config.loadModule;
		onerror    = config.onerror;

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
					fn( component = {}, config.require, Ractive );
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
		// ...then we need to load them first, using the loadImport method
		// specified by the implementation.
		//
		// In some environments (e.g. AMD) the same goes for modules, which
		// most be loaded before the script can execute
		remainingDependencies = ( definition.imports.length + ( loadModule ? definition.modules.length : 0 ) );

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

			if ( loadModule && definition.modules.length ) {
				modules = {};

				definition.modules.forEach( function ( name ) {
					var path = resolve( name, baseUrl );

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
