# PLAN — lang-asp

CodeMirror 6 language package (`codemirror-lang-asp`) with a Lezer grammar for clingo's ASP language, bootstrapped from Potassco's tree-sitter grammar and finished by hand. Written 2026-11-11. Status: nothing started.

## Rules for the agent

- Work through the phases in order. Tick a box only when its check passes.
- `[verify]` = from memory or unchecked. Confirm against the named source first; correct this file if it is wrong.
- `[ask]` = decision for Johannes. Stop and ask; do not pick silently.
- Environment: NixOS, fish, direnv. Use only tools from the flake devshell; no global installs; `pnpm`, not `npm`/`npx`.
- Do not publish to npm, push tags, or open upstream issues/PRs without asking.
- Generated files are committed. Every hand-written part is listed in the package README.
- README and NOTICE claim no conformance beyond what the tests show.

## Conventions shared by the five lang-* repos

- Layout as in lang-tptp: `spec/` (inputs + `SOURCE` with URL, version, sha256, date), `gen/` (Node ESM scripts), `fixtures/`, `packages/codemirror-lang-asp/`.
- Exports: `asp()` → `LanguageSupport`, `aspLanguage` → `LRLanguage`.
- CamelCase node names; shared names where the concept exists: `LineComment`, `BlockComment`, `String`, `Number`, `Variable`.
- Root scripts: `pnpm generate`, `pnpm build`, `pnpm test`. `pnpm generate` is idempotent (`git diff --exit-code` afterwards, checked in CI).

## Facts

potassco/tree-sitter-clingo, `grammar.js` on `main` (read 2026-11-11; 973 lines, MIT):

- Grammar name `clingo`. The repository bundles its generated files, so `src/grammar.json` is available.
- `extras`: `line_comment`, `block_comment`, whitespace.
- `externals` (hand-written scanner, to be ported to JS): `empty_pool_item_first`, `empty_pool_item`, `colon`, `block_comment`, `doc_desc`, `_doc_token_args`, `_doc_token_paren`, `_doc_token_minus`.
- `conflicts`: `[signature, function]`; `prec.dynamic` 1 and 2 on `show_term` and `show_signature`.
- Term operators with numeric levels: `..` (0), `^ ? &` (1), `+ -` (2), `* / \` (3), unary `- ~` (4), `**` (right-associative, 5).
- Heavy use of `alias`, `field`, `inline`, `supertypes` and `token.immediate` (strings, f-strings, doc comments).
- Statements: rule, integrity constraint, weak constraint, `#minimize`/`#minimise`, `#maximize`/`#maximise`, `#show` (three forms), `#defined`, `#edge`, `#heuristic`, `#project` (two forms), `#const`, `#script … #end.`, `#include`, `#program`, `#external`, `#theory`, doc comment `%*! … *%`.
- Other tokens: `#sup`/`#supremum`, `#inf`/`#infimum`, `#true`, `#false`, aggregates `#sum`, `#sum+`, `#min`, `#max`, `#count`, `#sort`, numbers in decimal, `0x`, `0o`, `0b`, f-strings `f"…{term}…"`, external functions `@name(…)`, theory atoms `&name{…}`.
- Releases seen: crates.io 1.0.4, PyPI 1.0.3, npm `@potassco/tree-sitter-clingo`.

lezer-parser/import-tree-sitter (its README): not a polished tool; converts `src/grammar.json` to Lezer notation; precedences are only emitted as comments; aliases leave extra nodes. Expect a skeleton, not a working grammar.

Authoritative reference: clingo's own lexer `libgringo/src/input/nongroundlexer.xch` (path seen at commit `b4eeb3d`) and the bison grammar beside it (`nongroundgrammar.yy` `[verify name]`).

Unchecked:

- `[ask]` Which clingo version must the package match? Pin to the one clingo_elixir bundles.
- `[verify]` Which clingo version each tree-sitter-clingo tag targets. `main` contains f-strings, `#sort` and doc comments, which I do not recognise from clingo 5; pick the tag that matches the answer above.
- `[verify]` Whether block comments nest (read `src/scanner.c`).
- `[verify]` A parse-only clingo invocation for fixture checks, and the nixpkgs attribute `clingo` and its version.
- ASP-Core-2 is not the target; its grammar exists only in the standard's PDF.

## Phase 0 — Bootstrap

- [ ] Read the template copy under `packages/` (from lang-tptp) and the root files; note its build, test and generate commands.
- [ ] Rename everything: `git grep -il tptp` must end empty apart from deliberate credit lines.
- [ ] Remove TPTP-specific parts: mix-based `gen/`, nightly `tptp.yml`, `tools/differential`.
- [ ] `flake.nix` devshell: `nodejs`, `pnpm`, `clingo`. Commit `flake.lock`.
- [ ] `pnpm install && pnpm build && pnpm test` pass on a stub grammar.

