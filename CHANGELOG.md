# Changelog

All notable changes to `codemirror-lang-asp` are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[semantic versioning](https://semver.org/spec/v2.0.0.html) over what the package
exposes: node names and the exported JavaScript API.

The clingo version the grammar targets and the tree-sitter-clingo version it was started
from are recorded in `package.json` under `clingo`.

## [Unreleased]

## [0.1.0] - 2026-11-12

### Added

- `codemirror-lang-asp`: a CodeMirror 6 language for clingo's ASP language (Lezer
  parser) with highlighting, folding, indentation, completion of `#` directives, and
  Python and Lua highlighting inside `#script` blocks.
