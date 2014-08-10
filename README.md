# rcu - Ractive.js component utils

These utilities are designed to make it easy to implement Ractive.js component loaders in different environments. If you're not building a component loader, you probably don't need to read this page - you're probably looking for the page on [components for authors](https://github.com/ractivejs/component-spec/blob/master/authors.md) instead.

For more information about the component specification, visit the page on [components for component loader implementers](https://github.com/ractivejs/component-spec/blob/master/implementers.md), or see [here](https://github.com/ractivejs/component-spec#available-loaders) for a list of existing implementations.


## Usage

Include the version that applies to your situation - there's a `rcu.node.js` file for node.js implementations, `rcu.amd.js` for AMD-based implementations, and `rcu.js` for everything else.

As an alternative to downloading the files in this repo, you can install via npm:

```js
npm install rcu
```


## rcu.init( Ractive )

Before you can use `rcu.parse()` or `rcu.make()`, which use `Ractive.parse()` and `Ractive.extend()` respectively, you need to 'initialise' rcu by giving it a reference to `Ractive`.


## rcu.parse( source )

This function converts the `source` - the contents of an HTML component file - into an intermediate representation. Taking the [example component](https://github.com/ractivejs/component-spec/blob/master/authors.md#example-component), `rcu.parse()` would return something like this:


```js
  imports: [{ href: 'foo.html', name: 'foo' }],
  template: {v:1,t:[ /* template goes here... */] },
  css: 'p { color: red; }',
  script: /* contents of the script tag go here */,
  modules: [ 'myLibrary' ]
```


## rcu.make( source, config, callback[, errback ] )

This function converts an HTML file into a constructor that inherits from `Ractive`. It uses `rcu.parse()` internally.

* **source** - the contents of the HTML file
* **config** - an object containing the following properties:
	* **url** - the URL of the current file
	* **require** - the function used inside component scripts to load external dependencies
	* **loadImport** - a function to load child components. It takes four arguments - `name` (the name of the component), `path` (corresponds to a `<link>` tag's `href` attribute), `parentUrl` (the URL of the current file, i.e. the value of `config.url`), and `done`, which is a function that must be called with the resulting constructor.
	* loadModule (optional) - a function to load external dependencies, if they need to be loaded asynchronously. Has the same signature as `loadImport`
* **callback** - the function that will be called, with the constructor as sole argument, once the component is ready
* errback (optional) - a function to call if something goes wrong


## rcu.getName( path )

Returns a name from a path, e.g. `path/to/foo.html` becomes `foo`.

## rcu.resolve( relativePath, baseUrl )

Resolves `relativePath` against `baseUrl`, e.g.

```js
rcu.resolve( '../bar.html', 'path/to/foo.html' ) === 'path/bar.html'; // true
