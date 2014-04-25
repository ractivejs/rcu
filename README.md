rcu - Ractive.js component utils
================================

These utilities are designed to make it easy to implement Ractive.js component loaders in different environments. See [ractivejs/component-spec](https://github.com/ractivejs/component-spec) for the up-to-date spec (for both users and implementers).

Implementations
---------------

* [ractive-load](https://github.com/ractivejs/ractive-load) - standalone plugin
* [requirejs-ractive](https://github.com/ractivejs/requirejs-ractive) - for use with [Require.js](http://requirejs.org/)
* [ractify](https://github.com/marcello3d/node-ractify/) by [marcello3d](https://github.com/marcello3d) - for use with [Browserify](http://browserify.org/)



Usage (for implementers)
------------------------

Include the version that applies to your situation - there's a `rcu.node.js` file for node.js implementations, `rcu.amd.js` for AMD-based implementations, and `rcu.js` for everything else.
