# Changelog

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
