# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [2.0.0](https://github.com/castastrophe/postcss-dropunusedvars/compare/v1.2.1...v2.0.0) (2023-06-05)

### BREAKING CHANGES

BREAKING CHANGE: a new fix flag is available in the options object
to configure if the properties should be removed or just reported.

# [1.2.1](https://github.com/castastrophe/postcss-dropunusedvars/compare/v1.2.0...v1.2.1) (2021-09-29)

**Note:** Version bump only for package postcss-dropunusedvars

# [1.2.0](https://github.com/castastrophe/postcss-dropunusedvars/compare/v1.1.0...v1.2.0) (2021-03-10)

### Features

* drop unused vars, even if other vars once referred to them ([772851e](https://github.com/adobe/spectrum-css/commit/772851e))

### 🐛 Bug fixes

* correct PostCSS plugin names ([81ad868](https://github.com/adobe/spectrum-css/commit/81ad868))
* correctly catch usage of fallback vars ([3bccaf5](https://github.com/adobe/spectrum-css/commit/3bccaf5))
* don't remove vars that are ref'd by dead vars but used in props ([4030d40](https://github.com/adobe/spectrum-css/commit/4030d40))

# [1.1.0](https://github.com/castastrophe/postcss-dropunusedvars/compare/v1.0.0...v1.1.0) (2023-06-01)

### Features

* improve parsing caught by test upgrade ([ddd78c0](https://github.com/castastrophe/postcss-dropunusedvars/commit/ddd78c032a67c85560c65b2753515f33dc220404))

# 1.0.0 (2023-04-05)

### Features

* init repo ([29c3289](https://github.com/castastrophe/postcss-dropunusedvars/commit/29c3289a4d3bccfac412e62e015c0b8587fb0c45))
