// Converts the vendored tree-sitter grammar to Lezer notation. The output is kept for
// reference only; packages/codemirror-lang-asp/src/asp.grammar is written by hand.
import {readFileSync, writeFileSync} from "node:fs"
import {importGrammar} from "lezer-import-tree-sitter/dist/import.js"

const grammar = readFileSync(new URL("../spec/clingo/grammar.json", import.meta.url), "utf8")
writeFileSync(new URL("out/asp.imported.grammar", import.meta.url), importGrammar(grammar))
