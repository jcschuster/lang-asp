// Reads the vendored tree-sitter grammar and walks its rule expressions.
import {readFileSync} from "node:fs"

export const grammar = JSON.parse(readFileSync(new URL("../spec/clingo/grammar.json", import.meta.url), "utf8"))

/// Calls `f(node, rule)` for every expression node of every rule.
export function walk(f) {
  for (const [rule, expression] of Object.entries(grammar.rules)) {
    const visit = node => {
      f(node, rule)
      for (const child of node.members ?? (node.content ? [node.content] : [])) visit(child)
    }
    visit(expression)
  }
}

/// The values of the STRING nodes below `node`.
export function strings(node) {
  if (node.type == "STRING") return [node.value]
  return (node.members ?? (node.content ? [node.content] : [])).flatMap(strings)
}

export function writeJson(path, value) {
  return [new URL(path, import.meta.url), JSON.stringify(value, null, 2) + "\n"]
}
