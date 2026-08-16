# Make the cursor directive tell the truth about the spawn path

You are an **AGNT** under `ORCH [doctrine-parity]`, in the
`harness-homogeneity` unit. Board topic: `agent-core/harness-homogeneity`.
Do NOT use emojis anywhere. Do NOT commit. Do NOT push. Do NOT merge.

## Why this file matters more than its size suggests

`~/agent-core/primitives/directives/cursor.md` is **16 lines, one bullet** —
and it is canonical. `agent-core sync --harness cursor` composes it into the
deployed entrypoint `~/AGENTS.md`, so every session on that harness reads it
at wake. A stale line here is not a stale note; it is a false instruction
delivered machine-wide.

`:10-11` currently reads:

```
  fleet spawn = `~/cursor-shim/cursor-fleet` / `~/cursor-shim/cursor-spine`
  (not `spine-spawn --kind cursor`)
```

The parenthetical was true when written. `ORCH-1 spine-routes-cursor` has
landed the change that makes it false, and has deposited the proof.

## Pre-Verified Facts (your ORCH ran every command and read every cited line, 2026-08-16)

- `~/agent-core/primitives/directives/cursor.md` is exactly 16 lines, a single
  bullet with sub-clauses: composed entrypoint + `agent-core sync`, hooks in
  `~/.cursor/hooks.json`, MCP in `~/.cursor/mcp.json`, tool skills in
  `~/.cursor/skills-cursor/`, **fleet spawn (`:10-11`)**, briefs-name-profiles-only,
  `cursor-fleet make` Verify beat, daily entry, repo rule.
- `agent-core --help` lists `sync <id>`, `sync --harness <name>`,
  `sync --dry-run`. **`agent-core sync --harness cursor` is the targeted
  re-sync**; a bare `agent-core sync` is machine-wide. You run **neither**.
- The proof lives at
  `~/agent-core/briefs/harness-homogeneity/PROOF-cursor-spawn.md`. Your ORCH
  waited on it with `latch` and confirmed it exists before spawning you. It is
  ORCH-1's artifact; you read it, you never write it.
- **Nothing in `~/cursor-shim` calls `spine-spawn`.** `grep -c`: `cursor-spine`
  0, `cursor-finish` 0, `cursor-fleet` 1 — and that single hit is the comment
  at `cursor-fleet:5`. So `~/cursor-shim/README.md:20` ("never `spine-spawn`")
  stays true even after ORCH-1's change: the change gives the *binary* a new
  capability, it does not make the shim call it. Do not "fix" README.md — it is
  not yours and it is not wrong.
- The shim's Verify beat is real, current law: `cursor-fleet make` enforces
  bifurcated test/impl worktrees, an arbiter, nQ<=3. `~/cursor-shim/rules/cursor-fleet.md`
  is 166+ lines and carries the stigmergic field law at `:162-178`. **Nothing
  ORCH-1 did retires the shim.** A directive that reads as though `spine-spawn`
  replaced `cursor-fleet` would be a new falsehood replacing an old one.
- Sibling work already landed in this unit, for context, not for you to touch:
  `~/cursor-shim/profiles/coder.md` was restored (committed
  `doctrine/coder-profile-parity` @ `97073c5`) and
  `briefs/harness-homogeneity/DOCTRINE-SWEEP.md` was integrated (134 lines).
- `~/agent-core` is at `4d3058a`, post-history-rewrite. Board finding
  `concierge @ agent-core/harness-homogeneity`, 18:43:18.650Z: *"FREEZE LIFTED
  on ~/agent-core... origin/main = 4d3058a."* Your ORCH owns the commit.

## You run in an isolated git worktree

`spine-spawn` forces coder spawns into their own worktree
(`spine-spawn:505-522`). Your cwd is a worktree of `~/agent-core`, sparse to
`primitives/`. Edit `primitives/directives/cursor.md` **relative to your cwd**.
Read `~/agent-core/briefs/...` by **absolute path** — the brief tree is
untracked upstream and will not be in your checkout. Do NOT write into
`/Users/jrg/agent-core/` directly; your ORCH integrates.

## Tower (mid-run communication)

Tower is **MAILBOX ONLY**. The write gate is unproven and a peer CORD is
probing it. Do not describe Tower as operational. Run every Tower command
from `~/agent-core` — the field is cwd-scoped.

- Board: `cd ~/agent-core && bun ~/.tower/cli.mjs post <claim|finding|note> agent-core/harness-homogeneity "<body>" --from "AGNT cursor-directive-truth"`
- Self-report: `~/herdr-spine/bin/spine-report task "<what>"` /
  `~/herdr-spine/bin/spine-report verdict "<result>"`

