var head;

if ( typeof document !== 'undefined' ) {
	head = document.getElementsByTagName( 'head' )[0];
}

export default function execute ( script, options ) {
	var oldOnerror, errored, scriptElement, dataURI;

	options = options || {};

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
				options.errback();
			}
		}

		else if ( options.onload ) {
			options.onload();
		}
	};

	oldOnerror = window.onerror;
	window.onerror = function () {
		errored = true;
	};

	head.appendChild( scriptElement );
}