## Phase 1 — Spec (`spec/clingo/`)

- [ ] Resolve the two version questions above; record the chosen tag.
- [ ] Vendor `src/grammar.json` and `src/scanner.c` at that tag; write `spec/clingo/SOURCE` (URL, tag, commit, sha256, date) and copy the MIT licence text into `NOTICE`.
- [ ] `gen/snapshot.mjs`: write `spec/clingo/rules.snapshot.json` (rule names, string terminals, regex terminals, externals, precedences) from `grammar.json`.
- [ ] `gen/keywords.mjs`: write `spec/clingo/keywords.json` (all `#…` directives and aggregates, `not`, theory keywords) from `grammar.json`.

## Phase 2 — Grammar (`src/asp.grammar`, `src/tokens.js`)

- [ ] Run `lezer-import-tree-sitter` on the vendored `grammar.json`; keep the raw output as `gen/out/asp.imported.grammar` for reference only.
- [ ] Derive `src/asp.grammar` from it by hand. From here on this file is the source of truth and is listed as hand-written.
- [ ] `@precedence` block reproducing the operator levels under Facts; test associativity of `**` and `-` chains.
- [ ] Port the external scanner to `src/tokens.js` as Lezer `ExternalTokenizer`s: block comment, context-sensitive `colon`, zero-width empty pool items. Keep the C file's logic recognisable; cite line ranges in comments.
- [ ] Replace every `token.immediate` construct (string and f-string fragments, doc comments) with `@local tokens` or non-skipping rule sections.
- [ ] `#show` ambiguity (`signature` versus `function`): ambiguity marker plus dynamic precedence mirroring upstream's 1 and 2.
- [ ] Drop aliases; choose final node names; map upstream `supertypes` to `@isGroup`.
- [ ] `#script (lang) … #end.`: body as one `Code` token.
- [ ] Doc comments: v1 may treat `%*! … *%` as `BlockComment`; structured doc nodes are optional.
- [ ] Drift check `gen/drift.mjs`: every terminal in `keywords.json` occurs in `src/asp.grammar`; report rules in the snapshot with no counterpart listed in `gen/rule-map.json`.

## Phase 3 — CodeMirror package

- [ ] `styleTags`: directives, aggregates, `not`, variables, anonymous `_`, predicate names in heads (definition) versus bodies, functions, external `@` functions, theory atoms, numbers, strings, f-string fields, operators, punctuation, comments.
- [ ] `languageData`: `commentTokens: {line: "%", block: {open: "%*", close: "*%"}}`, `closeBrackets`.
- [ ] Indentation for rule bodies and aggregate braces; folding for multi-line rules, `#script` blocks, `#theory` blocks, block comments.
- [ ] Completion source for directives from `keywords.json`.
- [ ] `[ask]` Nested highlighting of `#script` bodies (Python/Lua via `parseMixed`) — in scope?
- [ ] `[ask]` npm name `codemirror-lang-asp` (check `pnpm view codemirror-lang-asp`).
- [ ] Package README: pinned tree-sitter-clingo tag and clingo version, what is generated, list of hand-written files.

## Phase 4 — Tests

- [ ] `test/*.txt` in Lezer `fileTests` format: every statement kind, every operator level, pools, conditional literals, aggregates in head and body, theory atoms and definitions, comments.
- [ ] Corpus: tree-sitter-clingo's `test/` inputs at the pinned tag (downloaded by script, not committed unless small; MIT).
- [ ] Script: every corpus input and every `fixtures/valid/*.lp` that clingo parses must parse in Lezer without error nodes.
- [ ] Optional tree comparison: for the corpus, compare node kinds against the upstream expected trees via `gen/rule-map.json`; report mismatches without failing.
- [ ] Highlight coverage test: every named node has a tag or is listed as intentionally untagged.

## Phase 5 — CI and release

- [ ] `.github/scripts/test-all.sh` runs generate (with diff check), drift check, build, tests, corpus check; CI runs it inside `nix develop`.
- [ ] Scheduled workflow: detect a new tree-sitter-clingo tag, regenerate snapshot and keywords, open a PR with the drift report (model: lang-tptp's `tptp.yml`).
- [ ] Carry over `version.sh`, `release.yml` and `CHANGELOG.md` from lang-tptp; adapt names.

## Done when

- [ ] All boxes above ticked or explicitly waived by Johannes.
- [ ] `nix develop -c .github/scripts/test-all.sh` passes from a clean clone.

## After this plan (Johannes)

Configure npm trusted publishing, first release, add the package to the Loge cell bundle.
