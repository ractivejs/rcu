import getName from 'getName';

var requirePattern = /require\s*\(\s*(?:"([^"]+)"|'([^']+)')\s*\)/g;

export default function parse ( source ) {
	var parsed, template, links, imports, scripts, script, styles, match, modules, i, item;

	parsed = Ractive.parse( source, {
		noStringify: true,
		interpolateScripts: false,
		interpolateStyles: false
	});

	if ( parsed.v !== 1 ) {
		throw new Error( 'Mismatched template version! Please ensure you are using the latest version of Ractive.js in your build process as well as in your app' );
	}

	links = [];
	scripts = [];
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
				scripts.push( template.splice( i, 1 )[0] );
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

	script = scripts.map( extractFragment ).join( ';' );

	while ( match = requirePattern.exec( script ) ) {
		modules.push( match[1] || match[2] );
	}

	// TODO glue together text nodes, where applicable

	return {
		template: parsed,
		imports: imports,
		script: script,
		css: styles.map( extractFragment ).join( ' ' ),
		modules: modules
	};
}

function extractFragment ( item ) {
	return item.f;
}