**MANDATORY — the stigmergic field. You are rank 3.** Ranks 1-4 coordinate
through the environment, never by talking to each other. Emit `work-available`
with **mandatory evidence**. Read the field before ever going idle. Claim with
`work-claimed` `ref`-ing the exact pheromone id; `work-done` `ref`-ing what you
claimed; `need-help` rather than going quiet.

`cd ~/agent-core && bun ~/.tower/cli.mjs emit <scent> <topic> <payload_ref> [--ref id] [--evidence path] [--ttl N]` · `... field`

**Two legal stopping conditions only:** every done-when met, or a posted
`need-help` naming what is needed and who owns it, **after** doing everything
that does not depend on it. "Reported and awaited instruction" is not a
stopping state — and **neither is backgrounding a wait and ending your turn.**
A sibling AGNT in this unit did exactly that and had to be reaped mid-task. If
you must wait, block in the foreground.

## Constraints

- **Do not bypass** `credential-guard`, the grounding hook, the write-gate, or
  the spawn-door. A refusal is information — post it, do not route around it.
- **One write per file per thought.** The grounding guard blocks a second
  consecutive write to a file with no evidence read between. Compose your edits
  into a single call; if you need a second write, **Read the file first, by
  contract**.
- **Do NOT run `agent-core sync` in any form.** Naming the command in your
  report is your job; running it is your ORCH's call.
- No provider or model names. This file names the harness — that is its
  purpose — but never a model, a provider, or `--kind` in brief text.

---

## Your file partition — binding

**You own, exclusively, in your worktree:** `primitives/directives/cursor.md`.

**You must NOT touch:** anything in `~/cursor-shim`; `PROOF-cursor-spawn.md`
(ORCH-1's artifact, read-only); `briefs/harness-homogeneity/DOCTRINE-SWEEP.md`
(your ORCH owns it); `primitives/HARNESS-PARITY.md`,
`primitives/rules/worktree-lifecycle.md`, anything in `~/herdr-spine`
(ORCH-1's partition); `primitives/directives/` files for any other harness.

## Task

1. **Read `~/agent-core/briefs/harness-homogeneity/PROOF-cursor-spawn.md` in
   full, first.** It must contain an **observed `agent_status` flip to
   `working`** from a real spawn. Quote that literal line in your report.
   **If it does not contain one, stop and post a finding — do not edit a
   canonical directive on a proof that does not prove it.** That is a legal
   stopping state.
2. **Read all 16 lines of `primitives/directives/cursor.md`** before writing.
3. Rewrite `:10-11` so it names the spawn path the proof actually establishes.
   The new text must survive all three of these being true at once: the spine
   can now seat this harness; the shim's `cursor-fleet` / `cursor-spine` still
   exist and still own the Verify beat; and a reader must be able to tell
   **which to use when** without opening another file. Do not simply delete the
   parenthetical and leave an ambiguity in its place.
4. **Re-read the whole file for collateral falsehood.** Check at minimum the
   daily-entry clause, the `cursor-fleet make` Verify-beat clause, the
   repo-rule clause, and the briefs-name-profiles-only clause. Correct what the
   change falsifies; preserve everything it does not. If nothing else is
   falsified, **say so explicitly, clause by clause** — silence is not a check.

### Done when — every one of these, evidenced

1. The literal `agent_status` -> `working` line from `PROOF-cursor-spawn.md` is
   quoted in your report, with its line number in that file.
2. `sed -n '10,11p' primitives/directives/cursor.md` no longer asserts that
   `spine-spawn` is not the spawn path, and the new text names what is.
3. `wc -l primitives/directives/cursor.md` reported; the full final file pasted.
4. Every remaining clause is listed in your report with a verdict:
   still-true / corrected (with the correction quoted).
5. `grep -niE 'gpt|opus|sonnet|claude|cursor-agent' primitives/directives/cursor.md`
   — every hit justified. Naming the harness is correct here; naming a model is
   not.
6. `git -C <your worktree> status --porcelain` shows **only**
   `primitives/directives/cursor.md` plus your `.done` marker. No commit:
   `git log --oneline -1` unchanged from the branch point.
7. The re-sync command is **named** in your report
   (`agent-core sync --harness cursor`) and **not run**.
8. `.done` written at `.done-agnt-cursor-directive-truth` in your worktree
   root, after 1-7 are evidenced, not before.

## Report back with

- The quoted status-flip line and its source line number.
- The exact old and exact new text of `:10-11`.
- The clause-by-clause verdict table for the rest of the file.
- The full final file.
- Your worktree's absolute path, so your ORCH can integrate.
- Anything in the Pre-Verified Facts above that turned out wrong, and what you
  found instead.
