import {asp, aspLanguage, completeDirective} from "../dist/index.js"
import {EditorState} from "@codemirror/state"
import {foldable, getIndentation, syntaxTree} from "@codemirror/language"
import {CompletionContext} from "@codemirror/autocomplete"
import {pythonLanguage} from "@codemirror/lang-python"
import {IterMode} from "@lezer/common"
import {getStyleTags, highlightTree, tagHighlighter, tags as t} from "@lezer/highlight"
import assert from "assert"

const state = doc => EditorState.create({doc, extensions: [asp()]})

describe("highlighting", () => {
  const highlighter = tagHighlighter([
    {tag: t.keyword, class: "keyword"},
    {tag: t.standard(t.function(t.variableName)), class: "aggregate"},
    {tag: t.operatorKeyword, class: "not"},
    {tag: t.modifier, class: "modifier"},
    {tag: t.bool, class: "bool"},
    {tag: t.atom, class: "atom"},
    {tag: t.variableName, class: "variable"},
    {tag: t.special(t.variableName), class: "anonymous"},
    {tag: t.definition(t.propertyName), class: "head"},
    {tag: t.propertyName, class: "predicate"},
    {tag: t.function(t.variableName), class: "function"},
    {tag: t.special(t.function(t.variableName)), class: "external"},
    {tag: t.macroName, class: "theory-atom"},
    {tag: t.number, class: "number"},
    {tag: t.string, class: "string"},
    {tag: t.escape, class: "escape"},
    {tag: t.compareOperator, class: "compare"},
    {tag: t.arithmeticOperator, class: "arithmetic"},
    {tag: t.operator, class: "operator"},
    {tag: t.lineComment, class: "line-comment"},
    {tag: t.blockComment, class: "block-comment"},
  ])

  // Map each highlighted piece of text to its class.
  function classes(text) {
    const result = {}
    highlightTree(aspLanguage.parser.parse(text), highlighter, (from, to, cls) => {
      result[text.slice(from, to)] = cls
    })
    return result
  }

  it("separates head predicates, body predicates, functions, variables and keywords", () => {
    const c = classes('p(X, f(1), @g, _) :- q(X), not r, #count { Y : s(Y) } > 2, X != "a\\n".')
    assert.deepStrictEqual(pick(c, ["p", "q", "r", "s", "X", "f", "g", "_", "not", "#count", "1", "!=", '"a', "\\n"]), {
      p: "head", q: "predicate", r: "predicate", s: "predicate", X: "variable", f: "function", g: "external",
      _: "anonymous", not: "not", "#count": "aggregate", 1: "number", "!=": "compare", '"a': "string",
      "\\n": "string escape",
    })
  })

  it("highlights directives, constants, theory atoms and comments", () => {
    const c = classes("% line\n%* block *%\n#const n = #sup. [override]\n&diff { x - y } <= 3 :- #true.")
    assert.deepStrictEqual(pick(c, ["% line", "%* block *%", "#const", "#sup", "override", "diff", "-", "<=", "#true"]), {
      "% line": "line-comment", "%* block *%": "block-comment", "#const": "keyword", "#sup": "atom",
      override: "modifier", diff: "theory-atom", "-": "operator", "<=": "operator", "#true": "bool",
    })
  })

  // Nodes that only group others; their tokens are highlighted, they are not. `Code`
  // is highlighted by the nested language, if there is one.
  const untagged = new Set(`Code Rule HeadAtom FStringField Function ExternalFunction Tuple Abs BinaryOperation
    UnaryOperation Comparison CompareOp Boolean Disjunction ConditionalLiteral Condition SymbolicAtom SetAggregate
    SetAggregateElement HeadAggregate AggregateFunction HeadAggregateElement TheoryAtom TheoryElement TheoryFunction
    TheoryTuple TheoryList TheorySet Body BodyAggregate BodyAggregateElement SortAggregate IntegrityConstraint
    WeakConstraint Minimize OptimizeElement Maximize Show ShowTerm ShowSignature Signature Defined Edge Heuristic
    ProjectSignature ProjectAtom Const Script Include Program External Theory TheoryTermDefinition
    TheoryOperatorDefinition TheoryAtomDefinition`.split(/\s+/))

  it("tags every node that is not listed as untagged", () => {
    const missing = aspLanguage.parser.nodeSet.types
      .filter(type => type.name && !type.isError && !type.isTop && !untagged.has(type.name))
      .filter(type => !getStyleTags({type, matchContext: () => true}))
      .map(type => type.name)
    assert.deepStrictEqual(missing, [])
  })
})

describe("#script bodies", () => {
  const text = "#script (python)\nimport clingo\ndef f(x):\n    return x\n#end.\n" +
    "#script (lua)\nfunction g()\n  return 1\nend\n#end.\n#script (other)\nx y z\n#end.\np(@f(1))."
  const tree = aspLanguage.parser.parse(text)
  const at = (word, offset = 0) => tree.resolveInner(text.indexOf(word, offset) + 1, 1)

  it("leave no error nodes in the ASP tree", () => {
    const errors = []
    tree.iterate({mode: IterMode.IgnoreMounts, enter: node => { if (node.type.isError) errors.push(node.from) }})
    assert.deepStrictEqual(errors, [])
  })

  it("are parsed as Python", () => {
    assert.ok(pythonLanguage.parser.nodeSet.types.includes(at("def").type))
    assert.strictEqual(at("clingo").name, "VariableName")
  })

  it("are parsed as Lua", () => {
    const node = at("function")
    assert.ok(!aspLanguage.parser.nodeSet.types.includes(node.type))
    assert.strictEqual(node.name, "keyword")
  })

  it("stay plain code in other languages", () => {
    assert.strictEqual(at("x y z").name, "Code")
  })
})

describe("editing", () => {
  it("indents rule bodies and aggregate elements", () => {
    const s = state("p :- q,\nr.\n:- #count {\nX : s(X)\n} > 2.")
    const indent = line => getIndentation(s, s.doc.line(line).from)
    assert.deepStrictEqual([2, 4, 5].map(indent), [2, 2, 0])
  })

  it("folds rules, scripts, theories and block comments", () => {
    const s = state("p :- q,\n  r.\n#script (lua)\nx = 1\n#end.\n#theory t {\n  a { }\n}.\n%* a\nb *%\nq.")
    syntaxTree(s)
    const fold = line => foldable(s, s.doc.line(line).from, s.doc.line(line).to)
    assert.deepStrictEqual([1, 3, 6, 9, 11].map(line => fold(line) != null), [true, true, true, true, false])
  })

  it("declares comment tokens and brackets", () => {
    const s = state("p.")
    assert.deepStrictEqual(s.languageDataAt("commentTokens", 0), [{line: "%", block: {open: "%*", close: "*%"}}])
    assert.deepStrictEqual(s.languageDataAt("closeBrackets", 0), [{brackets: ["(", "[", "{", '"']}])
  })

  it("completes directives", () => {
    const s = state("#sh")
    const result = completeDirective(new CompletionContext(s, 3, false))
    assert.strictEqual(result.from, 0)
    assert.ok(result.options.some(option => option.label == "#show"))
  })
})

function pick(object, keys) {
  return Object.fromEntries(keys.map(key => [key, object[key]]))
}
