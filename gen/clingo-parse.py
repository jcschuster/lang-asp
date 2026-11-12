"""Parses each file with clingo's own parser, without grounding. Prints clingo's
messages for the files it rejects and exits non-zero if it rejects any.

    python3 gen/clingo-parse.py fixtures/valid/*.lp
"""

import sys

import clingo
from clingo.ast import parse_files

rejected = 0
for path in sys.argv[1:]:
    try:
        parse_files([path], lambda statement: None, logger=lambda code, message: print(message, file=sys.stderr))
    except RuntimeError:
        print(f"clingo {clingo.__version__} rejects {path}", file=sys.stderr)
        rejected += 1
sys.exit(1 if rejected else 0)
