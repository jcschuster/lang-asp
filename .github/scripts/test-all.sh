#!/usr/bin/env bash
# Runs every check in the repository, keeps going past a failure, and ends with one
# `PASS name` or `FAIL name` line per check. Exits non-zero if any failed. Expects the
# devshell (`nix develop`):
#
#     .github/scripts/test-all.sh
set -uo pipefail
cd "$(git rev-parse --show-toplevel)" || exit 1

results=()
failed=0

check() {
  local name=$1
  shift
  echo "== $name"
  if "$@"; then
    results+=("PASS $name")
  else
    results+=("FAIL $name")
    failed=1
  fi
}

check "LICENSE and NOTICE copies match" bash -c \
  'cmp LICENSE packages/codemirror-lang-asp/LICENSE && cmp NOTICE packages/codemirror-lang-asp/NOTICE'
check "pnpm install" pnpm install --frozen-lockfile
check "generated files are current" bash -c \
  'before=$(mktemp -d) && cp -r spec gen/out packages/codemirror-lang-asp/src "$before" && pnpm generate &&
   diff -r "$before/spec" spec && diff -r "$before/out" gen/out && diff -r "$before/src" packages/codemirror-lang-asp/src'
check "drift against tree-sitter-clingo" pnpm drift
check "clingo accepts the fixtures" python3 gen/clingo-parse.py fixtures/valid/*.lp
check "pnpm build" pnpm build
check "pnpm test" pnpm test

echo
printf '%s\n' "${results[@]}"
exit "$failed"
