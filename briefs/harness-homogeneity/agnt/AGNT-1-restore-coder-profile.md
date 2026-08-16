# Restore the law the cursor coder profile silently drops

You are an **AGNT** under `ORCH [doctrine-parity]`, in the
`harness-homogeneity` unit. Board topic: `agent-core/harness-homogeneity`.
Do NOT use emojis anywhere. Do NOT commit. Do NOT push. Do NOT merge.

## The unit, in one paragraph

One harness receives a different body of law than the others.
`~/cursor-shim/cursor-spine:503-505` resolves a profile by **whole-file
precedence** — a shim-local `profiles/<name>.md` wins outright and agent-core
is only the fallback:

```
PROMPT_PATH="$SHIM_DIR/profiles/$BASE.md"
[[ -f "$PROMPT_PATH" ]] || PROMPT_PATH="$PROFILES_DIR/$BASE.md"
```

The comment at `:500-502` states the intent: *"so agent-core is never touched
and the shim stays rippable."* The consequence is that every law agent-core
adds to a profile that the shim also overrides is **invisible on that
harness**. Closing that gap is this unit. Fixing the *resolution mechanism* is
a later unit (PLAN Phase 5) and is **explicitly out of scope** for you.

## Pre-Verified Facts (your ORCH ran every command and read every cited line, 2026-08-16)

- `~/cursor-shim/profiles/` contains exactly four files: `arbiter.md` (32
  lines), `coder.md` (39), `test-maker.md` (40), `tester.md` (28).
- `~/agent-core/primitives/profiles/` contains `coder.md` (39),
  `concierge.md` (205), `coordinator.md` (149), `orchestrator.md` (139),
  `researcher.md` (39), plus `PROFILES.md`, `models.json`, `selection.json`,
  `profile-model`. **`coder.md` is the only name present in both trees.**
- `~/agent-core/primitives/profiles/coder.md` structure, read in full:
  `:1` H1 `# CODER (AGNT)`, `:5-13` `## Hard rules` (5 bullets),
  `:9-10` the spine bullet, `:15-36` `## Stigmergic coordination (COMMS-ARCH
  plane 5 — ranks 1–4)`, `:38-39` `## Done looks like`.
  The section's first line is `## Stigmergic coordination (COMMS-ARCH plane 5 — ranks 1–4)`
  (note: **en dashes**, not hyphens) and its last line is
  ``and `… field`.``
- `grep -rn 'spine-claim\|spine-report\|spine-spawn' ~/cursor-shim/profiles/`
  returns **nothing**. `grep -rn 'Stigmergic\|pheromone\|work-available'
  ~/cursor-shim/profiles/` returns **nothing**. Both bodies of law are absent
  from every shim profile.
- `~/cursor-shim/rules/cursor-fleet.md:152-196` **does** carry stigmergic law
  in the shim. It is a rule file, not a profile; whether it reaches a spawned
  coder is not your question.
- `~/cursor-shim` is on branch `feat/a5-batch-record` @ `d9c3590`, tree clean.
  **Not `main`.** Where this lands is an open operator question (PLAN §7).
- **`ORCH-1 spine-routes-cursor` is running in parallel** on
  `~/herdr-spine/bin/spine-spawn`, `ctl-fleet`,
  `~/agent-core/primitives/HARNESS-PARITY.md`, and
  `primitives/rules/worktree-lifecycle.md`. Disjoint from you. Do not read-and-edit
  its files.

## The premise, corrected — binds you

The brief that opened this project claimed workers are told to use
`spine-claim` and that "on cursor that instruction is dead on arrival". **That
is wrong.** `spine-claim:157` reads `$HERDR_PANE_ID`; `:213` calls `herdr pane
report-metadata`. herdr injects that variable into every pane it owns,
whatever engine is seated. The instruction **works on a cursor pane today,
unmodified**. The defect is that nothing on the cursor side ever *issues* it.
This is a doctrine gap, not a capability gap. Do not "fix" `spine-claim`
anywhere, and do not rewrite historical briefs — they are the project record.

## You run in an isolated git worktree

`spine-spawn` forces coder spawns into their own worktree
(`spine-spawn:505-522`). Your cwd is a worktree of `~/cursor-shim`, sparse to
`profiles/`. Edit `profiles/coder.md` **relative to your cwd**. Read
agent-core files by **absolute path** (`~/agent-core/...`) — they are a
different repo and always visible. Do NOT write to
`/Users/jrg/cursor-shim/profiles/coder.md` directly; your ORCH integrates.

## Tower (mid-run communication)

Tower is **MAILBOX ONLY**. The write gate is unproven and a peer CORD is
probing it. Do not describe Tower as operational. Run every Tower command
from `~/agent-core` — the field is cwd-scoped.

- Board: `cd ~/agent-core && bun ~/.tower/cli.mjs post <claim|finding|note> agent-core/harness-homogeneity "<body>" --from "AGNT restore-coder-profile"`
- Self-report: `~/herdr-spine/bin/spine-report task "<what>"` /
  `~/herdr-spine/bin/spine-report verdict "<result>"`

**MANDATORY — the stigmergic field. You are rank 3.** Ranks 1-4 coordinate
through the environment, never by talking to each other. Emit `work-available`
with **mandatory evidence** — an emit without evidence is not an emit. Read
the field before ever going idle. Claim with `work-claimed` `ref`-ing the
exact pheromone id; `work-done` `ref`-ing what you claimed; `need-help` rather
than going quiet. TTL is short and an unheartbeated claim evaporates by
design.

