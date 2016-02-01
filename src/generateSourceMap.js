import { encode } from 'vlq';
import SourceMap from './utils/SourceMap.js';

let alreadyWarned = false;

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
export default function generateSourceMap ( definition, options = {} ) {
	if ( 'padding' in options ) {
		options.offset = options.padding;

		if ( !alreadyWarned ) {
			console.warn( 'rcu: options.padding is deprecated, use options.offset instead' ); // eslint-disable-line no-console
			alreadyWarned = true;
		}
	}

	let mappings = '';

	if ( definition.scriptStart ) {
		// The generated code probably includes a load of module gubbins - we don't bother
		// mapping that to anything, instead we just have a bunch of empty lines
		const offset = new Array( ( options.offset || 0 ) + 1 ).join( ';' );
		const lines = definition.script.split( '\n' );

		let encoded;

		if ( options.hires !== false ) {
			let previousLineEnd = -definition.scriptStart.column;

			encoded = lines.map( ( line, i ) => {
				const lineOffset = i === 0 ? definition.scriptStart.line : 1;

				let encoded = encode([ 0, 0, lineOffset, -previousLineEnd ]);

				const lineEnd = line.length;

				for ( let j = 1; j < lineEnd; j += 1 ) {
					encoded += ',CAAC';
				}

				previousLineEnd = i === 0 ?
					lineEnd + definition.scriptStart.column :
					Math.max( 0, lineEnd - 1 );

				return encoded;
			});
		} else {
			encoded = lines.map( ( line, i ) => {
				if ( i === 0 ) {
					// first mapping points to code immediately following opening <script> tag
					return encode([ 0, 0, definition.scriptStart.line, definition.scriptStart.column ]);
				}

				if ( i === 1 ) {
					return encode([ 0, 0, 1, -definition.scriptStart.column ]);
				}

				return 'AACA'; // equates to [ 0, 0, 1, 0 ];
			});
		}

		mappings = offset + encoded.join( ';' );
	}

	return new SourceMap({
		file: options.file || null,
		sources: [ options.source || null ],
		sourcesContent: [ definition.source ],
		names: [],
		mappings
	});
}
