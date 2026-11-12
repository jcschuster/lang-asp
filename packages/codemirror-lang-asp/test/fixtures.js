import {aspLanguage} from "../dist/index.js"
import assert from "assert"
import * as fs from "fs"
import * as path from "path"
import {fileURLToPath} from "url"

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..")

function errors(text) {
  const found = []
  aspLanguage.parser.parse(text).iterate({
    enter: node => { if (node.type.isError) found.push(JSON.stringify(text.slice(node.from, node.from + 30))) },
  })
  return found
}

describe("fixtures", () => {
  const dir = path.join(root, "fixtures", "valid")
  for (const file of fs.readdirSync(dir).sort()) {
    it(`${file} parses without error nodes`, () => {
      assert.deepStrictEqual(errors(fs.readFileSync(path.join(dir, file), "utf8")), [])
    })
  }
})

// The inputs of tree-sitter-clingo's corpus, at the version spec/clingo/SOURCE records.
describe("tree-sitter-clingo corpus", () => {
  const dir = path.join(root, "spec", "clingo", "corpus")
  for (const file of fs.readdirSync(dir).sort()) {
    const text = fs.readFileSync(path.join(dir, file), "utf8")
    for (const [, name, input] of text.matchAll(/^=+\n(.*)\n(?::.*\n)*=+\n([\s\S]*?)\n-{3,}\n/gm)) {
      it(`${file}: ${name}`, () => assert.deepStrictEqual(errors(input), []))
    }
  }
})
