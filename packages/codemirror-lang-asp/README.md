# codemirror-lang-asp

Answer Set Programming support for [CodeMirror 6](https://codemirror.net/), for the input
language of [clingo](https://potassco.org/clingo/): a Lezer parser with highlighting,
folding, indentation, completion of `#` directives, and Python or Lua highlighting
inside `#script` blocks.

```js
import {EditorView, basicSetup} from "codemirror"
import {asp} from "codemirror-lang-asp"

new EditorView({extensions: [basicSetup, asp()], parent: document.body})
```

## What it parses

The grammar targets clingo 5.8.2, with octal numbers as 5.8.3 reads them (`0o0` is
valid). It was started from
[tree-sitter-clingo](https://github.com/potassco/tree-sitter-clingo) v1.0.6 and also
accepts the syntax that grammar has beyond clingo 5.8: f-strings, `#sort` aggregates,
the projection `*`, `#show p/1. [true]`, and `_`, `(,)` and a guard without braces in
theory atoms. Operator precedence follows clingo, which
differs from tree-sitter-clingo for `^`, `?`, `&` and unary minus. Both versions are
recorded in `package.json` under `clingo`.

v1.0.6 is pinned because it is the latest tree-sitter-clingo release, and no tag targets
clingo 5.8: every one has f-strings. Against v1.0.5 it adds `#sort` aggregates and
parses `not not` as two tokens, so that any spacing between them works.

What the tests check, and nothing more: every fixture in the repository's
`fixtures/valid/` parses without error nodes here and is accepted by clingo's own parser;
every input of tree-sitter-clingo's test corpus at v1.0.6 parses without error nodes; and
the trees in `test/*.txt` are as written. No comparison with clingo's syntax trees is
made, and invalid programs are not checked to be rejected.

`%*! ... *%` doc comments are parsed as block comments.

## Files

Generated in the [lang-asp](https://github.com/jcschuster/lang-asp) repository by
`pnpm generate`:

- `src/keywords.ts`, the directives offered by completion, from tree-sitter-clingo's
  grammar.

Written by hand:

- `src/asp.grammar`, the Lezer grammar;
- `src/tokens.js`, the tokenizers for nesting block comments and `#script` bodies;
- `src/highlight.ts`, the highlighting tags;
- `src/index.ts`, the language, folding, indentation, completion and nested parsing.

In the repository, `spec/clingo/` holds the vendored tree-sitter-clingo files and what
`pnpm generate` derives from them, and `gen/out/asp.imported.grammar` that grammar as
lezer-import-tree-sitter converts it, kept for reference; the scripts in `gen/`,
`gen/rule-map.json`, the fixtures and the tests are written by hand.
