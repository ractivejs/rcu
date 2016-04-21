# rcu changelog

## 0.8.2

* Update build process to use Bublé
* Update dependencies

## 0.8.1

* Tidy up build slightly

## 0.8.0

* Move bundled `dependencies` to `devDependencies` ([#24](https://github.com/ractivejs/rcu/issues/24))

## 0.7.0

* Update dependencies (particularly tippex)

## 0.6.2

* Require statements are deduplicated ([#18](https://github.com/ractivejs/rcu/issues/18))

## 0.6.1

* Add missing development dependency

## 0.6.0

* `generateSourceMap` generates a hires (character-accurate) sourcemap by default
* Robust dependency detection ([#4](https://github.com/ractivejs/rcu/issues/4))

## 0.5.1

* Include correct files in package...

## 0.5.0

* Allow empty `<script>` tags ([#14](https://github.com/ractivejs/rcu/issues/14))
* Extensive tidying up

## 0.4.2

* Fix schoolboy error

## 0.4.1

* Fix `rcu.generateSourceMap` bug resulting in incorrect sourcemaps

## 0.4.0

* Update expected template version to 3, to match Ractive 0.7.0
* Use esperanto to generate UMD export, and distribute ES6 modules to ES6-aware systems via `jsnext:main` field in package.json
* Add `rcu.generateSourceMap()` method

## 0.3.0

* Started maintaining a changelog
* `rcu.parse()` will throw an error if called before `rcu.init(Ractive)`
* No more than one top-level `<script>` tag is allowed in a component
* Parsed component now includes `scriptStart` and `scriptEnd` properties if the component definition includes a `<script>` tag, indicating the character range of the contents
* Parsed template includes line positions
* `rcu.make()` generates a dynamic sourcemap, enabling easier debugging
