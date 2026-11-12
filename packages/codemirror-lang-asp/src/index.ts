import {parser} from "./asp.grammar"
import {directives} from "./keywords"
import {
  LRLanguage,
  LanguageSupport,
  StreamLanguage,
  TreeIndentContext,
  indentNodeProp,
  foldNodeProp,
  foldInside,
  continuedIndent,
} from "@codemirror/language"
import type {CompletionContext, CompletionResult} from "@codemirror/autocomplete"
import {pythonLanguage} from "@codemirror/lang-python"
import {lua} from "@codemirror/legacy-modes/mode/lua"
import {parseMixed, type Parser, type SyntaxNode} from "@lezer/common"

const statements =
  "Rule IntegrityConstraint WeakConstraint Show ShowTerm ShowSignature Defined Edge Heuristic " +
  "ProjectSignature ProjectAtom Const Script Include Program External"

const braced =
  "SetAggregate BodyAggregate HeadAggregate SortAggregate TheoryAtom Minimize Maximize Theory " +
  "TheoryTermDefinition"

/// Inside the braces of a node, indent one unit from the line that opens them; a
/// closing brace goes back to that line's indentation.
function braceIndent(context: TreeIndentContext) {
  const open = context.node.getChild("{"), close = context.node.getChild("}")
  if (!open || context.pos <= open.from || (close && context.pos > close.from)) return context.continue()
  const closing = /^\s*\}/.test(context.textAfter)
  return context.lineIndent(open.from) + (closing ? 0 : context.unit)
}

function insideBraces(node: SyntaxNode) {
  const open = node.getChild("{"), close = node.getChild("}")
  return open && close ? {from: open.to, to: close.from} : null
}

/// The parsers for `#script (name)` bodies, by name.
const scripts = new Map<string, Parser>([
  ["python", pythonLanguage.parser],
  ["lua", StreamLanguage.define(lua).parser],
])

/// clingo's ASP language, with highlighting, folding, indentation and nested
/// highlighting of Python and Lua `#script` bodies.
export const aspLanguage = LRLanguage.define({
  name: "asp",
  parser: parser.configure({
    props: [
      indentNodeProp.add({
        [statements]: continuedIndent(),
        [braced]: braceIndent,
      }),
      foldNodeProp.add({
        "Rule IntegrityConstraint WeakConstraint": foldInside,
        "Theory TheoryTermDefinition Minimize Maximize": insideBraces,
        // Between `)` and `#end`; a nested language replaces the `Code` node.
        Script: node => {
          const open = node.getChild(")"), end = node.getChild("#end")
          return open && end ? {from: open.to, to: end.from} : null
        },
        BlockComment: node => ({from: node.from + 2, to: node.to - 2}),
      }),
    ],
    wrap: parseMixed((node, input) => {
      if (node.name != "Code") return null
      const name = node.node.parent?.getChild("Identifier")
      const script = name && scripts.get(input.read(name.from, name.to))
      return script ? {parser: script} : null
    }),
  }),
  languageData: {
    commentTokens: {line: "%", block: {open: "%*", close: "*%"}},
    closeBrackets: {brackets: ["(", "[", "{", '"']},
  },
})

/// Completes the `#` directives and aggregates.
export function completeDirective(context: CompletionContext): CompletionResult | null {
  const word = context.matchBefore(/#[a-z]*\+?/)
  if (!word || (word.from == word.to && !context.explicit)) return null
  return {from: word.from, options: directives.map(label => ({label, type: "keyword"})), validFor: /^#[a-z]*\+?$/}
}

/// clingo ASP language support for CodeMirror.
export function asp() {
  return new LanguageSupport(aspLanguage, aspLanguage.data.of({autocomplete: completeDirective}))
}
