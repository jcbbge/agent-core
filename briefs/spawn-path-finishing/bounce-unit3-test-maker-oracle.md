# BOUNCE — test-maker unit3 shim-pwd-stamp (oracle fix only)

Repo: `/Users/jrg/cursor-shim`. Worktree (EXISTING — edit here):
`/Users/jrg/.cursor/worktrees/cursor-shim/wt-agnt-test-maker-w2q-ph`
Do NOT use emojis. Board topic: `cursor-shim/spawn-finishing`. No commit. No mocks.

## Why you are back

ORCH overlay of coder + your suite: **6/7 shim-pwd-stamp PASS; 1 FAIL**.
The failure is a **bad test**, not bad implementation.

FAIL: `AC2: up block non-fatal stamp guard (||)`

Your ck uses a same-line regex:
`sed -n '/^up)/,/^orch)/p' cursor-fleet | grep -qE 'report-metadata.*\\|\\||\\|\\|.*report-metadata'`

The plan's stamp shape (and the landed coder shape) is **multiline** — idiomatic for long `hj` lines:

```
hj workspace report-metadata "$WS_ID" ... --ttl-ms 86400000 \
  || log "WARN: failed to stamp pwd on workspace $WS_ID"
```

`report-metadata` and `||` are on adjacent lines, so line-oriented
`report-metadata.*||` never matches. That is the bug in the oracle.

## Pre-Verified Facts (ORCH verified on overlay this session)

- Coder worktree `wt-agnt-coder-w2q-pg` stamp is correct vs plan (AC1+AC2 intent).
- Overlay results for ### shim-pwd-stamp: report-metadata PASS, --source PASS,
  pwd= PASS, ttl PASS, realpath PASS, WARN PASS, **|| FAIL** (this bounce).
- Unrelated FAILs on overlay (ignore): non-repo PERMITTED, working tree clean.

## Fix (Touch ONLY `docs/qa-verify.sh`)

Rewrite the single failing `AC2: up block non-fatal stamp guard (||)` case so it
accepts the multiline plan shape. Binding options (pick one; keep static/no live up):

1. Preferred: `sed -n '/^up)/,/^orch)/p' cursor-fleet | grep -A1 'report-metadata' | grep -q '||'`
2. Or: assert the WARN line itself carries the `||` arm:
   `sed -n '/^up)/,/^orch)/p' cursor-fleet | grep -qE '^\s*\|\| log "WARN: failed to stamp pwd'`
3. Or: two-step outside the fragile same-line join — keep WARN ck; make the `||`
   ck look at the continuation line after report-metadata only.

Do NOT weaken AC1 cases. Do NOT require same-line `report-metadata ||`.
Do NOT read or edit `cursor-fleet` (coder partition). Do NOT invent a live `up`.

## done-when

1. The `AC2: up block non-fatal stamp guard (||)` ck passes against a tree that
   has the multiline stamp (verify by overlaying coder's `cursor-fleet` into your
   worktree OR by reasoning from the multiline shape above — if you overlay for
   a self-check, copy only for the run; leave coder's file out of your commit
   surface — you still touch ONLY qa-verify.sh).
2. All 7 shim-pwd-stamp cases still present; section name unchanged.
3. CLAIM + DONE posted to board; `.done` rewritten. No commit.

## Report back with

- Exact new `ck` line for the `||` case.
- Confirmation the other 6 cases untouched (or list if you retouched).
- Board DONE id. Deviations + reasons.
