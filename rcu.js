/*

	rcu (Ractive component utils) - 0.3.0 - 2014-09-28
	==============================================================

	Copyright 2014 Rich Harris and contributors
	Released under the MIT license.

*/

( function( global ) {

	'use strict';

	var Ractive;

	var getName, parse, eval2, _vlq_, make, resolve, rcu;
	getName = function getName( path ) {
		var pathParts, filename, lastIndex;
		pathParts = path.split( '/' );
		filename = pathParts.pop();
		lastIndex = filename.lastIndexOf( '.' );
		if ( lastIndex !== -1 ) {
			filename = filename.substr( 0, lastIndex );
		}
		return filename;
	};
	parse = function( getName ) {
		var __export;
		var requirePattern = /require\s*\(\s*(?:"([^"]+)"|'([^']+)')\s*\)/g;
		__export = function parse( source ) {
			var parsed, template, links, imports, scriptItem, script, styles, match, modules, i, item, result;
			if ( !Ractive ) {
				throw new Error( 'rcu has not been initialised! You must call rcu.init(Ractive) before rcu.parse()' );
			}
			parsed = Ractive.parse( source, {
				noStringify: true,
				interpolate: {
					script: false,
					style: false
				},
				includeLinePositions: true
			} );
			if ( parsed.v !== 1 ) {
				throw new Error( 'Mismatched template version! Please ensure you are using the latest version of Ractive.js in your build process as well as in your app' );
			}
			links = [];
			styles = [];
			modules = [];
			// Extract certain top-level nodes from the template. We work backwards
			// so that we can easily splice them out as we go
			template = parsed.t;
			i = template.length;
			while ( i-- ) {
				item = template[ i ];
				if ( item && item.t === 7 ) {
					if ( item.e === 'link' && ( item.a && item.a.rel === 'ractive' ) ) {
						links.push( template.splice( i, 1 )[ 0 ] );
					}
					if ( item.e === 'script' && ( !item.a || !item.a.type || item.a.type === 'text/javascript' ) ) {
						if ( scriptItem ) {
							throw new Error( 'You can only have one <script> tag per component file' );
						}
						scriptItem = template.splice( i, 1 )[ 0 ];
					}
					if ( item.e === 'style' && ( !item.a || !item.a.type || item.a.type === 'text/css' ) ) {
						styles.push( template.splice( i, 1 )[ 0 ] );
					}
				}
			}
			// Clean up template - trim whitespace left over from the removal
			// of <link>, <style> and <script> tags from start...
			while ( /^\s*$/.test( template[ 0 ] ) ) {
				template.shift();
			}
			// ...and end
			while ( /^\s*$/.test( template[ template.length - 1 ] ) ) {
				template.pop();
			}
			// Extract names from links
			imports = links.map( function( link ) {
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
			} );
			result = {
				template: parsed,
				imports: imports,
				css: styles.map( extractFragment ).join( ' ' ),
				script: '',
				modules: modules
			};
			// extract position information, so that we can generate source maps
			if ( scriptItem ) {
				( function() {
					var contentStart, contentEnd, lines;
					contentStart = source.indexOf( '>', scriptItem.p[ 2 ] ) + 1;
					contentEnd = contentStart + scriptItem.f[ 0 ].length;
					lines = source.split( '\n' );
					result.scriptStart = getPosition( lines, contentStart );
					result.scriptEnd = getPosition( lines, contentEnd );
				}() );
				// Glue scripts together, for convenience
				result.script = scriptItem.f[ 0 ];
				while ( match = requirePattern.exec( script ) ) {
					modules.push( match[ 1 ] || match[ 2 ] );
				}
			}
			return result;
		};

		function extractFragment( item ) {
			return item.f;
		}

		function getPosition( lines, char ) {
			var lineEnds, lineNum = 0,
				lineStart = 0,
				columnNum;
			lineEnds = lines.map( function( line ) {
				var lineEnd = lineStart + line.length + 1;
				// +1 for the newline
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
		return __export;
	}( getName );
	/*

	eval2.js - 0.2.0 - 2014-09-28
	==============================================================

	Copyright 2014 Rich Harris
	Released under the MIT license.

*/
	eval2 = function() {
		var _eval, isBrowser, isNode, head, Module, base64Encode;
		// This causes code to be eval'd in the global scope
		_eval = eval;
		if ( typeof document !== 'undefined' ) {
			isBrowser = true;
			head = document.getElementsByTagName( 'head' )[ 0 ];
		} else if ( typeof process !== 'undefined' ) {
			isNode = true;
			Module = ( require.nodeRequire || require )( 'module' );
		}
		if ( typeof btoa === 'function' ) {
			base64Encode = btoa;
		} else if ( typeof Buffer === 'function' ) {
			base64Encode = function( str ) {
				return new Buffer( str, 'utf-8' ).toString( 'base64' );
			};
		} else {
			base64Encode = function() {};
		}

		function eval2( script, options ) {
			options = options || {};
			if ( options.sourceMap ) {
				script += '\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,' + base64Encode( JSON.stringify( options.sourceMap ) );
			} else if ( options.sourceURL ) {
				script += '\n//# sourceURL=' + options.sourceURL;
			}
			try {
				return _eval( script );
			} catch ( err ) {
				if ( isNode ) {
					locateErrorUsingModule( script, options.sourceURL || '' );
					return;
				} else if ( isBrowser && err.name === 'SyntaxError' ) {
					locateErrorUsingDataUri( script );
				}
				throw err;
			}
		}
		eval2.Function = function() {
			var i, args = [],
				body, wrapped, options;
			i = arguments.length;
			while ( i-- ) {
				args[ i ] = arguments[ i ];
			}
			if ( typeof args[ args.length - 1 ] === 'object' ) {
				options = args.pop();
			} else {
				options = {};
			}
			if ( options.sourceMap ) {
				options.sourceMap = clone( options.sourceMap );
				// shift everything a line down, to accommodate `(function (...) {`
				options.sourceMap.mappings = ';' + options.sourceMap.mappings;
			}
			body = args.pop();
			wrapped = '(function (' + args.join( ', ' ) + ') {\n' + body + '\n})';
			return eval2( wrapped, options );
		};

		function locateErrorUsingDataUri( code ) {
			var dataURI, scriptElement;
			dataURI = 'data:text/javascript;charset=utf-8,' + encodeURIComponent( code );
			scriptElement = document.createElement( 'script' );
			scriptElement.src = dataURI;
			scriptElement.onload = function() {
				head.removeChild( scriptElement );
			};
			head.appendChild( scriptElement );
		}

		function locateErrorUsingModule( code, url ) {
			var m = new Module();
			try {
				m._compile( 'module.exports = function () {\n' + code + '\n};', url );
			} catch ( err ) {
				console.error( err );
				return;
			}
			m.exports();
		}

		function clone( obj ) {
			var cloned = {}, key;
			for ( key in obj ) {
				if ( obj.hasOwnProperty( key ) ) {
					cloned[ key ] = obj[ key ];
				}
			}
			return cloned;
		}
		return eval2;
	}();
	( function( global ) {
		var vlq = {
			encode: encode,
			decode: decode
		}, charToInteger, integerToChar;
		charToInteger = {};
		integerToChar = {};
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='.split( '' ).forEach( function( char, i ) {
			charToInteger[ char ] = i;
			integerToChar[ i ] = char;
		} );

		function encode( value ) {
			var result;
			if ( typeof value === 'number' ) {
				result = encodeInteger( value );
			} else if ( Array.isArray( value ) ) {
				result = '';
				value.forEach( function( num ) {
					result += encodeInteger( num );
				} );
			} else {
				throw new Error( 'vlq.encode accepts an integer or an array of integers' );
			}
			return result;
		}

		function encodeInteger( num ) {
			var result = '',
				clamped;
			if ( num < 0 ) {
				num = -num << 1 | 1;
			} else {
				num <<= 1;
			}
			do {
				clamped = num & 31;
				num >>= 5;
				if ( num > 0 ) {
					clamped |= 32;
				}
				result += integerToChar[ clamped ];
			} while ( num > 0 );
			return result;
		}

		function decode( string ) {
			var result = [],
				len = string.length,
				i, hasContinuationBit, shift = 0,
				value = 0;
			for ( i = 0; i < len; i += 1 ) {
				integer = charToInteger[ string[ i ] ];
				if ( integer === undefined ) {
					throw new Error( 'Invalid character (' + string[ i ] + ')' );
				}
				hasContinuationBit = integer & 32;
				integer &= 31;
				value += integer << shift;
				if ( hasContinuationBit ) {
					shift += 5;
				} else {
					shouldNegate = value & 1;
					value >>= 1;
					result.push( shouldNegate ? -value : value );
					// reset
					value = shift = 0;
				}
			}
			return result;
		}
		// Export as AMD
		if ( true ) {
			_vlq_ = function() {
				return typeof vlq === 'function' ? vlq() : vlq;
			}();
		} else if ( typeof module !== 'undefined' ) {
			module.exports = vlq;
		} else {
			global.vlq = vlq;
		}
	}( typeof window !== 'undefined' ? window : this ) );
	make = function( parse, eval2, vlq ) {
		return function make( source, config, callback, errback ) {
			var definition, url, createComponent, loadImport, imports, loadModule, modules, remainingDependencies, onloaded, ready;
			config = config || {};
			// Implementation-specific config
			url = config.url || '';
			loadImport = config.loadImport;
			loadModule = config.loadModule;
			definition = parse( source );
			createComponent = function() {
				var options, Component, mappings, factory, component, exports, prop;
				options = {
					template: definition.template,
					partials: definition.partials,
					css: definition.css,
					components: imports
				};
				if ( definition.script ) {
					mappings = definition.script.split( '\n' ).map( function( line, i ) {
						var segment, lineNum, columnNum;
						lineNum = i === 0 ? definition.scriptStart.line + i : 1;
						columnNum = i === 0 ? definition.scriptStart.column : i === 1 ? -definition.scriptStart.column : 0;
						// only one segment per line!
						segment = [
							0,
							0,
							lineNum,
							columnNum
						];
						return vlq.encode( segment );
					} ).join( ';' );
					try {
						factory = new eval2.Function( 'component', 'require', 'Ractive', definition.script, {
							sourceMap: {
								version: 3,
								sources: [ url ],
								sourcesContent: [ source ],
								names: [],
								mappings: mappings
							}
						} );
						component = {};
						factory( component, config.require, Ractive );
						exports = component.exports;
						if ( typeof exports === 'object' ) {
							for ( prop in exports ) {
								if ( exports.hasOwnProperty( prop ) ) {
									options[ prop ] = exports[ prop ];
								}
							}
						}
						Component = Ractive.extend( options );
					} catch ( err ) {
						errback( err );
						return;
					}
					callback( Component );
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
	}( parse, eval2, _vlq_ );
	resolve = function resolvePath( relativePath, base ) {
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
	};
	rcu = {
		init: function( copy ) {
			Ractive = copy;
		},
		parse: parse,
		make: make,
		resolve: resolve,
		getName: getName
	};
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
