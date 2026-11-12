// Vendors tree-sitter-clingo at a tag into spec/clingo/ and records it in
// spec/clingo/SOURCE and in the package's package.json. Run `pnpm generate` after it.
// Usage: node gen/fetch.mjs v1.0.6
import {createHash} from "node:crypto"
import {mkdir, readFile, rm, writeFile} from "node:fs/promises"
import {dirname, join} from "node:path"

const repo = "potassco/tree-sitter-clingo"
const files = [
  "LICENSE",
  "src/grammar.json",
  "src/scanner.c",
  "test/corpus/body.txt",
  "test/corpus/head.txt",
  "test/corpus/statements.txt",
  "test/corpus/terms.txt",
  "test/corpus/theory.txt",
]

const tag = process.argv[2]
if (!tag) throw new Error("usage: node gen/fetch.mjs <tag>")

async function get(url, as) {
  const response = await fetch(url, {headers: {accept: "application/vnd.github+json"}})
  if (!response.ok) throw new Error(`${url}: ${response.status}`)
  return as == "json" ? response.json() : Buffer.from(await response.arrayBuffer())
}

const {sha: commit} = await get(`https://api.github.com/repos/${repo}/commits/${tag}`, "json")
const out = new URL("../spec/clingo/", import.meta.url).pathname
await rm(out, {recursive: true, force: true})

const lines = [
  `url: https://github.com/${repo}`,
  `tag: ${tag}`,
  `commit: ${commit}`,
  `date: ${new Date().toISOString().slice(0, 10)}`,
  "sha256:",
]
for (const file of files) {
  const data = await get(`https://raw.githubusercontent.com/${repo}/${commit}/${file}`)
  const target = join(out, file.replace(/^(src|test)\//, ""))
  await mkdir(dirname(target), {recursive: true})
  await writeFile(target, data)
  lines.push(`  ${createHash("sha256").update(data).digest("hex")}  ${file}`)
}
await writeFile(join(out, "SOURCE"), lines.join("\n") + "\n")

const manifest = new URL("../packages/codemirror-lang-asp/package.json", import.meta.url)
const pkg = JSON.parse(await readFile(manifest, "utf8"))
pkg.clingo["tree-sitter-clingo"] = tag
await writeFile(manifest, JSON.stringify(pkg, null, 2) + "\n")
