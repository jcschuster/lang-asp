// Compares the vendored tree-sitter grammar with src/asp.grammar: every keyword in
// spec/clingo/keywords.json must occur in the grammar as a literal, and every rule
// and external in spec/clingo/rules.snapshot.json must be mapped in gen/rule-map.json
// to a name the grammar defines (or to null, for a rule with no counterpart). Prints
// what is missing and exits non-zero if anything is.
import {readFileSync} from "node:fs"

const read = path => readFileSync(new URL(path, import.meta.url), "utf8")
const grammar = read("../packages/codemirror-lang-asp/src/asp.grammar")
const keywords = JSON.parse(read("../spec/clingo/keywords.json"))
const snapshot = JSON.parse(read("../spec/clingo/rules.snapshot.json"))
const map = JSON.parse(read("rule-map.json"))

const externals = [...grammar.matchAll(/@external tokens \w+ from "[^"]*" \{([^}]*)\}/g)]
  .flatMap(match => match[1].split(",").map(name => name.trim()))

const defined = name =>
  name.startsWith('"') ? grammar.includes(name) :
  externals.includes(name) || grammar.includes(`@else ${name}`) ||
  new RegExp(`^ *(@top )?${name}(\\[[^\\]]*\\])?(<[^>]*>)? *\\{`, "m").test(grammar)

const problems = [
  ...[...keywords.directives, ...keywords.words]
    .filter(keyword => !grammar.includes(`"${keyword}"`))
    .map(keyword => `keyword ${keyword} does not occur in asp.grammar`),
  ...[...snapshot.rules, ...snapshot.externals]
    .filter(rule => !(rule in map))
    .map(rule => `rule ${rule} is not in gen/rule-map.json`),
  ...Object.entries(map)
    .filter(([, name]) => name != null && !defined(name))
    .map(([rule, name]) => `rule ${rule} maps to ${name}, which asp.grammar does not define`),
  ...Object.keys(map)
    .filter(rule => !snapshot.rules.includes(rule) && !snapshot.externals.includes(rule))
    .map(rule => `gen/rule-map.json maps ${rule}, which the snapshot does not have`),
]

for (const problem of problems) console.log(problem)
process.exitCode = problems.length ? 1 : 0
