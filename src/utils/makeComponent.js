define([
	'utils/resolvePath',
	'utils/parseComponentDefinition'
], function (
	resolvePath,
	parseComponentDefinition
) {

	'use strict';

	var noConflict = {},
		head = document.getElementsByTagName( 'head' )[0],
		makeComponent;

	makeComponent = function ( source, options, callback ) {
		var definition,
			baseUrl,
			loadImport,
			imports,
			onLoadedImport,
			loadModule,
			modules,
			onLoadedModule,
			loaded,
			remaining,
			onLoaded;

		options = options || {};

		// Implementation-specific options
		baseUrl    = options.baseUrl || '';
		loadImport = options.loadImport;
		loadModule = options.loadModu

		definition = parseComponentDefinition( source );

		// If the definition includes sub-components e.g.
		//     <link rel='ractive' href='foo.html'>
		//
		// ...or module dependencies e.g.
		//     foo = require('foo')
		//
		// ...then we need to load them first, assuming loaders were provided.
		// Either way the callback will be called asychronously
		remaining = ( definition.imports.length + definition.modules.length );

		if ( remaining ) {
			onLoaded = function () {
				if ( !--remaining ) {
					if ( ready ) {
						make();
					} else {
						setTimeout( make ); // cheap way to enforce asynchrony for a non-Zalgoesque API
					}
				}
			}

			if ( definition.imports.length ) {
				if ( !loadImport ) {
					throw new Error( 'Component definition includes imports (e.g. <link rel="ractive" href="' + definition.imports[0].href + '">) but no loadImport method was passed to rcu.make()' );
				}

				imports = {};

				onLoadedImport = function ( Component ) {
					imports[ name ] = Component;
					onLoaded();
				};

				definition.imports.forEach( function ( toImport ) {
					loadImport( toImport.href, onLoadedImport );
				});
			}
		}




		// import any sub-components (if any), then...
		return loadSubComponents( definition.imports, baseUrl ).then( function ( subComponents ) {
			var options, scriptElement, exports, Component, prop;

			options = {
				template: definition.template,
				css: definition.css,
				components: subComponents
			};

			if ( definition.script ) {
				scriptElement = document.createElement( 'script' );
				scriptElement.innerHTML = '(function (component, Ractive, require) {' + definition.script + '}(component, Ractive, require));';

				noConflict.component = window.component;
				noConflict.Ractive = window.Ractive;
				noConflict.require = window.require;

				window.component = options;

				window.Ractive = Ractive;
				window.require = ractiveRequire;

				head.appendChild( scriptElement );

				exports = window.component.exports;

				if ( typeof exports === 'function' ) {
					warn( 'The function form has been deprecated. Use `component.exports = {...}` instead. You can access the `Ractive` variable if you need to.' );

					Component = exports( Ractive );
					Component.css = definition.css;
				} else if ( typeof exports === 'object' ) {
					for ( prop in exports ) {
						if ( exports.hasOwnProperty( prop ) ) {
							options[ prop ] = exports[ prop ];
						}
					}
				}

				// tidy up after ourselves
				head.removeChild( scriptElement );

				window.component = noConflict.component;
				window.Ractive = noConflict.Ractive;
				window.require = noConflict.require;
			}

			// no script tag, or component wasn't exported
			if ( !Component ) {
				Component = Ractive.extend( options );
			}

			return Component;
		});
	};

	return makeComponent;


	function loadSubComponents ( imports, baseUrl ) {
		return new Ractive.Promise( function ( resolve, reject ) {
			var remaining = imports.length, result = {};

			imports.forEach( function ( toImport ) {
				var resolvedPath;

				resolvedPath = resolvePath( toImport.href, baseUrl );

				get( resolvedPath ).then( function ( template ) {
					return makeComponent( template, resolvedPath );
				}).then( function ( Component ) {
					result[ toImport.name ] = Component;

					if ( !--remaining ) {
						resolve( result );
					}
				}, reject );
			});

			if ( !remaining ) {
				resolve( result );
			}
		});
	}


});
