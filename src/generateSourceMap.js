import { encode } from 'vlq';
import SourceMap from './utils/SourceMap';

export default function generateSourceMap ( source, options = {} ) {
	var lines, mappings, padding;

	if ( !options || !options.source ) {
		throw new Error( 'You must supply an options object with a `source` property to rcu.generateSourceMap()' );
	}

	// The generated code probably includes a load of module gubbins - we don't bother
	// mapping that to anything, instead we just have a bunch of empty lines
	padding = new Array( ( options.padding || 0 ) + 1 ).join( ';' );

	lines = source.code.split( '\n' );
	mappings = padding + lines.map( ( line, i ) => {
		var segment, sourceCodeLine, sourceCodeColumn;

		if ( i === 0 ) {
			// first mapping points to code immediately following opening <script> tag
			sourceCodeLine = source.start.line;
			sourceCodeColumn = source.start.column;
		} else {
			sourceCodeLine = 1; // relative, not absolute (i.e. each line increments by one)
			sourceCodeColumn = i === 1 ? -source.start.column : 0; // if this is the second line, we need to reset
		}

		// only one segment per line!
		segment = [
			0,                // column of generated (.js) code in which segment starts
			0,                // index of source (.html) file
			sourceCodeLine,   // zero-based index of line in source (.html) file corresponding to this line
			sourceCodeColumn  // zero-based index of column in source (.html) file corresponding to this line
		];

		return encode( segment );
	}).join( ';' );

	return new SourceMap({
		file: options.file,
		sources: [ options.source ],
		sourcesContent: options.content ? [ options.content ] : [],
		names: [],
		mappings
	});
}