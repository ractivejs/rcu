
// export as Common JS module...
if ( typeof module !== "undefined" && module.exports ) {
	module.exports = rcu;
}

// ... or as AMD module
else if ( typeof define === "function" && define.amd ) {
	define( function () {
		return rcu;
	});
}

// ... or as browser global
global.rcu = rcu;

}( typeof window !== 'undefined' ? window : this ));
