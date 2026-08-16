# AGNT — register the two worktree-lifecycle doors in the machine registry

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

Two residuals remain. Yours is the registry registration. A sibling AGNT is
refreshing the enforcer ledger row in `ENFORCEMENT.md` and
`worktree-lifecycle.md` at the same time — do not touch those two files.

**Tower (mailbox only this session).** Board topic
`agent-core/worktree-lifecycle`:
`bun ~/.tower/cli.mjs post <claim|finding|note> agent-core/worktree-lifecycle "<body>" --from "AGNT registry-doors"`.
Post a CLAIM naming your file before you start, findings as you get them,
and a final note when done. Stigmergic field verbs
(`bun ~/.tower/cli.mjs emit|field`) per `~/.tower/COMMS-ARCH.md` plane 5:
read the field before going idle; `work-done` when finished; `need-help`
instead of silence. Never go quiet holding an open question.

**Constraints.** NO MOCKS — test against the real registry and the real
`agent-core status`. One write per file per thought: compose consecutive edits
into a single call, and read a file again before any second write to it. Do not
bypass the grounding hook, write gate, credential-guard, or spawn door — a
refusal is information. **You never commit.** Do not run dependency installers.
Do not touch `~/herdr-spine` or `~/cursor-shim` working trees at all, not even
to tidy: they hold verified, unlanded diffs.

## Pre-Verified Facts (the orchestrator ran each of these on 2026-08-16)

1. **The registry is a data file, not Zig source.** Default path
   `~/.agent-core/registry` (`cli/src/main.zig:50-56`). 896 lines, 34,346
   bytes. It is **untracked** — editing it changes machine state, not repo
   content, and will never appear in a commit. There is no git safety net:
   back it up before you write.
   `cli/src/registry.zig` is the PARSER. Do not edit it. No Zig change is
   needed for this task.

2. **Check-only verbs exist for exactly this case.** `registry.zig:23-27`:
   ```
   deploy <harness> <path>            # MANAGED copy
   link   <harness> <path>            # CHECK-ONLY: path must be a symlink -> source
   check  <harness> <path>            # CHECK-ONLY: path must mention source
   check  <harness> <path>#<needle>   # CHECK-ONLY: path must mention needle
   binary <harness> <path>            # CHECK-ONLY: executable, no older than source
   ```
   `registry.zig:38-50`: the three non-deploy verbs "register estate agent-core
   does NOT own ... so that `status` can tell the truth about it. They are
   read-only: `sync` reports their state and writes nothing." And: "A harness
   name in a check-only line need not be a declared profile: `machine` is used
   for machine-wide, harness-independent estate (tool binaries, git hooks)."

3. **Needle parsing allows spaces.** `registry.zig:410-421` splits the path at
   the FIRST `#` and takes everything after it, to end of line, as the needle
   (trailing whitespace trimmed by the earlier `std.mem.trim`). A needle
   containing spaces is legal. `presence.zig:100-113` (`checkReference`) reads
   the destination file's bytes and reports missing when the needle is absent —
   it is a plain substring test (`wiringPresent`, `presence.zig:61-64`).

4. **Live `machine`-scope precedents in the registry:**
   - `:696` `check machine ~/agent-core/.git/hooks/pre-commit#agent-core/primitives/hooks/credential-guard.sh`
     (block `hook/credential-guard`, lines 693-698, with an explanatory comment
     block above it — match that shape.)
   - `:837` / `:842` / `:847` / `:852` `binary machine ~/.local/bin/{slim,latch,vein,assay}`.

5. **Baseline.** `cd ~/agent-core && agent-core status` last line today:
   `summary: 334 ok  0 stale  0 missing`, exit 0. NOTE: the coordinator's brief
   quoted `265 ok · 4 stale · 57 missing` from an earlier run; that is stale —
   report the real before/after numbers you measure.

