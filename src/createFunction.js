var head, uid = 0;

if ( typeof document !== 'undefined' ) {
	head = document.getElementsByTagName( 'head' )[0];
}

export default function createFunction ( code, options ) {
	var oldOnerror, errored, scriptElement, dataURI, functionName, script = '';

	options = options || {};

	// generate a unique function name
	functionName = 'rvc_' + uid++ + '_' + Math.floor( Math.random() * 100000 );

	if ( options.message ) {
		script += '/*\n' + options.message + '*/\n\n';
	}

	script += functionName + ' = function ( component, require, Ractive ) {\n\n' + code + '\n\n};';

	if ( options.sourceURL ) {
		script += '\n//# sourceURL=' + options.sourceURL;
	}

	dataURI = 'data:text/javascript;charset=utf-8,' + encodeURIComponent( script );

	scriptElement = document.createElement( 'script' );
	scriptElement.src = dataURI;

	scriptElement.onload = function () {
		head.removeChild( scriptElement );
		window.onerror = oldOnerror;

		if ( errored ) {
			if ( options.errback ) {
				options.errback( 'Syntax error in component script' );
			}
		}

		else if ( options.onload ) {
			options.onload( window[ functionName ] );
			delete window[ functionName ];
		}
	};

	oldOnerror = window.onerror;
	window.onerror = function () {
		errored = true;
	};

	head.appendChild( scriptElement );
}
