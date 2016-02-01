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
export default function getLinePosition ( lines, char ) {
	let line = 0;
	let lineStart = 0;

	const lineEnds = lines.map( line => {
		lineStart += line.length + 1; // +1 for the newline
		return lineStart;
	});

	lineStart = 0;

	while ( char >= lineEnds[ line ] ) {
		lineStart = lineEnds[ line ];
		line += 1;
	}

	const column = char - lineStart;
	return { line, column, char };
}