6. **A standing note in the file that your change touches.** Registry lines
   887-896 carry a comment headed
   `# ── Enforcement estate deliberately NOT registered this pass ──` which
   includes: "spine handlers (~/herdr-spine): a separate program with its own
   layout" and "The line: agent-core registers what agent-core authors, plus
   the WIRING that proves an authored thing is live. It does not claim other
   programs' files." Your entries are the second half of that line — wiring
   that proves an agent-core-authored LAW (`worktree-lifecycle.md`) is
   compiled — but they do land inside another program's file. **Amend that
   comment honestly to record the narrow exception and its reason.** Do not
   delete the note.

## Touch ONLY

```
~/.agent-core/registry
```

Plus your backup, which goes in your scratchpad, NOT in any repo. Nothing else.
Not `cli/src/**`. Not `ENFORCEMENT.md`. Not `worktree-lifecycle.md`. Not
`HARNESS-PARITY.md`. Not either spawner repo.

## Task

Register **both doors** as check-only entries under the `machine` scope,
matching the shape and placement of the `hook/credential-guard` precedent (a
comment block explaining the entry, then the primitive block).

Starting shape — adopt it unless you can prove a better one:

```
primitive rule/worktree-teardown-cursor
  source ~/agent-core/primitives/rules/worktree-lifecycle.md
  check machine ~/cursor-shim/cursor-finish#trap cleanup_and_preserve_rc EXIT
end

primitive rule/worktree-teardown-spine
  source ~/agent-core/primitives/rules/worktree-lifecycle.md
  check machine ~/herdr-spine/bin/spine-spawn#def cmd_reap(
end
```

Contingency: if the `rule/` primitive-type prefix is rejected or mishandled by
`agent-core status`, fall back to `hook/` (these are gates) and say so in your
report with the error you saw. Verify which types the parser accepts before
guessing — `registry.zig` line 3-4 lists them.

**The needle must fail when the door is removed or reverted.** A registry entry
that still passes after someone deletes the trap is worse than no entry: it
launders absence as coverage. Choose needles on that criterion and justify each
one in a sentence.

## The acceptance suite (authored before this brief was dispatched)

`~/agent-core/briefs/worktree-lifecycle/criteria/verify-5a-registry-doors.sh`
is your gate. It was written by the orchestrator, not by you, and it was run
before dispatch: **4 passed, 12 failed** against the current tree. Every red is
an unimplemented criterion. Run it, make it green, do not edit it — if you
believe an assertion is wrong, post a finding to the board and say so in your
report rather than changing the suite.

Two things worth knowing from writing it:

- `agent-core status` emits ANSI colour even when stdout is not a TTY. Strip it
  before matching, or your greps will silently miss.
- The suite proves absence-detection **without writing to `~/cursor-shim` or
  `~/herdr-spine` at all**: it copies both door files into a fixture, rewrites
  the registry's two `check machine` paths to point at the copies, confirms ok,
  then removes the needle from the copies and confirms the rows flip off ok.
  Use that method. Do NOT perturb the real door files — those working trees
  hold verified, unlanded diffs, and a one-byte difference is a failure of this
  task.

## Done when

1. `bash briefs/worktree-lifecycle/criteria/verify-5a-registry-doors.sh` exits
   0 with `TOTAL 16 passed, 0 failed`, and you quote the full output.
2. `cd ~/agent-core && agent-core status` shows **both** entries, and you quote
   the two rows plus the summary line.
3. **Absence is proven detected, for each entry separately** — criteria 4b and
   4c. Quote the ok-row and the flipped-row output for both doors.
   A registration you have only seen pass is not verified.
4. The `# Enforcement estate deliberately NOT registered this pass` comment is
   amended to record this exception and its reasoning, without deleting the
   original reasoning.
5. Before/after `summary:` lines are both quoted, and any movement in the
   `missing` count is explained.
6. `shasum ~/cursor-shim/cursor-finish ~/herdr-spine/bin/spine-spawn` matches
   the values you took before you started. Quote both.

## Report back with

- Each done-when quoted with the evidence that satisfied it: exact command,
  output tail, file path, line numbers of what you added.
- Both halves of both perturbation tests, and the `cmp`/`shasum` restore proof.
- The needle you chose for each door and the one-sentence justification.
- Anything in the Pre-Verified Facts that turned out to be wrong, with what you
  found instead. That is the most valuable thing you can report.
- Post the same summary to the board topic, then write your `.done`.
