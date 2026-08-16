# AGNT — refresh the worktree-lifecycle enforcer status to what is now true

You are an implementer. This brief is binding and self-contained. Do NOT use
emojis anywhere.

## Context (shared prefix — identical in both sibling briefs)

Three sibling units landed the worktree-lifecycle law and its doors:

- The law: `~/agent-core/primitives/rules/worktree-lifecycle.md`, registered in
  `ENFORCEMENT.md:47`, `control-flow.md:141`, `AGENTS.md:98`.
- Cursor-path teardown door: `~/cursor-shim/cursor-finish:460`
  `trap cleanup_and_preserve_rc EXIT` (verified by `grep -n 'trap '` on
  2026-08-16). The handler saves the incoming exit status before cleanup and
  re-exits with it; cleanup is preserve-or-keep and returns non-zero when a
  directory still stands.
- Spine-path teardown door: `~/herdr-spine/bin/spine-spawn` — `def cmd_reap(`
  at line 1274, registered subcommand at line 1450, help line at line 62
  (`  spine-spawn reap <path>`). Verified by grep on 2026-08-16.
- Sparse-at-spawn: `spine-spawn worker --sparse PATH` (repeatable; derives from
  the brief's `Touch ONLY` partition when omitted; full checkout plus a WARN
  when neither is present). `cursor-spine sparse-apply` is the cursor-side seam.

Two residuals remain. Yours is the ledger refresh. A sibling AGNT is
registering both doors in `~/.agent-core/registry` at the same time — do not
touch that file.

**Tower (mailbox only this session).** Board topic
`agent-core/worktree-lifecycle`:
`bun ~/.tower/cli.mjs post <claim|finding|note> agent-core/worktree-lifecycle "<body>" --from "AGNT ledger-refresh"`.
Post a CLAIM naming your files before you start, findings as you get them,
and a final note when done. Stigmergic field verbs
(`bun ~/.tower/cli.mjs emit|field`) per `~/.tower/COMMS-ARCH.md` plane 5:
read the field before going idle; `work-done` when finished; `need-help`
instead of silence. Never go quiet holding an open question.

**Constraints.** NO MOCKS — verify against the real files with real greps. One
write per file per thought: compose consecutive edits into a single call, and
read a file again before any second write to it. Do not bypass the grounding
hook, write gate, credential-guard, or spawn door — a refusal is information.
**You never commit.** Do not run dependency installers. Do not touch
`~/herdr-spine` or `~/cursor-shim` working trees at all, not even to tidy: they
hold verified, unlanded diffs.

## Pre-Verified Facts (the orchestrator ran each of these on 2026-08-16)

