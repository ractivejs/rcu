import { match } from 'tippex';
import { Ractive } from './init.js';
import getName from './getName.js';
import getLinePosition from './utils/getLinePosition.js';

const requirePattern = /require\s*\(\s*(?:"([^"]+)"|'([^']+)')\s*\)/g;
const TEMPLATE_VERSION = 4;

export default function parse ( source, parseOptions, typeAttrs ) {
	if ( !Ractive ) {
		throw new Error( 'rcu has not been initialised! You must call rcu.init(Ractive) before rcu.parse()' );
	}

	const parsed = Ractive.parse( source, Object.assign( {
		noStringify: true,
		interpolate: { script: false, style: false },
		includeLinePositions: true
	}, parseOptions || {} ) );

	if ( parsed.v !== TEMPLATE_VERSION ) {
		console.warn( `Mismatched template version (expected ${TEMPLATE_VERSION}, got ${parsed.v})! Please ensure you are using the latest version of Ractive.js in your build process as well as in your app` ); // eslint-disable-line no-console
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
			let attr = getAttr( 'rel', item );
			if ( item.e === 'link' && attr === 'ractive' ) {
				links.push( template.splice( i, 1 )[0] );
			}

			attr = getAttr( 'type', item );
			if ( item.e === 'script' && ( !attr || attr === ( typeAttrs && typeAttrs.js ? typeAttrs.js : 'text/javascript' ) ) ) {
				if ( scriptItem ) {
					throw new Error( 'You can only have one <script> tag per component file' );
				}
				scriptItem = template.splice( i, 1 )[0];
			}

			if ( item.e === 'style' && ( !attr || attr === ( typeAttrs && typeAttrs.css ? typeAttrs.css : 'text/css' ) ) ) {
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
		const href = getAttr( 'href', link );
		const name = getAttr( 'name', link ) || getName( href );

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

		match( result.script, requirePattern, ( match, doubleQuoted, singleQuoted ) => {
			const source = doubleQuoted || singleQuoted;
			if ( !~modules.indexOf( source ) ) modules.push( source );
		});
	}

	return result;
}

function getAttr ( name, node ) {
	if ( node.a && node.a[name] ) return node.a[name];
	else if ( node.m ) {
		let i = node.m.length;
		while ( i-- ) {
			const a = node.m[i];
			// plain attribute
			if ( a.t === 13 ) {
				if ( a.n === name ) return a.f;
			}
		}
	}
}
