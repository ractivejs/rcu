import eval2 from 'eval2';
import { Ractive } from './init.js';
import parse from './parse.js';
import generateSourceMap from './generateSourceMap.js';

export default function make ( source, config, callback, errback ) {
	config = config || {};

	// Implementation-specific config
	const url        = config.url || '';
	const loadImport = config.loadImport;
	const loadModule = config.loadModule;
	const parseOptions = config.parseOptions;
	const typeAttrs = config.typeAttrs;

	const definition = parse( source, parseOptions, typeAttrs );

	let imports = {};

	function createComponent () {
		let options = {
			template: definition.template,
			partials: definition.partials,
			css: definition.css,
			components: imports
		};

		let Component;

		if ( definition.script ) {
			let sourceMap = generateSourceMap( definition, {
				source: url,
				content: source
			});

			try {
				const factory = new eval2.Function( 'component', 'require', 'Ractive', definition.script, {
					sourceMap
				});

				let component = {};
				factory( component, config.require, Ractive );
				let exports = component.exports;

				if ( typeof exports === 'object' ) {
					for ( let prop in exports ) {
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
	}

	// If the definition includes sub-components e.g.
	//     <link rel='ractive' href='foo.html'>
	//
	// ...then we need to load them first, using the loadImport method
	// specified by the implementation.
	//
	// In some environments (e.g. AMD) the same goes for modules, which
	// most be loaded before the script can execute
	let remainingDependencies = ( definition.imports.length + ( loadModule ? definition.modules.length : 0 ) );
	let ready = false;

	if ( remainingDependencies ) {
		const onloaded = () => {
			if ( !--remainingDependencies ) {
				if ( ready ) {
					createComponent();
				} else {
					setTimeout( createComponent ); // cheap way to enforce asynchrony for a non-Zalgoesque API
				}
			}
		};

		if ( definition.imports.length ) {
			if ( !loadImport ) {
				throw new Error( `Component definition includes imports (e.g. <link rel="ractive" href="${definition.imports[0].href}">) but no loadImport method was passed to rcu.make()` );
			}

			definition.imports.forEach( function ( toImport ) {
				loadImport( toImport.name, toImport.href, url, function ( Component ) {
					imports[ toImport.name ] = Component;
					onloaded();
				});
			});
		}

		if ( loadModule && definition.modules.length ) {
			definition.modules.forEach( name => {
				loadModule( name, name, url, onloaded );
			});
		}
	} else {
		setTimeout( createComponent, 0 );
	}

	ready = true;
}
