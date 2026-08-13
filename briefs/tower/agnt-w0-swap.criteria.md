# Test criteria — W0 / agnt-w0-swap (deployed-path cutover)

Authored by `orch-w0-version-control` from the plan only, BEFORE the implementation
agent was spawned. The implementation agent (`agnt-w0-swap`) did not author these.
Each assert maps to a done-when criterion in
`~/agent-core/briefs/tower/agnt-w0-swap.md`.

This is the risky half of W0: it mutates the paths a LIVE fleet is calling. Criteria
are dominated by **no window of non-existence**, **every deployed path still
resolves**, and **the live bus is provably undamaged**.

## Cutover correctness (T3b)

| Assert name | Criterion |
|-------------|-----------|
| `all 19 deployed paths are symlinks` | `test -L` succeeds for each of the 9 top-level files and the 10 `hooks/*.mjs` in `~/.tower/` |
| `every target is the MAIN checkout` | `readlink` on each resolves under `/Users/jrg/agent-core/primitives/mcps/tower/` — never under `/Users/jrg/.spine/worktrees/` |
| `every symlink resolves to a real file` | `test -e` succeeds through each symlink; zero dangling links |
| `content unchanged through the link` | Reading each deployed path yields bytes sha256-identical to the T3a snapshot — the cutover changed the path type, not the content |
| `atomic mechanism used` | The transcript shows `ln -s` to a temp name followed by `mv -f`, never `rm` followed by `ln -s` |
| `no .swaptmp residue` | No `*.swaptmp` file remains anywhere in `~/.tower/` |
| `lib.mjs swapped first` | Ordering honoured, so the ask-bridge homedir anchor (fact 6) never pointed at a missing path |
| `MCP server not restarted` | No kill/restart of the running Tower server; only the short-lived probe process from T3d#4 was terminated |

## Nothing outside the partition moved

| Assert name | Criterion |
|-------------|-----------|
| `9 backups still present and real` | All 9 `.bak-*`/`.spine-backup-*` files still exist in `~/.tower/` (8) and `~/.tower/hooks/` (1), still regular files, not symlinks, unchanged sha256 |
| `no state file touched` | `board/ledger/odometer/pheromones.jsonl`, `flight/`, `deliverables/`, `cursors/`, `briefs/`, and the `*.json` pace files are not symlinked, not rewritten, not deleted |
| `no deletions anywhere` | Nothing removed from `~/.tower/`; the only repo edit is `.gitignore` |
| `no mutating git command ran` | `git -C /Users/jrg/agent-core log --oneline -1` still shows `9ff8778`; nothing staged by this agent |

## The seven proofs (T3d) — each needs pasted output, not a claim

| Assert name | Criterion |
|-------------|-----------|
| `cli status exit 0` | `bun ~/.tower/cli.mjs status` exits 0 and prints real data |
| `cli board exit 0` | `bun ~/.tower/cli.mjs board --limit 3` exits 0 |
| `mcp still connected` | `claude mcp list` shows `tower: … ✔ Connected` |
| `fresh server initializes` | A newly spawned `bun run ~/.tower/server.mjs` answers a JSON-RPC `initialize` over stdio with a valid result, then is killed |
| `5 relative hooks resolve via symlink` | `bun build --target=bun` exits 0 for prompt-inject, session-start, odometer-stop, odometer, stop-guard reached through `~/.tower/hooks/` |
| `all 10 hooks resolve` | Same check passes for all 10 deployed hooks |
| `no hook was executed` | Verification used `bun build`, never `import()` — no hook ran |
| `true hook count reported` | Report states 5 relative-importing hooks, correcting the original brief's 6 |
| `claude/tower double hop resolves` | `ls -l ~/.claude/tower/cli.mjs` resolves through `~/.claude/tower` → `~/.tower` → canonical |

## Test honesty (T3d#6)

| Assert name | Criterion |
|-------------|-----------|
| `exact counts reported` | Integer pass/fail reported for both suites |
| `baselines confirmed or refuted` | Report explicitly agrees or disagrees with the ORCH's measured baselines (cli 25/1 both layouts; server-drift 8/3 → 7/4) |
| `regression not hidden` | The `server.mjs.bak-20260812 exists` regression is reported, attributed to `server-drift.test.mjs:19` + `import.meta.dir`, and NOT fixed (CORD scoped it to W3) |
| `no test file edited` | sha256 of both test files unchanged |
| `tests not run from ~/.tower` | Suites were run from a scratch dir so cwd-relative state writes could not land in the real state home |

## Liveness (T3e) — the property the whole unit exists to protect

| Assert name | Criterion |
|-------------|-----------|
| `state append-only` | Pre-swap sha256 of `board.jsonl`/`ledger.jsonl` still matches the corresponding line-count prefix of the post-swap files — grown, never rewritten |
| `round-trip through the CLI works` | A short board line posted via the deployed CLI path is read back successfully |
| `no pane broke` | `herdr agent list` shows no pane in an error state that was not already in one; the three working panes are unharmed |
| `halt on breakage` | If any live pane broke, the agent STOPPED and reported rather than attempting a widening repair |

## Gitignore (T3c)

| Assert name | Criterion |
|-------------|-----------|
| `CORD's four patterns present` | `.gitignore` covers `*.jsonl`, `flight/`, `deliverables/`, `cursors/` |
| `existing content preserved` | The prior explanatory comment and entries are still there — widened, not replaced |

## Human-only

| Item | Criterion |
|------|-----------|
| `ask-bridge gap disclosed` | Report states plainly whether `ask-bridge.mjs` was exercised live; if not, it is named as a documented gap |
| `gaps stated plainly` | Anything unproven is named as a gap rather than a silent assumption |

## Run command (verification, by the ORCH gate — not by the implementer)

```bash
T="$HOME/.tower"; CANON=/Users/jrg/agent-core/primitives/mcps/tower
for f in lib.mjs cli.mjs server.mjs cli.test.mjs server-drift.test.mjs \
         COMMS-ARCH.md RESPONSIBLE-PARTY-AND-NQ.md server-drift.criteria.md server-drift.qa.md; do
  if [ -L "$T/$f" ] && [ -e "$T/$f" ] && [ "$(readlink "$T/$f")" = "$CANON/$f" ]; then echo "OK   $f"; else echo "FAIL $f"; fi
done
for h in ask-bridge deposit-reminder enforce-brief flight-recorder odometer-stop \
         odometer prompt-inject session-start stop-guard stop-verdict; do
  if [ -L "$T/hooks/$h.mjs" ] && [ -e "$T/hooks/$h.mjs" ]; then echo "OK   hooks/$h.mjs"; else echo "FAIL hooks/$h.mjs"; fi
done
ls "$T"/*.bak-* "$T"/*spine-backup* "$T"/hooks/*spine-backup* | wc -l   # expect 9
find "$T" -maxdepth 2 -name '*.swaptmp' | wc -l                        # expect 0
```
