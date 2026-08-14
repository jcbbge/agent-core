# Debugging Discipline — Hard Rules

These rules were installed after the 2026-05-20 PDF outage at Bento.
A one-line fix took three hours, five commits, and multiple CI rebuilds
to find because I violated every rule below. They are non-negotiable.

## 1. Decompose the error message before designing anything

When an error string is **precise, quoted, and from a known library**
(mPDF, Stripe SDK, Symfony, etc.), the **first action** is to grep the
library's source for the literal string.

- Use the library's GitHub URL: `https://raw.githubusercontent.com/<org>/<lib>/<version>/<path>`
- The throw site is the answer. The surrounding code explains the
  trigger condition.
- This takes 2 minutes. Do it before writing any code.

**Anti-pattern:** Building diagnostic infrastructure (`error_log` calls,
JSON dumps, replay scripts, webhook proxies) before reading the
library source. Custom instrumentation is the *last* resort, not the
*first* move.

## 2. One verifying command before any diagnostic commit

Before pushing a "let me add some logging" commit, ask:

> Could one shell command have given me this information?

If yes, run that command and skip the commit. Examples:

- "Is my new code deployed?" → `grep -c <function_name> <deployed_path>`
- "Does the catch fire?" → `grep '<unique log string>' <log_file>`
- "Where does this error come from?" → `grep -rn '<literal>' <library_src>`

Each diagnostic commit costs a 3-5 minute CI cycle plus context switch
for the human running tests. Five such commits = 25+ minutes of pure
waste. **Never deploy diagnostic code without first running the
diagnostic command.**

## 3. Single-fact verification, not multi-command runbooks

When asking a user to run commands, hand them **one command that
returns one fact**. Not five sections of bash with conditional outputs.

A user reading a 20-line diagnostic block in production has to:
- Read it carefully
- Run it correctly
- Interpret multi-section output
- Paste it back

This compounds errors and frustration. One command → one fact → one
decision. If I can't pick the single most informative command, I
haven't thought hard enough.

## 4. User frustration is signal, not noise

When the user pushes back ("there's no network request", "you're putting
logs in the wrong spot", "this makes no sense"), the **default
assumption** must be that their underlying claim is correct — even if
their proposed mechanism is wrong.

- Don't explain why their observation is "actually fine"
- Don't paper over the confusion with reassurance
- **Re-verify the assumption** they're challenging, ideally with a
  command they can run themselves

If you find yourself rationalizing a confusing observation away, stop.
The confusion is the bug.

## 5. Invoke the right skill early, not late

Available debugging skills:
- `debug-hypothesis` — forces Observe → Hypothesize → Experiment →
  Conclude. Use **first**, not seventh.

If the user mentions a production issue, an unexplained error, or a
behavior that doesn't match the model, **invoke the skill before
proposing solutions.** The skill's discipline beats raw intuition.

## 6. Library "debug" toggles are behavior toggles, not verbosity toggles

When a third-party library exposes `$obj->debug = true` (or
`->verbose`, `->strict`, `->dev_mode`, etc.), do **not** assume it just
prints more diagnostic info.

Read what it actually does in the library source. Common surprises:
- Throws on conditions it would otherwise tolerate
- Changes return values
- Couples to PHP's `error_get_last()` / `error_reporting`
- Disables caching
- Skips safety checks

The 2026-05-20 outage was mPDF's `debug=true` doing exactly the first
two — it threw and discarded successfully generated PDFs based on
unrelated PHP warnings elsewhere in the request.

## 7. Ambient warnings are coupling surface

`PHP Notice: Undefined index` and `PHP Warning: non-numeric value` are
not cosmetic noise. Any third-party code that reads
`error_get_last()`, scrapes the error log, or installs a custom error
handler can be triggered by them.

Treat every E_WARNING that fires during a normal request as a load-
bearing signal until proven otherwise. The cleanup PRD in
`_DOCS/PRD-pagoda-logging-cleanup.md` formalizes this for Bento.

## 8. Deploy artifact ≠ deployed code

A successful CI pipeline run with a green "deployed" badge does **not**
prove that the current commit is live. Verify with a runtime signal:

- Check the served JS bundle's SHA in the HTML or asset URL
- Check a version endpoint
- Grep the deployed PHP file for a unique string introduced in the
  latest commit

The 2026-05-20 session wasted ~30 minutes because Coolify happily
"redeployed" a stale image after CI had been silently failing for
weeks (mandrill/Bitbucket).

## 9. Never delete the catch block while debugging

If a catch block already exists, do not remove it during debugging
without preserving the underlying behavior. Add to it; don't replace
it. A catch is a contract with the calling JS code that the response
will be a specific shape.

## 10. When a fix takes five commits, the fifth was probably right

If I'm on commit 3+ of "let me try one more diagnostic thing", **stop
and re-read the problem statement.** The right hypothesis is usually
the one I dismissed early because it felt too simple.

Tonight's "the library is committing suicide on ambient warnings" was
the obvious explanation given the error message and the fact that
`$mpdf->debug = true` was sitting right there in `_app.php`. I
dismissed it because it felt too simple. It was the answer.

---

## 11. Cascade errors — root cause before symptoms

Zero-tolerance for fixing cascade errors. **NEVER fix individual errors until
you have identified whether they are cascade errors.** A cascade is when 10+
errors appear simultaneously from a single root cause. Fixing cascade symptoms
wastes hours and goes in circles.

### Build first — always

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

If output shows the same variable/symbol "not in scope" in 10+ places → **do
not fix any of them**. That is a cascade. Find the structural root.

### Cascade identification

Cascade signatures:

- Same symbol "not found" / "not in scope" everywhere → something closed a
  scope too early
- "Does not conform to protocol" + many property errors → struct/class body
  is broken
- "Expected expression" floods → unclosed string or bracket somewhere above
- "Redeclaration" floods → something declared outside its intended scope

**Rule: If N > 3 errors share the same symbol or pattern, that pattern is a
symptom. Stop.**

### Bracket/brace depth tracking

Any language with paired delimiters (`{}`, `[]`, `()`, `<>`) can silently
break structure. Run this when you suspect mismatched braces:

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

### Fix protocol

1. **Get compiler output** — run the build command
2. **Identify cascade** — are 3+ errors the same symptom?
3. **If cascade** → find structural root (brace mismatch, scope leak, missing
   declaration)
4. **Fix root only** — one change
5. **Re-run build** — verify error count dropped significantly
6. **Repeat** until zero errors

Never make multiple speculative fixes at once. One fix, one build, one verify.

### Verification requirement

A fix is not complete until the build command returns zero errors.
"It looks right" is not a passing test.

### Nine Primitives mapping

- **Perception**: Build first. Read actual output, not assumptions.
- **Reflection**: Cascade = structural root cause. Never fix symptoms.
- **Tool use**: Brace-depth script is the right tool for scope/structure bugs.
