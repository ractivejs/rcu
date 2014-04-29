module.exports = {
	files: [ 'src/**/*.js' ],
	options: {
		esnext: true,
		boss: true,
		eqnull: true,
		evil: true,
		laxbreak: true,
		proto: true,
		smarttabs: true,
		strict: false,
		undef: true,
		unused: true,
		'-W018': true,
		'-W041': false,
		globals: {
			define: true,
			module: true,
			require: true,
			setInterval: true,
			setTimeout: true,
			Ractive: true,
			document: true,
			window: true
		}
	}
};
