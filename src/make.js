import parse from 'parse';

export default function make ( source, config, callback ) {
	var definition,
		url,
		createComponent,
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
	url        = config.url || '';
	loadImport = config.loadImport;
	loadModule = config.loadModule;
	onerror    = config.onerror;

	definition = parse( source );

	createComponent = function () {
		var options, fn, component, exports, Component, prop;

		options = {
			template: definition.template,
			css: definition.css,
			components: imports
		};

		if ( definition.script ) {
			try {
				fn = new Function ( 'component', 'require', 'Ractive', definition.script + '\n//# sourceURL=' + url.substr( url.lastIndexOf( '/' ) + 1 ) + '.js' );
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
					createComponent();
				} else {
					setTimeout( createComponent, 0 ); // cheap way to enforce asynchrony for a non-Zalgoesque API
				}
			}
		};

		if ( definition.imports.length ) {
			if ( !loadImport ) {
				throw new Error( 'Component definition includes imports (e.g. `<link rel="ractive" href="' + definition.imports[0].href + '">`) but no loadImport method was passed to rcu.make()' );
			}

			imports = {};

			definition.imports.forEach( function ( toImport ) {
				loadImport( toImport.name, toImport.href, url, function ( Component ) {
					imports[ toImport.name ] = Component;
					onloaded();
				});
			});
		}

		if ( loadModule && definition.modules.length ) {
			modules = {};

			definition.modules.forEach( function ( name ) {
				loadModule( name, name, url, function ( Component ) {
					modules[ name ] = Component;
					onloaded();
				});
			});
		}
	} else {
		setTimeout( createComponent, 0 );
	}

	ready = true;
}
