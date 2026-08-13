# Test criteria — W0 / agnt-w0-readme (record the pattern, stop state leaking)

Authored by `orch-w0-version-control` from the plan only, BEFORE the implementation
agent was spawned. The implementation agent (`agnt-w0-readme`) did not author these.
Each assert maps to a done-when criterion in
`~/agent-core/briefs/tower/agnt-w0-readme.md`.

This unit is documentation plus one authorised deletion. Criteria are dominated by
**factual accuracy of the record**, **containment of the deletion**, and
**landing in the right checkout**.

## README accuracy — every load-bearing fact is present and correct (T5 done-when #1)

| Assert name | Criterion |
|-------------|-----------|
| `canonical/deployed split stated` | README states canonical git-tracked code lives at `primitives/mcps/tower/` and that the deployed runtime + ALL state live at `~/.tower/` |
| `load-bearing paths enumerated` | README names the MCP registration, the hook registration sites in `~/.claude/settings.json`, `bun ~/.tower/cli.mjs`, and the `~/.claude/tower` → `~/.tower` symlink |
| `hook site count correct` | README says **15** hook registration sites, not 10 — the corrected number |
| `state-anchor property with citation` | README cites `primitives/hooks/tower-ledger.mjs` lines 22-28 and `join(homedir(), '.tower')`, and draws the consequence that moving code cannot move state |
| `relative-import constraint stated` | README states the required layout `<root>/lib.mjs` + `<root>/hooks/*.mjs` and that the set must move together |
| `exactly 5 hooks named` | README names precisely prompt-inject, session-start, odometer-stop, odometer, stop-guard as the `../lib.mjs` importers — not 6, not a vague "several" |
| `symlink resolution fact stated` | README states Bun resolves symlinks to realpath before resolving relative specifiers, so relative imports resolve from the canonical root |
| `ask-bridge exception stated` | README states `~/.tower/lib.mjs` must exist regardless, citing `hooks/ask-bridge.mjs:152` and its homedir-anchored dynamic import |
| `safe-verification method stated` | README prescribes `bun build --target=bun` and explicitly warns against `import()`-ing a hook, giving the reason (hooks read stdin; can block or fire real actions) |
| `test side effect documented` | README documents that running the suite here drops a `ledger.jsonl` in cwd, that it is gitignored, and that it is not real state |
| `attic explained with W5 left open` | README explains `attic/` and states that deleting the `~/.tower/` originals is a separate open decision (W5), not casual tidy-up |
| `no session narrative` | README contains no changelog, no worker names, no account of this session — it reads as reference documentation |

## Factual integrity — no fact laundering

| Assert name | Criterion |
|-------------|-----------|
| `line numbers verifiable` | Every file:line citation in the README resolves to what it claims when checked against the real file |
| `re-verification disclosed` | The report states which facts the agent independently re-verified and which it accepted from the brief — an unchecked fact is disclosed, not presented as verified |

## The authorised deletion is contained (partition + T5 done-when #3)

| Assert name | Criterion |
|-------------|-----------|
| `content checked before removal` | Agent confirmed the stray file was the ~267-byte single-row `server-drift oracle seed` (`t-sdrift-msr1mp82`) BEFORE removing it |
| `mismatch would have halted` | If content had differed from fact 8, the agent posted and stopped instead of deleting |
| `stray file gone` | `primitives/mcps/tower/ledger.jsonl` no longer exists |
| `real ledger untouched` | `~/.tower/ledger.jsonl` still exists; its size/sha256 is unchanged, or changed only by append from other live agents — never rewritten |
| `nothing else deleted` | No other file was removed anywhere; `~/.tower/` still holds all 9 backups and all live code files |

## Gitignore works (T5b, done-when #2)

| Assert name | Criterion |
|-------------|-----------|
| `.gitignore exists` | `primitives/mcps/tower/.gitignore` is a regular file |
| `covers the four state files` | It ignores `ledger.jsonl`, `board.jsonl`, `odometer.jsonl`, `pheromones.jsonl` |
| `carries a why comment` | It contains a comment explaining that test runs write state relative to cwd and real state belongs in `~/.tower/` |
| `state no longer shows untracked` | `git -C /Users/jrg/agent-core status --porcelain primitives/mcps/tower/` lists no `.jsonl` file as untracked |

## Landed in the right checkout (worktree trap, done-when #4)

| Assert name | Criterion |
|-------------|-----------|
| `files in main checkout` | `README.md` and `.gitignore` exist under `/Users/jrg/agent-core/primitives/mcps/tower/` |
| `main checkout sees the change` | `git -C /Users/jrg/agent-core status --porcelain primitives/mcps/tower/` shows them as modified/untracked |
| `no stray worktree copy` | No edited copy left behind under `/Users/jrg/.spine/worktrees/agent-core/*/primitives/mcps/tower/` |
| `branch unchanged` | `/Users/jrg/agent-core` is still on `tower/w0-version-control` at `5e281be` — the agent did not switch, merge, or commit |

## Reporting

| Assert name | Criterion |
|-------------|-----------|
| `board CLAIM posted before writes` | `board.jsonl` has a `tower/w0-version-control` row from `agnt-w0-readme` of type claim |
| `no mutating git command ran` | `git log -1` in `~/agent-core` still shows `5e281be`; nothing staged by this agent |
| `.done written last` | `~/.tower/agnt-w0-readme.done` exists, mtime at or after the final board post |

## Human-only

| Item | Criterion |
|------|-----------|
| `gaps stated plainly` | Report names anything unproven as an explicit gap rather than a silent assumption |

## Run command (verification, by the ORCH gate — not by the implementer)

```bash
CANON=/Users/jrg/agent-core/primitives/mcps/tower
test -f "$CANON/.gitignore" && echo "OK gitignore" || echo "FAIL gitignore"
test ! -e "$CANON/ledger.jsonl" && echo "OK stray removed" || echo "FAIL stray present"
test -f "$HOME/.tower/ledger.jsonl" && echo "OK real ledger intact" || echo "FAIL real ledger"
git -C /Users/jrg/agent-core status --porcelain primitives/mcps/tower/
git -C /Users/jrg/agent-core log --oneline -1
ls "$HOME"/.tower/*.bak-* "$HOME"/.tower/*spine-backup* "$HOME"/.tower/hooks/*spine-backup* | wc -l  # expect 9
```
