# Changelog

## 0.3.0

* Started maintaining a changelog
* `rcu.parse()` will throw an error if called before `rcu.init(Ractive)`
* No more than one top-level `<script>` tag is allowed in a component
* Parsed component now includes `scriptStart` and `scriptEnd` properties if the component definition includes a `<script>` tag, indicating the character range of the contents
* Parsed template includes line positions
* `rcu.make()` generates a dynamic sourcemap, enabling easier debugging
