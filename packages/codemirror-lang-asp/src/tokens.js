import {ExternalTokenizer} from "@lezer/lr"
import {BlockComment, Code} from "./asp.grammar.terms"

const percent = 37, star = 42, hash = 35, newline = 10, space = 32, tab = 9, cr = 13

// Nesting block comments `%* ... *%`, as in consume_blockcomment of
// spec/clingo/scanner.c (lines 129-163). Unlike that scanner, and like clingo
// (nongroundlexer.xch, the <blockcomment> and <comment> rules), a `%` inside a block
// comment starts a line comment, in which `%*` and `*%` do not count. An unterminated
// comment runs to the end of the input.
export const blockComment = new ExternalTokenizer(input => {
  if (input.next != percent || input.peek(1) != star) return
  input.advance(2)
  for (let depth = 1; depth > 0 && input.next >= 0;) {
    if (input.next == star && input.peek(1) == percent) {
      input.advance(2)
      depth--
    } else if (input.next == percent && input.peek(1) == star) {
      input.advance(2)
      depth++
    } else if (input.next == percent) {
      while (input.next >= 0 && input.next != newline) input.advance()
    } else {
      input.advance()
    }
  }
  input.acceptToken(BlockComment)
})

function isEnd(input, offset) {
  return input.peek(offset) == hash && input.peek(offset + 1) == 101 &&
    input.peek(offset + 2) == 110 && input.peek(offset + 3) == 100
}

// The body of `#script (lang) ... #end.`: everything up to the first `#end`, less the
// blanks right before it, as clingo's <script_body> rule (nongroundlexer.xch) takes it.
export const code = new ExternalTokenizer((input, stack) => {
  if (!stack.canShift(Code)) return
  let end = 0
  while (input.peek(end) >= 0 && !isEnd(input, end)) end++
  if (input.peek(end) >= 0)
    while (end > 0 && [space, tab, cr].includes(input.peek(end - 1))) end--
  if (end > 0) input.acceptToken(Code, end)
}, {contextual: true})
