var gobble = require( 'gobble' );
var path = require( 'path' );
var resolve = require( 'resolve' );
var Promise = require( 'es6-promise' ).Promise;

module.exports = gobble( 'src' )
.transform( 'babel', {
	blacklist: [ 'es6.modules', 'useStrict' ],
	sourceMap: false
})
.transform( 'esperanto-bundle', {
	entry: 'rcu',
	type: 'umd',
	name: 'rcu',
	sourceMap: false,

	resolvePath: function ( importee, importer ) {
		return new Promise( function ( fulfil, reject ) {
			var callback = function ( err, result ) {
				if ( err ) {
					reject( err );
				} else {
					fulfil( result );
				}
			};

			resolve( importee, {
				basedir: path.dirname( importer ),
				packageFilter: function ( pkg ) {
					if ( pkg[ 'jsnext:main' ] ) {
						pkg.main = pkg[ 'jsnext:main' ];
						return pkg;
					}

					var err = new Error( 'package ' + pkg.name + ' does not supply a jsnext:main field' );
					err.code = 'ENOENT'; // hack
					reject( err );
					return {};
				}
			}, callback );
		});
	}
});