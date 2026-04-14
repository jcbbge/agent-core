# Debugging Rules

Zero-tolerance for fixing cascade errors. Root cause first, always.

## The Law

**NEVER fix individual errors until you have identified whether they are cascade errors.**
A cascade is when 10+ errors appear simultaneously from a single root cause.
Fixing cascade symptoms wastes hours and goes in circles.

## Build First — Always

Before reading any code, run the compiler/linter and read its output.
The output is ground truth. Your assumptions are not.

```bash
# Swift
xcrun swiftc -typecheck File.swift 2>&1

# TypeScript
npx tsc --noEmit 2>&1

# Python
python -m py_compile file.py 2>&1

# Go
go build ./... 2>&1

# PHP
php -l file.php 2>&1
```

If output shows the same variable/symbol "not in scope" in 10+ places → **do not fix any of them**.
That is a cascade. Find the structural root.

## Cascade Identification

Cascade signatures:
- Same symbol "not found" / "not in scope" everywhere → something closed a scope too early
- "Does not conform to protocol" + many property errors → struct/class body is broken
- "Expected expression" floods → unclosed string or bracket somewhere above
- "Redeclaration" floods → something declared outside its intended scope

**Rule: If N > 3 errors share the same symbol or pattern, that pattern is a symptom. Stop.**

## Bracket/Brace Depth Tracking

Any language with paired delimiters (`{}`, `[]`, `()`, `<>`) can silently break structure.
Run this when you suspect mismatched braces:

```python
python3 - <<'EOF'
import sys
filename = sys.argv[1] if len(sys.argv) > 1 else "File.swift"
open_char, close_char = '{', '}'

with open(filename) as f:
    lines = f.readlines()

depth = 0
for i, line in enumerate(lines, 1):
    prev = depth
    for ch in line:
        if ch == open_char: depth += 1
        elif ch == close_char: depth -= 1
    # Flag: depth drops to 0 before end of file (premature struct close)
    if depth == 0 and i < len(lines) and prev > 0:
        print(f"PREMATURE CLOSE line {i} (was depth {prev}): {line.strip()[:80]}")
    # Flag: depth goes negative (extra close)
    if depth < 0:
        print(f"EXTRA CLOSE line {i}: {line.strip()[:80]}")
        break

print(f"Final depth: {depth} ({'balanced' if depth == 0 else 'IMBALANCED'})")
EOF
python3 - <filename>
```

This finds the exact line. Trust it. Fix only that line.

## Fix Protocol

1. **Get compiler output** — run the build command
2. **Identify cascade** — are 3+ errors the same symptom?
3. **If cascade** → find structural root (brace mismatch, scope leak, missing declaration)
4. **Fix root only** — one change
5. **Re-run build** — verify error count dropped significantly
6. **Repeat** until zero errors

Never make multiple speculative fixes at once. One fix, one build, one verify.

## Verification Requirement

A fix is not complete until the build command returns zero errors.
"It looks right" is not a passing test.

## Nine Primitives Mapping

- **Perception**: Build first. Read actual output, not assumptions.
- **Reflection**: Cascade = structural root cause. Never fix symptoms.
- **Tool use**: Brace-depth script is the right tool for scope/structure bugs.