1. **The stale ledger row.** `primitives/rules/ENFORCEMENT.md:47`, verbatim:
   ```
   | Worktree lifecycle (unit-scoped birth/death, flat topology, sparse by default, safe teardown) | worktree-lifecycle.md | none mechanical | DOCTRINE | candidate: sparse-at-spawn, teardown-door |
   ```
   Table contract, `ENFORCEMENT.md:30-31`:
   `| Law | Source | Enforcer | Status | Coverage |`. Status vocabulary is
   DOOR (sanctioned tool's only path), HOOK (mechanical refusal), DOCTRINE
   (honest unenforced label). Mixed rows exist in this table already — see
   line 43's `DOOR+HOOK` and line 44's `HOOK (CC concierge sessions)` with a
   Coverage cell reading `others: DOCTRINE`. Follow those shapes.

2. **The stale compilation note.** `primitives/rules/worktree-lifecycle.md`
   section 7 (around line 88-92), verbatim:
   ```
   ## 7. Enforcer: DOCTRINE with compilation note

   **Status: DOCTRINE** — unenforced prose. This law will be violated under pressure.

   **Compilation note:** Doors for sparse-at-spawn and automated teardown are in flight in a sibling unit, unwired at time of writing (2026-08-16). Zero `sparse` hits in either spawner (`~/herdr-spine/bin/spine-spawn`, `~/cursor-shim/`); no teardown door binary in `~/herdr-spine/bin/`; no enforcer post on the board topic at dispatch. When the sibling unit's doors land, update this row to HOOK.
   ```
   Both statements were true when written and are false now. The file ends with
   a `SOURCES:` line — keep it accurate for whatever you add.

3. **The sibling orchestrator's enforcer status**, posted to board topic
   `agent-core/worktree-lifecycle` at 2026-08-16T17:28Z by `ORCH
   worktree-doors`, and re-verified independently by the coordinator and by me:

   - **DOOR (cursor path).** `cursor-finish:460 trap cleanup_and_preserve_rc
     EXIT` fires on every halt, die, or crash; the handler saves the incoming
     status BEFORE cleanup and re-exits with it, so cleanup can never mask a
     failing run. Cleanup is preserve-or-keep: parks detached HEADs on a
     branch, commits dirty work, re-checks reachability from a ref, removes
     only if safe; when a pre-commit hook refuses it keeps the directory, skips
     `branch -D`, names the path, and returns non-zero. `cursor-spine` also
     carries EXIT traps at :721 and :766.
   - **DOOR (sparse, both spawners).** `spine-spawn` narrows a coder worktree
     via explicit `--sparse` or by parsing the brief's `Touch ONLY` partition;
     `cursor-spine sparse-apply` narrows a cursor-agent worktree
     post-creation. Absent a partition BOTH degrade to a full checkout plus a
     WARN naming the cost — never a silent narrowing.
   - **DOCTRINE (spine-side auto-invocation) — the honest gap you must
     preserve, not paper over.** `spine-spawn reap <path>` is correct and
     registered — in `--help`, preserve-or-keep, fails loudly and non-zero
     while a directory still stands — but **nothing invokes it
     automatically.** That is structural, not laziness: `cursor-finish` owns a
     unit's whole lifetime so an EXIT trap belongs there, whereas `spine-spawn`
     exits immediately while the pane it spawned lives on, so an EXIT trap
     there would delete the worktree out from under a running agent. Some other
     tier must own the reap. Until a rule or supervisor forces it, spine-side
     teardown is DOCTRINE and an orchestrator that forgets still leaks.

4. **Suites, re-run personally by the coordinator:** `herdr-spine
   test/worktree-lifecycle.sh` 14/14 exit 0; `cursor-shim
   docs/worktree-lifecycle-verify.sh` 51/51 exit 0; `cursor-shim
   docs/qa-verify.sh` 149 total, 147 passed, 2 pre-existing failures. Both
   spawners' changes are **uncommitted in their working trees** awaiting the
   coordinator — a fact worth stating plainly if you cite them.

## Touch ONLY

```
~/agent-core/primitives/rules/ENFORCEMENT.md          (line 47 row only)
~/agent-core/primitives/rules/worktree-lifecycle.md   (section 7 + SOURCES line)
```

Nothing else. Not `~/.agent-core/registry`. Not `HARNESS-PARITY.md`. Not
`control-flow.md`. Not `AGENTS.md`. Not either spawner repo.

## Task

Rewrite the ledger row and the compilation note to say what is now true, at the
altitude of the surrounding prose. Record DOOR where a door exists; keep the
spine-side auto-invocation gap explicitly labelled DOCTRINE **with its
structural reason**, in both places. Do not upgrade either statement beyond the
evidence in fact 3 — a row that claimed DOOR everywhere would be a lie that
costs the next sweep. Section 7's heading and its "update this row to HOOK"
instruction are both stale; replace them.

## The acceptance suite (authored before this brief was dispatched)

`~/agent-core/briefs/worktree-lifecycle/criteria/verify-5b-ledger-refresh.sh`
is your gate. It was written by the orchestrator, not by you, and it was run
before dispatch: **7 passed, 11 failed** against the current tree. Every red is
an unimplemented criterion. It is read-only. Run it, make it green, do not edit
it — if you believe an assertion is wrong, post a finding to the board and say
so in your report rather than changing the suite.

One thing worth knowing from writing it: `ENFORCEMENT.md:41` already carries 7
pipes because it quotes the regex `Agent\|Task` inside a cell. That is
pre-existing, outside your partition, and the suite exempts it by name. Do not
"fix" it.

## Done when

0. `bash briefs/worktree-lifecycle/criteria/verify-5b-ledger-refresh.sh` exits
   0 with `TOTAL 18 passed, 0 failed`, and you quote the full output.
1. `grep -n 'in flight\|unwired at time of writing' ~/agent-core/primitives/rules/worktree-lifecycle.md`
   returns **nothing** (exit 1). Quote the command and its empty output.
2. The `ENFORCEMENT.md` row names what is DOOR and what remains DOCTRINE, and
   cites the specific evidence `cursor-finish:460` and `spine-spawn --help`.
   Quote the new row verbatim.
3. The section 7 note names the same split with the structural reason for the
   spine-side gap. Quote the new section verbatim.
4. The table still parses as a 5-column markdown table (no unescaped `|` inside
   cells) — verify by eye against `ENFORCEMENT.md:30-31` and quote the row's
   pipe count.
5. `git -C ~/agent-core status --porcelain primitives/rules/` shows exactly
   these two files modified and nothing else.

## Report back with

- Each done-when quoted with the evidence that satisfied it: exact command,
  output, file path, line numbers.
- The full text of both replacements, verbatim.
- Anything in the Pre-Verified Facts that turned out to be wrong, with what you
  found instead. That is the most valuable thing you can report.
- Post the same summary to the board topic, then write your `.done`.
