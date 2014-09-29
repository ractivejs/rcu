import getName from 'getName';

var requirePattern = /require\s*\(\s*(?:"([^"]+)"|'([^']+)')\s*\)/g;

export default function parse ( source ) {
	var parsed, template, links, imports, scriptItem, script, styles, match, modules, i, item, result;

	if ( !Ractive ) {
		throw new Error( 'rcu has not been initialised! You must call rcu.init(Ractive) before rcu.parse()' );
	}

	parsed = Ractive.parse( source, {
		noStringify: true,
		interpolate: { script: false, style: false },
		includeLinePositions: true
	});

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

		while ( match = requirePattern.exec( script ) ) {
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