export default function resolvePath ( relativePath, base ) {
	var pathParts, relativePathParts, part;

	// If we've got an absolute path, or base is '', return
	// relativePath
	if ( !base || relativePath.charAt( 0 ) === '/' ) {
		return relativePath;
	}

	// 'foo/bar/baz.html' -> ['foo', 'bar', 'baz.html']
	pathParts = ( base || '' ).split( '/' );
	relativePathParts = relativePath.split( '/' );

	// ['foo', 'bar', 'baz.html'] -> ['foo', 'bar']
	pathParts.pop();

	while ( part = relativePathParts.shift() ) {
		if ( part === '..' ) {
			pathParts.pop();
		} else if ( part !== '.' ) {
			pathParts.push( part );
		}
	}

	return pathParts.join( '/' );
}
