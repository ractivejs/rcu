(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('eval2'), require('vlq')) :
	typeof define === 'function' && define.amd ? define(['eval2', 'vlq'], factory) :
	global.rcu = factory(global.eval2, global.vlq)
}(this, function (eval2, vlq) { 'use strict';

	function getName ( path ) {
		var pathParts, filename, lastIndex;

		pathParts = path.split( '/' );
		filename = pathParts.pop();

		lastIndex = filename.lastIndexOf( '.' );
		if ( lastIndex !== -1 ) {
			filename = filename.substr( 0, lastIndex );
		}

		return filename;
	}

	var requirePattern = /require\s*\(\s*(?:"([^"]+)"|'([^']+)')\s*\)/g;
	var TEMPLATE_VERSION = 3;

	function parse ( source ) {
		var parsed, template, links, imports, scriptItem, script, styles, match, modules, i, item, result;

		if ( !rcu.Ractive ) {
			throw new Error( 'rcu has not been initialised! You must call rcu.init(Ractive) before rcu.parse()' );
		}

		parsed = rcu.Ractive.parse( source, {
			noStringify: true,
			interpolate: { script: false, style: false },
			includeLinePositions: true
		});

		if ( parsed.v !== TEMPLATE_VERSION ) {
			throw new Error( 'Mismatched template version (expected ' + TEMPLATE_VERSION + ', got ' + parsed.v + ')! Please ensure you are using the latest version of Ractive.js in your build process as well as in your app' );
		}

		links = [];
		styles = [];
		modules = [];

		// Extract certain top-level nodes from the template. We work backwards
		// so that we can easily splice them out as we go
		template = parsed.t;
		i = template.length;
		while ( i-- ) {
			item = template[i];

			if ( item && item.t === 7 ) {
				if ( item.e === 'link' && ( item.a && item.a.rel === 'ractive' ) ) {
					links.push( template.splice( i, 1 )[0] );
				}

				if ( item.e === 'script' && ( !item.a || !item.a.type || item.a.type === 'text/javascript' ) ) {
					if ( scriptItem ) {
						throw new Error( 'You can only have one <script> tag per component file' );
					}
					scriptItem = template.splice( i, 1 )[0];
				}

				if ( item.e === 'style' && ( !item.a || !item.a.type || item.a.type === 'text/css' ) ) {
					styles.push( template.splice( i, 1 )[0] );
				}
			}
		}

		// Clean up template - trim whitespace left over from the removal
		// of <link>, <style> and <script> tags from start...
		while ( /^\s*$/.test( template[0] ) ) {
			template.shift();
		}

		// ...and end
		while ( /^\s*$/.test( template[ template.length - 1 ] ) ) {
			template.pop();
		}

		// Extract names from links
		imports = links.map( function ( link ) {
			var href, name;

			href = link.a.href;
			name = link.a.name || getName( href );

			if ( typeof name !== 'string' ) {
				throw new Error( 'Error parsing link tag' );
			}

			return {
				name: name,
				href: href
			};
		});

		result = {
			template: parsed,
			imports: imports,
			css: styles.map( extractFragment ).join( ' ' ),
			script: '',
			modules: modules
		};

		// extract position information, so that we can generate source maps
		if ( scriptItem ) {
			(function () {
				var contentStart, contentEnd, lines;

				contentStart = source.indexOf( '>', scriptItem.p[2] ) + 1;
				contentEnd = contentStart + scriptItem.f[0].length;

				lines = source.split( '\n' );

				result.scriptStart = getPosition( lines, contentStart );
				result.scriptEnd = getPosition( lines, contentEnd );
			}());

			// Glue scripts together, for convenience
			result.script = scriptItem.f[0];

			while ( match = requirePattern.exec( result.script ) ) {
				modules.push( match[1] || match[2] );
			}
		}

		return result;
	}

	function extractFragment ( item ) {
		return item.f;
	}

	function getPosition ( lines, char ) {
		var lineEnds, lineNum = 0, lineStart = 0, columnNum;

		lineEnds = lines.map( function ( line ) {
			var lineEnd = lineStart + line.length + 1; // +1 for the newline

			lineStart = lineEnd;
			return lineEnd;
		}, 0 );

		while ( char >= lineEnds[ lineNum ] ) {
			lineStart = lineEnds[ lineNum ];
			lineNum += 1;
		}

		columnNum = char - lineStart;
		return {
			line: lineNum,
			column: columnNum,
			char: char
		};
	}

	function make ( source, config, callback, errback ) {
		var definition,
			url,
			createComponent,
			loadImport,
			imports,
			loadModule,
			modules,
			remainingDependencies,
			onloaded,
			ready;

		config = config || {};

		// Implementation-specific config
		url        = config.url || '';
		loadImport = config.loadImport;
		loadModule = config.loadModule;

		definition = parse( source );

		createComponent = function () {
			var options, Component, mappings, factory, component, exports, prop;

			options = {
				template: definition.template,
				partials: definition.partials,
				css: definition.css,
				components: imports
			};

			if ( definition.script ) {
				mappings = definition.script.split( '\n' ).map( function ( line, i ) {
					var segment, lineNum, columnNum;

					lineNum = ( i === 0 ? definition.scriptStart.line + i : 1 );
					columnNum = ( i === 0 ? definition.scriptStart.column : i === 1 ? -definition.scriptStart.column : 0 );

					// only one segment per line!
					segment = [ 0, 0, lineNum, columnNum ];

					return vlq.encode( segment );
				}).join( ';' );

				try {
					factory = new eval2.Function( 'component', 'require', 'Ractive', definition.script, {
						sourceMap: {
							version: 3,
							sources: [ url ],
							sourcesContent: [ source ],
							names: [],
							mappings: mappings
						}
					});

					component = {};
					factory( component, config.require, rcu.Ractive );
					exports = component.exports;

					if ( typeof exports === 'object' ) {
						for ( prop in exports ) {
							if ( exports.hasOwnProperty( prop ) ) {
								options[ prop ] = exports[ prop ];
							}
						}
					}

					Component = rcu.Ractive.extend( options );
				} catch ( err ) {
					errback( err );
					return;
				}

				callback( Component );
			} else {
				Component = rcu.Ractive.extend( options );
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

	function resolvePath ( relativePath, base ) {
		var pathParts, relativePathParts, part;

		// If we've got an absolute path, or base is '', return
		// relativePath
		if ( !base || relativePath.charAt( 0 ) === '/' ) {
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
	}

	var rcu = {
		init: function ( copy ) {
			rcu.Ractive = copy;
		},

		parse: parse,
		make: make,
		resolve: resolvePath,
		getName: getName
	};

	return rcu;

}));