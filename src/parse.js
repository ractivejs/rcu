import { Ractive } from './init.js';
import getName from './getName.js';
import getLinePosition from './utils/getLinePosition.js';

const requirePattern = /require\s*\(\s*(?:"([^"]+)"|'([^']+)')\s*\)/g;
const TEMPLATE_VERSION = 3;

export default function parse ( source ) {
	if ( !Ractive ) {
		throw new Error( 'rcu has not been initialised! You must call rcu.init(Ractive) before rcu.parse()' );
	}

	const parsed = Ractive.parse( source, {
		noStringify: true,
		interpolate: { script: false, style: false },
		includeLinePositions: true
	});

	if ( parsed.v !== TEMPLATE_VERSION ) {
		throw new Error( `Mismatched template version (expected ${TEMPLATE_VERSION}, got ${parsed.v})! Please ensure you are using the latest version of Ractive.js in your build process as well as in your app` );
	}

	let links = [];
	let styles = [];
	let modules = [];

	// Extract certain top-level nodes from the template. We work backwards
	// so that we can easily splice them out as we go
	let template = parsed.t;
	let i = template.length;
	let scriptItem;

	while ( i-- ) {
		const item = template[i];

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
	while ( /^\s*$/.test( template[0] ) ) template.shift();

	// ...and end
	while ( /^\s*$/.test( template[ template.length - 1 ] ) ) template.pop();

	// Extract names from links
	const imports = links.map( link => {
		const href = link.a.href;
		const name = link.a.name || getName( href );

		if ( typeof name !== 'string' ) {
			throw new Error( 'Error parsing link tag' );
		}

		return { name, href };
	});

	let result = {
		source, imports, modules,
		template: parsed,
		css: styles.map( item => item.f ).join( ' ' ),
		script: ''
	};

	// extract position information, so that we can generate source maps
	if ( scriptItem && scriptItem.f ) {
		const content = scriptItem.f[0];

		const contentStart = source.indexOf( '>', scriptItem.p[2] ) + 1;

		// we have to jump through some hoops to find contentEnd, because the contents
		// of the <script> tag get trimmed at parse time
		const contentEnd = contentStart + content.length + source.slice( contentStart ).replace( content, '' ).indexOf( '</script' );

		const lines = source.split( '\n' );

		result.scriptStart = getLinePosition( lines, contentStart );
		result.scriptEnd = getLinePosition( lines, contentEnd );

		result.script = source.slice( contentStart, contentEnd );

		let match;
		while ( match = requirePattern.exec( result.script ) ) {
			modules.push( match[1] || match[2] );
		}
	}

	return result;
}
