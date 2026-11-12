// Writes spec/clingo/rules.snapshot.json: what the vendored tree-sitter grammar
// consists of, so that a new tree-sitter-clingo version shows up as a diff.
import {writeFileSync} from "node:fs"
import {grammar, walk, strings, writeJson} from "./grammar.mjs"

const sorted = set => [...set].sort()
const literals = new Set(), patterns = new Set(), precedences = []

walk((node, rule) => {
  if (node.type == "STRING") literals.add(node.value)
  if (node.type == "PATTERN") patterns.add(node.value)
  if (node.type.startsWith("PREC"))
    precedences.push({rule, type: node.type, value: node.value, strings: [...new Set(strings(node.content))]})
})

writeFileSync(...writeJson("../spec/clingo/rules.snapshot.json", {
  rules: Object.keys(grammar.rules).sort(),
  strings: sorted(literals),
  patterns: sorted(patterns),
  externals: grammar.externals.map(external => external.name),
  precedences,
}))
