/*

	rcu (Ractive component utils) - 0.1.1 - 2014-04-29
	==============================================================

	Copyright 2014 Rich Harris and contributors
	Released under the MIT license.

*/

( function( global ) {

	'use strict';

	var Ractive;

	var getName = function getName( path ) {
		var pathParts, filename, lastIndex;
		pathParts = path.split( '/' );
		filename = pathParts.pop();
		lastIndex = filename.lastIndexOf( '.' );
		if ( lastIndex !== -1 ) {
			filename = filename.substr( 0, lastIndex );
		}
		return filename;
	};

	var parse = function( getName ) {

		var requirePattern = /require\s*\(\s*(?:"([^"]+)"|'([^']+)')\s*\)/g;
		return function parse( source ) {
			var template, links, imports, scripts, script, styles, match, modules, i, item;
			template = Ractive.parse( source, {
				noStringify: true,
				interpolateScripts: false,
				interpolateStyles: false
			} );
			links = [];
			scripts = [];
			styles = [];
			modules = [];
			// Extract certain top-level nodes from the template. We work backwards
			// so that we can easily splice them out as we go
			i = template.length;
			while ( i-- ) {
				item = template[ i ];
				if ( item && item.t === 7 ) {
					if ( item.e === 'link' && ( item.a && item.a.rel[ 0 ] === 'ractive' ) ) {
						links.push( template.splice( i, 1 )[ 0 ] );
					}
					if ( item.e === 'script' && ( !item.a || !item.a.type || item.a.type[ 0 ] === 'text/javascript' ) ) {
						scripts.push( template.splice( i, 1 )[ 0 ] );
					}
					if ( item.e === 'style' && ( !item.a || !item.a.type || item.a.type[ 0 ] === 'text/css' ) ) {
						styles.push( template.splice( i, 1 )[ 0 ] );
					}
				}
			}
			// Extract names from links
			imports = links.map( function( link ) {
				var href, name;
				href = link.a.href && link.a.href[ 0 ];
				name = link.a.name && link.a.name[ 0 ] || getName( href );
				if ( typeof name !== 'string' ) {
					throw new Error( 'Error parsing link tag' );
				}
				return {
					name: name,
					href: href
				};
			} );
			script = scripts.map( extractFragment ).join( ';' );
			while ( match = requirePattern.exec( script ) ) {
				modules.push( match[ 1 ] || match[ 2 ] );
			}
			// TODO glue together text nodes, where applicable
			return {
				template: template,
				imports: imports,
				script: script,
				css: styles.map( extractFragment ).join( ' ' ),
				modules: modules
			};
		};

		function extractFragment( item ) {
			return item.f;
		}
	}( getName );

	var execute = function() {

		var head;
		if ( typeof document !== 'undefined' ) {
			head = document.getElementsByTagName( 'head' )[ 0 ];
		}
		return function execute( script, options ) {
			var oldOnerror, errored, scriptElement, dataURI;
			options = options || {};
			if ( options.sourceURL ) {
				script += '\n//# sourceURL=' + options.sourceURL;
			}
			dataURI = 'data:text/javascript;charset=utf-8,' + encodeURIComponent( script );
			scriptElement = document.createElement( 'script' );
			scriptElement.src = dataURI;
			scriptElement.onload = function() {
				head.removeChild( scriptElement );
				window.onerror = oldOnerror;
				if ( errored ) {
					if ( options.errback ) {
						options.errback();
					}
				} else if ( options.onload ) {
					options.onload();
				}
			};
			oldOnerror = window.onerror;
			window.onerror = function() {
				errored = true;
			};
			head.appendChild( scriptElement );
		};
	}();

	var make = function( parse, execute ) {

		return function make( source, config, callback, errback ) {
			var definition, url, createComponent, loadImport, imports, loadModule, modules, remainingDependencies, onloaded, onerror, ready;
			config = config || {};
			// Implementation-specific config
			url = config.url || '';
			loadImport = config.loadImport;
			loadModule = config.loadModule;
			onerror = config.onerror;
			definition = parse( source );
			createComponent = function() {
				var noConflict, options, Component;
				options = {
					template: definition.template,
					css: definition.css,
					components: imports
				};
				if ( definition.script ) {
					noConflict = {
						component: window.component,
						require: window.require,
						Ractive: window.Ractive
					};
					window.component = {};
					window.require = config.require;
					window.Ractive = Ractive;
					execute( definition.script, {
						sourceURL: url.substr( url.lastIndexOf( '/' ) + 1 ) + '.js',
						onload: function() {
							var exports = window.component.exports,
								prop;
							window.component = noConflict.component;
							window.require = noConflict.require;
							window.Ractive = noConflict.Ractive;
							if ( typeof exports === 'object' ) {
								for ( prop in exports ) {
									if ( exports.hasOwnProperty( prop ) ) {
										options[ prop ] = exports[ prop ];
									}
								}
							}
							Component = Ractive.extend( options );
							callback( Component );
						},
						onerror: function() {
							window.component = noConflict.component;
							window.require = noConflict.require;
							window.Ractive = noConflict.Ractive;
							errback( 'Error creating component' );
						}
					} );
				} else {
					Component = Ractive.extend( options );
					callback( Component );
				}
			};
			// If the definition includes sub-components e.g.
			//     <link rel='ractive' href='foo.html'>
			//
			// ...then we need to load them first, using the loadImport method
			// specified by the implementation.
			//
			// In some environments (e.g. AMD) the same goes for modules, which
			// most be loaded before the script can execute
			remainingDependencies = definition.imports.length + ( loadModule ? definition.modules.length : 0 );
			if ( remainingDependencies ) {
				onloaded = function() {
					if ( !--remainingDependencies ) {
						if ( ready ) {
							createComponent();
						} else {
							setTimeout( createComponent, 0 );
						}
					}
				};
				if ( definition.imports.length ) {
					if ( !loadImport ) {
						throw new Error( 'Component definition includes imports (e.g. `<link rel="ractive" href="' + definition.imports[ 0 ].href + '">`) but no loadImport method was passed to rcu.make()' );
					}
					imports = {};
					definition.imports.forEach( function( toImport ) {
						loadImport( toImport.name, toImport.href, url, function( Component ) {
							imports[ toImport.name ] = Component;
							onloaded();
						} );
					} );
				}
				if ( loadModule && definition.modules.length ) {
					modules = {};
					definition.modules.forEach( function( name ) {
						loadModule( name, name, url, function( Component ) {
							modules[ name ] = Component;
							onloaded();
						} );
					} );
				}
			} else {
				setTimeout( createComponent, 0 );
			}
			ready = true;
		};
	}( parse, execute );

	var resolve = function resolvePath( relativePath, base ) {
		var pathParts, relativePathParts, part;
		if ( relativePath.charAt( 0 ) !== '.' ) {
			// not a relative path!
			return relativePath;
		}
		// 'foo/bar/baz.html' -> ['foo', 'bar', 'baz.html']
		pathParts = ( base || '' ).split( '/' );
		relativePathParts = relativePath.split( '/' );
		// ['foo', 'bar', 'baz.html'] -> ['foo', 'bar']
		pathParts.pop();
		while ( part = relativePathParts.shift() ) {
			if ( part === '..' ) {
				pathParts.pop();
			} else if ( part !== '.' ) {
				pathParts.push( part );
			}
		}
		return pathParts.join( '/' );
	};

	var rcu = function( parse, make, execute, resolve, getName ) {

		return {
			init: function( copy ) {
				Ractive = copy;
			},
			parse: parse,
			make: make,
			execute: execute,
			resolve: resolve,
			getName: getName
		};
	}( parse, make, execute, resolve, getName );


	// export as Common JS module...
	if ( typeof module !== "undefined" && module.exports ) {
		module.exports = rcu;
	}

	// ... or as AMD module
	else if ( typeof define === "function" && define.amd ) {
		define( function() {
			return rcu;
		} );
	}

	// ... or as browser global
	global.rcu = rcu;

}( typeof window !== 'undefined' ? window : this ) );
