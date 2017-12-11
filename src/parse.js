import { match } from 'tippex';
import { Ractive } from './init.js';
import getName from './getName.js';
import getLinePosition from './utils/getLinePosition.js';

const requirePattern = /require\s*\(\s*(?:"([^"]+)"|'([^']+)')\s*\)/g;
const TEMPLATE_VERSION = 4;
const CACHE_PREFIX = '_rcu_';

export default function parse ( source, parseOptions, typeAttrs, identifier ) {
	if ( !Ractive ) {
		throw new Error( 'rcu has not been initialised! You must call rcu.init(Ractive) before rcu.parse()' );
	}


	let fromCache = getFromCache(source, identifier);

	const parsed = fromCache || Ractive.parse( source, Object.assign( {
		noStringify: true,
		interpolate: { script: false, style: false }
	}, parseOptions || {}, { includeLinePositions: true } ) );

	if (fromCache === undefined) {
		registerCache(source, parsed, identifier);
	}

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

	// remove line positions to reduce the size
	if ( parseOptions && parseOptions.includeLinePositions === false ) {
		let clean = ( value ) => {
			if ( !value || typeof value !== 'object' ) {
				return value;
			}

			if ( Object.prototype.hasOwnProperty.call( value, 'p' ) && Array.isArray( value.p ) && !value.p.filter( n => !Number.isInteger( n ) ).length ) {
				delete value.p;
			}

			Object.keys( value ).forEach( key => clean( value[key] ) );
			return value;
		};

		clean( result );
	}

	return result;
}


function checksum (s) {
	let chk = 0x12345678;
	let len = s.length;

	for (let i = 0; i < len; i++) {
		chk += (s.charCodeAt(i) * (i + 1));
	}

	return (chk & 0xffffffff).toString(16);
}


let getCacheKey = function (identifier, checksum) {
	return identifier ? CACHE_PREFIX + identifier : CACHE_PREFIX + checksum;
};

let registerCache = function (source, compiled, identifier) {
	try {
		let checkSum = checksum(source);
		if (typeof window != 'undefined' && typeof window.localStorage != 'undefined') {
			window.localStorage.setItem(getCacheKey(identifier, checkSum), JSON.stringify(compiled));
		}
	} catch (e) {
		//noop
	}
};

function getFromCache (source, identifier) {
	try {
		let checkSum = checksum(source);
		if (typeof window != 'undefined' && typeof window.localStorage != 'undefined') {
			let item = localStorage.getItem(getCacheKey(identifier,checkSum));
			if (item) {
				return JSON.parse(item);
			} else {
				return undefined;
			}
		}
	} catch (e) {
		//noop
	}
	return undefined;
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
