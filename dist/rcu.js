(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  global.rcu = factory()
}(this, function () { 'use strict';

  function getName(path) {
  	var pathParts, filename, lastIndex;

  	pathParts = path.split('/');
  	filename = pathParts.pop();

  	lastIndex = filename.lastIndexOf('.');
  	if (lastIndex !== -1) {
  		filename = filename.substr(0, lastIndex);
  	}

  	return filename;
  }

  /**
   * Finds the line and column position of character `char`
     in a (presumably) multi-line string
   * @param {array} lines - an array of strings, each representing
     a line of the original string
   * @param {number} char - the character index to convert
   * @returns {object}
       * @property {number} line - the zero-based line index
       * @property {number} column - the zero-based column index
       * @property {number} char - the character index that was passed in
   */


  function getLinePosition(lines, char) {
  	var line = 0;
  	var lineStart = 0;

  	var lineEnds = lines.map(function (line) {
  		var lineEnd = lineStart + line.length + 1; // +1 for the newline

  		lineStart = lineEnd;
  		return lineEnd;
  	});

  	lineStart = 0;

  	while (char >= lineEnds[line]) {
  		lineStart = lineEnds[line];
  		line += 1;
  	}

  	var column = char - lineStart;
  	return { line: line, column: column, char: char };
  }

  var requirePattern = /require\s*\(\s*(?:"([^"]+)"|'([^']+)')\s*\)/g;
  var TEMPLATE_VERSION = 3;
  function parse(source) {
  	var parsed, template, links, imports, scriptItem, script, styles, match, modules, i, item, result;

  	if (!rcu.Ractive) {
  		throw new Error('rcu has not been initialised! You must call rcu.init(Ractive) before rcu.parse()');
  	}

  	parsed = rcu.Ractive.parse(source, {
  		noStringify: true,
  		interpolate: { script: false, style: false },
  		includeLinePositions: true
  	});

  	if (parsed.v !== TEMPLATE_VERSION) {
  		throw new Error('Mismatched template version (expected ' + TEMPLATE_VERSION + ', got ' + parsed.v + ')! Please ensure you are using the latest version of Ractive.js in your build process as well as in your app');
  	}

  	links = [];
  	styles = [];
  	modules = [];

  	// Extract certain top-level nodes from the template. We work backwards
  	// so that we can easily splice them out as we go
  	template = parsed.t;
  	i = template.length;
  	while (i--) {
  		item = template[i];

  		if (item && item.t === 7) {
  			if (item.e === 'link' && (item.a && item.a.rel === 'ractive')) {
  				links.push(template.splice(i, 1)[0]);
  			}

  			if (item.e === 'script' && (!item.a || !item.a.type || item.a.type === 'text/javascript')) {
  				if (scriptItem) {
  					throw new Error('You can only have one <script> tag per component file');
  				}
  				scriptItem = template.splice(i, 1)[0];
  			}

  			if (item.e === 'style' && (!item.a || !item.a.type || item.a.type === 'text/css')) {
  				styles.push(template.splice(i, 1)[0]);
  			}
  		}
  	}

  	// Clean up template - trim whitespace left over from the removal
  	// of <link>, <style> and <script> tags from start...
  	while (/^\s*$/.test(template[0])) {
  		template.shift();
  	}

  	// ...and end
  	while (/^\s*$/.test(template[template.length - 1])) {
  		template.pop();
  	}

  	// Extract names from links
  	imports = links.map(function (link) {
  		var href = link.a.href;
  		var name = link.a.name || getName(href);

  		if (typeof name !== 'string') {
  			throw new Error('Error parsing link tag');
  		}

  		return { name: name, href: href };
  	});

  	result = {
  		source: source, imports: imports, modules: modules,
  		template: parsed,
  		css: styles.map(extractFragment).join(' '),
  		script: ''
  	};

  	// extract position information, so that we can generate source maps
  	if (scriptItem) {
  		var content = scriptItem.f[0];

  		var contentStart = source.indexOf('>', scriptItem.p[2]) + 1;

  		// we have to jump through some hoops to find contentEnd, because the contents
  		// of the <script> tag get trimmed at parse time
  		var contentEnd = contentStart + content.length + source.slice(contentStart).replace(content, '').indexOf('</script');

  		var lines = source.split('\n');

  		result.scriptStart = getLinePosition(lines, contentStart);
  		result.scriptEnd = getLinePosition(lines, contentEnd);

  		result.script = source.slice(contentStart, contentEnd);

  		while (match = requirePattern.exec(result.script)) {
  			modules.push(match[1] || match[2]);
  		}
  	}

  	return result;
  }

  function extractFragment(item) {
  	return item.f;
  }

  var _eval, isBrowser, isNode, head, Module, base64Encode;

  var SOURCE_MAPPING_URL = 'sourceMappingUrl';
  var DATA = 'data';

  // This causes code to be eval'd in the global scope
  _eval = eval;

  if ( typeof document !== 'undefined' ) {
  	isBrowser = true;
  	head = document.getElementsByTagName( 'head' )[0];
  } else if ( typeof process !== 'undefined' ) {
  	isNode = true;
  	Module = ( require.nodeRequire || require )( 'module' );
  }

  if ( typeof btoa === 'function' ) {
  	base64Encode = function ( str ) {
  		str = str.replace( /[^\x00-\x7F]/g, function ( char ) {
  			var hex = char.charCodeAt( 0 ).toString( 16 );
  			while ( hex.length < 4 ) hex = '0' + hex;

  			return '\\u' + hex;
  		});

  		return btoa( str );
  	};
  } else if ( typeof Buffer === 'function' ) {
  	base64Encode = function ( str ) {
  		return new Buffer( str, 'utf-8' ).toString( 'base64' );
  	};
  } else {
  	base64Encode = function () {};
  }

  function eval2 ( script, options ) {
  	options = options || {};

  	if ( options.sourceMap ) {
  		script += '\n//# ' + SOURCE_MAPPING_URL + '=data:application/json;charset=utf-8;base64,' + base64Encode( JSON.stringify( options.sourceMap ) );
  	}

  	else if ( options.sourceURL ) {
  		script += '\n//# sourceURL=' + options.sourceURL;
  	}

  	try {
  		return _eval( script );
  	} catch ( err ) {
  		if ( isNode ) {
  			locateErrorUsingModule( script, options.sourceURL || '' );
  			return;
  		}

  		// In browsers, only locate syntax errors. Other errors can
  		// be located via the console in the normal fashion
  		else if ( isBrowser && err.name === 'SyntaxError' ) {
  			locateErrorUsingDataUri( script );
  		}

  		throw err;
  	}
  }

  eval2.Function = function () {
  	var i, args = [], body, wrapped, options;

  	i = arguments.length;
  	while ( i-- ) {
  		args[i] = arguments[i];
  	}

  	if ( typeof args[ args.length - 1 ] === 'object' ) {
  		options = args.pop();
  	} else {
  		options = {};
  	}

  	// allow an array of arguments to be passed
  	if ( args.length === 1 && Object.prototype.toString.call( args ) === '[object Array]' ) {
  		args = args[0];
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

  function locateErrorUsingDataUri ( code ) {
  	var dataURI, scriptElement;

  	dataURI = DATA + ':text/javascript;charset=utf-8,' + encodeURIComponent( code );

  	scriptElement = document.createElement( 'script' );
  	scriptElement.src = dataURI;

  	scriptElement.onload = function () {
  		head.removeChild( scriptElement );
  	};

  	head.appendChild( scriptElement );
  }

  function locateErrorUsingModule ( code, url ) {
  	var m = new Module();

  	try {
  		m._compile( 'module.exports = function () {\n' + code + '\n};', url );
  	} catch ( err ) {
  		console.error( err );
  		return;
  	}

  	m.exports();
  }

  function clone ( obj ) {
  	var cloned = {}, key;

  	for ( key in obj ) {
  		if ( obj.hasOwnProperty( key ) ) {
  			cloned[ key ] = obj[ key ];
  		}
  	}

  	return cloned;
  }

  var charToInteger = {};
  var integerToChar = {};

  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='.split( '' ).forEach( function ( char, i ) {
  	charToInteger[ char ] = i;
  	integerToChar[ i ] = char;
  });

  function decode ( string ) {
  	var result = [],
  		len = string.length,
  		i,
  		hasContinuationBit,
  		shift = 0,
  		value = 0,
  		integer,
  		shouldNegate;

  	for ( i = 0; i < len; i += 1 ) {
  		integer = charToInteger[ string[i] ];

  		if ( integer === undefined ) {
  			throw new Error( 'Invalid character (' + string[i] + ')' );
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

  function encode ( value ) {
  	var result, i;

  	if ( typeof value === 'number' ) {
  		result = encodeInteger( value );
  	} else {
  		result = '';
  		for ( i = 0; i < value.length; i += 1 ) {
  			result += encodeInteger( value[i] );
  		}
  	}

  	return result;
  }

  function encodeInteger ( num ) {
  	var result = '', clamped;

  	if ( num < 0 ) {
  		num = ( -num << 1 ) | 1;
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

  /**
   * Encodes a string as base64
   * @param {string} str - the string to encode
   * @returns {string}
   */
  var btoa__default = btoa__btoa;

  function btoa__btoa(str) {
    return new Buffer(str).toString('base64');
  }

  var SourceMap__SourceMap = function SourceMap__SourceMap(properties) {
  	this.version = 3;

  	this.file = properties.file;
  	this.sources = properties.sources;
  	this.sourcesContent = properties.sourcesContent;
  	this.names = properties.names;
  	this.mappings = properties.mappings;
  };

  SourceMap__SourceMap.prototype = {
  	toString: function toString() {
  		return JSON.stringify(this);
  	},

  	toUrl: function toUrl() {
  		return 'data:application/json;charset=utf-8;base64,' + btoa__default(this.toString());
  	}
  };

  var SourceMap__default = SourceMap__SourceMap;

  /**
   * Generates a v3 sourcemap between an original source and its built form
   * @param {object} definition - the result of `rcu.parse( originalSource )`
   * @param {object} options
   * @param {string} options.source - the name of the original source file
   * @param {number=} options.offset - the number of lines in the generated
     code that precede the script portion of the original source
   * @param {string=} options.file - the name of the generated file
   * @returns {object}
   */

  var alreadyWarned = false;
  function generateSourceMap(definition, options) {
  	var lines, mappings, offset;

  	if (!options || !options.source) {
  		throw new Error('You must supply an options object with a `source` property to rcu.generateSourceMap()');
  	}

  	if ('padding' in options) {
  		options.offset = options.padding;

  		if (!alreadyWarned) {
  			console.log('rcu: options.padding is deprecated, use options.offset instead');
  			alreadyWarned = true;
  		}
  	}

  	// The generated code probably includes a load of module gubbins - we don't bother
  	// mapping that to anything, instead we just have a bunch of empty lines
  	offset = new Array((options.offset || 0) + 1).join(';');

  	lines = definition.script.split('\n');
  	mappings = offset + lines.map(function (line, i) {
  		if (i === 0) {
  			// first mapping points to code immediately following opening <script> tag
  			return encode([0, 0, definition.scriptStart.line, definition.scriptStart.column]);
  		}

  		if (i === 1) {
  			return encode([0, 0, 1, -definition.scriptStart.column]);
  		}

  		return 'AACA'; // equates to [ 0, 0, 1, 0 ];
  	}).join(';');

  	return new SourceMap__default({
  		file: options.file,
  		sources: [options.source],
  		sourcesContent: [definition.source],
  		names: [],
  		mappings: mappings
  	});
  }

  function make(source, config, callback, errback) {
  	var definition, url, createComponent, loadImport, imports, loadModule, modules, remainingDependencies, onloaded, ready;

  	config = config || {};

  	// Implementation-specific config
  	url = config.url || '';
  	loadImport = config.loadImport;
  	loadModule = config.loadModule;

  	definition = parse(source);

  	createComponent = function () {
  		var options, Component, factory, component, exports, prop;

  		options = {
  			template: definition.template,
  			partials: definition.partials,
  			css: definition.css,
  			components: imports
  		};

  		if (definition.script) {
  			var sourceMap = generateSourceMap(definition, {
  				source: url,
  				content: source
  			});

  			try {
  				factory = new eval2.Function('component', 'require', 'Ractive', definition.script, {
  					sourceMap: sourceMap
  				});

  				component = {};
  				factory(component, config.require, rcu.Ractive);
  				exports = component.exports;

  				if (typeof exports === 'object') {
  					for (prop in exports) {
  						if (exports.hasOwnProperty(prop)) {
  							options[prop] = exports[prop];
  						}
  					}
  				}

  				Component = rcu.Ractive.extend(options);
  			} catch (err) {
  				errback(err);
  				return;
  			}

  			callback(Component);
  		} else {
  			Component = rcu.Ractive.extend(options);
  			callback(Component);
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
  	remainingDependencies = definition.imports.length + (loadModule ? definition.modules.length : 0);

  	if (remainingDependencies) {
  		onloaded = function () {
  			if (! --remainingDependencies) {
  				if (ready) {
  					createComponent();
  				} else {
  					setTimeout(createComponent, 0); // cheap way to enforce asynchrony for a non-Zalgoesque API
  				}
  			}
  		};

  		if (definition.imports.length) {
  			if (!loadImport) {
  				throw new Error('Component definition includes imports (e.g. `<link rel="ractive" href="' + definition.imports[0].href + '">`) but no loadImport method was passed to rcu.make()');
  			}

  			imports = {};

  			definition.imports.forEach(function (toImport) {
  				loadImport(toImport.name, toImport.href, url, function (Component) {
  					imports[toImport.name] = Component;
  					onloaded();
  				});
  			});
  		}

  		if (loadModule && definition.modules.length) {
  			modules = {};

  			definition.modules.forEach(function (name) {
  				loadModule(name, name, url, function (Component) {
  					modules[name] = Component;
  					onloaded();
  				});
  			});
  		}
  	} else {
  		setTimeout(createComponent, 0);
  	}

  	ready = true;
  }

  var resolve = resolvePath;

  function resolvePath(relativePath, base) {
  	var pathParts, relativePathParts, part;

  	// If we've got an absolute path, or base is '', return
  	// relativePath
  	if (!base || relativePath.charAt(0) === '/') {
  		return relativePath;
  	}

  	// 'foo/bar/baz.html' -> ['foo', 'bar', 'baz.html']
  	pathParts = (base || '').split('/');
  	relativePathParts = relativePath.split('/');

  	// ['foo', 'bar', 'baz.html'] -> ['foo', 'bar']
  	pathParts.pop();

  	while (part = relativePathParts.shift()) {
  		if (part === '..') {
  			pathParts.pop();
  		} else if (part !== '.') {
  			pathParts.push(part);
  		}
  	}

  	return pathParts.join('/');
  }

  var rcu = {
  	init: function init(copy) {
  		rcu.Ractive = copy;
  	},

  	parse: parse,
  	make: make,
  	generateSourceMap: generateSourceMap,
  	resolve: resolve,
  	getName: getName
  };

  return rcu;

}));