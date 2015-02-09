import { encode } from 'vlq';
import SourceMap from './utils/SourceMap';

/**
 * Generates a v3 sourcemap between an original source and its built form
 * @param {object} definition - the result of `rcu.parse( originalSource )`
 * @param {object} options
 * @param {string} options.source - the name of the original source file
 * @param {number=} options.padding - the number of lines in the generated
   code that precede the script portion of the original source
 * @param {string=} options.file - the name of the generated file
 * @returns {object}
 */
export default function generateSourceMap ( definition, options = {} ) {
	var lines, mappings, padding;

	if ( !options || !options.source ) {
		throw new Error( 'You must supply an options object with a `source` property to rcu.generateSourceMap()' );
	}

	// The generated code probably includes a load of module gubbins - we don't bother
	// mapping that to anything, instead we just have a bunch of empty lines
	padding = new Array( ( options.padding || 0 ) + 1 ).join( ';' );

	lines = definition.script.split( '\n' );
	mappings = padding + lines.map( ( line, i ) => {
		if ( i === 0 ) {
			// first mapping points to code immediately following opening <script> tag
			return encode([ 0, 0, definition.scriptStart.line, definition.scriptStart.column ]);
		}

		if ( i === 1 ) {
			return encode([ 0, 0, 1, -definition.scriptStart.column ]);
		}

		return 'AACA'; // equates to [ 0, 0, 1, 0 ];
	}).join( ';' );

	return new SourceMap({
		file: options.file,
		sources: [ options.source ],
		sourcesContent: [ definition.source ],
		names: [],
		mappings
	});
}