export default function getName ( path ) {
	let pathParts = path.split( '/' );
	let filename = pathParts.pop();

	const lastIndex = filename.lastIndexOf( '.' );
	if ( lastIndex !== -1 ) filename = filename.substr( 0, lastIndex );

	return filename;
}