`cd ~/agent-core && bun ~/.tower/cli.mjs emit <scent> <topic> <payload_ref> [--ref id] [--evidence path] [--ttl N]` · `... field`

**Two legal stopping conditions only:** every done-when met, or a posted
`need-help` naming what is needed and who owns it, **after** doing everything
that does not depend on it. "Reported and awaited instruction" is not a
stopping state. Post CLAIM first, findings during, `.done` last.

## Constraints

- **Do not bypass** `credential-guard`, the grounding hook, the write-gate, or
  the spawn-door. A refusal is information — post it, do not route around it.
- **One write per file per thought.** The grounding guard blocks a second
  consecutive write to a file with no evidence read between. Compose your
  edits into a single call; if you need a second write, **Read the file first,
  by contract** — the read comes before the attempt, not after the refusal.
- No provider, model, or harness names anywhere in what you write.
- Do not change how a profile is *resolved*. That is PLAN Phase 5.
- Do not break cursor spawning. You are editing one markdown file.

---

## Your file partition — binding

**You own, exclusively:** `profiles/coder.md` in your worktree (upstream
`~/cursor-shim/profiles/coder.md`).

**You must NOT touch:** anything else in `~/cursor-shim` — in particular
`cursor-spine`, `cursor-fleet`, `cursor-finish`, `rules/`, the other three
profiles; anything in `~/agent-core` (read-only to you); anything in
`~/herdr-spine`.

## Task — one file, both bodies of law

Rewrite `profiles/coder.md` so a cursor coder receives **everything the shim
override adds AND everything it currently drops**.

1. **Keep the isolation wall in full, unweakened.** It is the reason the
   override exists and it is good law. Every bullet of the current
   `## The isolation wall (non-negotiable) — and WHY it exists` section
   (`~/cursor-shim/profiles/coder.md:11-24`) survives verbatim in substance:
   the deliberate Plan→Implementation bifurcation and why it is a
   check-and-balance; you do not write / do not run / do not judge your own
   tests; build from the PLAN, never the suite; under `cursor-fleet make` the
   tests are physically absent from your checkout and you must not seek them,
   reconstruct them, or ask a peer for them.
2. **Restore the spine bullet**, from
   `~/agent-core/primitives/profiles/coder.md:9-10`: *"Claim owned resources on
   herdr (`spine-claim`) when contention matters; report task/verdict via
   `spine-report` so the sidebar stays honest."*
3. **Restore the whole stigmergy section, byte-identical** to
   `~/agent-core/primitives/profiles/coder.md:15-36`. **Copy it; do not
   paraphrase, do not re-wrap, do not normalise the en dashes.** The two files
   must not be able to drift on wording.
4. **Keep the header note** explaining why a shim override exists, and **add**
   a line that (a) names what this file inherits verbatim from
   `~/agent-core/primitives/profiles/coder.md` and (b) warns that the
   stigmergy section is a **copy that must be kept in sync** until PLAN Phase 5
   replaces file-precedence with composition.
5. Keep the shim's own hard rules and `## Done looks like` — the arbiter
   routing rule and the nQ escalation rule are shim law and stay.

### Done when — every one of these, evidenced

1. This produces **no output** (run it from your worktree; it compares
   agent-core's section against yours):
   ```
   diff <(sed -n '/^## Stigmergic coordination/,/^and `… field`\.$/p' ~/agent-core/primitives/profiles/coder.md) \
        <(sed -n '/^## Stigmergic coordination/,/^and `… field`\.$/p' ./profiles/coder.md)
   ```
   **Before trusting the diff, prove the extraction is complete**: the
   agent-core side must be 22 lines and must both start with `## Stigmergic`
   and end with ``and `… field`.``. If your end-anchor does not match the real
   last line, fix the anchor — a diff of two empty extractions is not a pass.
   Paste the line counts of both sides in your report.
2. `grep -c 'spine-claim' ./profiles/coder.md` is ≥ 1 **and**
   `grep -c 'spine-report' ./profiles/coder.md` is ≥ 1. Paste both numbers.
3. The isolation wall is present in full — **list every one of its bullets in
   your report** and state, per bullet, that it survived. A count is not
   evidence; name them.
4. `wc -l ./profiles/coder.md` and the full final file are pasted in your
   report.
5. No provider, model, harness name, or `--kind` appears in the file:
   `grep -niE 'claude|cursor-agent|gpt|opus|sonnet|--kind' ./profiles/coder.md`
   — explain any hit that remains (the word "cursor" describing the shim
   itself is legitimate; a model name is not).
6. `.done` written at `.done-agnt-restore-coder-profile` in your worktree
   root, **after** 1-5 are evidenced, not before.

## Report back with

- The full final `profiles/coder.md`.
- The diff command's output (empty) plus both extraction line counts.
- Both grep counts.
- The isolation-wall bullets, named one by one, confirmed intact.
- The absolute path of your worktree, so your ORCH can integrate it.
- Anything in the Pre-Verified Facts above that turned out wrong, and what you
  found instead.
- Any other law you noticed missing from this profile that this task did not
  ask you to restore — name it, do not add it.
