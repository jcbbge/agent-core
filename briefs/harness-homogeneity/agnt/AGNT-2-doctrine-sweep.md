# Sweep the shim for shadowed doctrine, and make the cursor directive true

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
- `grep -rn 'spine-claim\|spine-report\|spine-spawn' ~/cursor-shim/profiles/`
  returns **nothing**. `grep -rn 'Stigmergic\|pheromone\|work-available'
  ~/cursor-shim/profiles/` returns **nothing**. Neither body of law is in any
  shim profile.
- `~/cursor-shim/rules/cursor-fleet.md:152-196` **does** carry stigmergic law
  (pheromone store, no addressee, TTLs, `work-available` with mandatory
  evidence, the nQ `need-help` field expression). `rules/` contains that one
  file.
- `~/cursor-shim` top level: `README.md`, `cursor-finish`, `cursor-fleet`,
  `cursor-spine`, and the dirs `agents/` (**empty**), `briefs/`, `docs/`,
  `levers/`, `profiles/`, `rules/`, `rip-out/`, plus the state dirs `.instr/`,
  `.make/`, `.orch/`, `.verify/`. **`bolt-on` is a FILE, not a directory.**
  **There is no `.cursor/` directory in the shim.**
- `~/cursor-shim/README.md:20` asserts the shim *"never `spine-spawn`"*.
  `~/cursor-shim/levers/lever-7-fanout.md:6,11` cite `spine-spawn`'s fan-out
  as a contract to mirror.
- `~/agent-core/primitives/directives/cursor.md` is **16 lines**, one bullet.
  `:10-11` reads: *"fleet spawn = `~/cursor-shim/cursor-fleet` /
  `~/cursor-shim/cursor-spine` (not `spine-spawn --kind cursor`)"*. This file
  is canonical and is **composed into the deployed cursor entrypoint**
  (`~/AGENTS.md`) by `agent-core sync directive/core`.
- `~/agent-core` is at `4d3058a` (post-history-rewrite). Board finding
  `concierge @ agent-core/harness-homogeneity`, 2026-08-16T18:43:18.650Z:
  *"FREEZE LIFTED on ~/agent-core. The history rewrite is DONE and pushed.
  origin/main = 4d3058a."* Your ORCH owns commits; you do not commit.
- **`ORCH-1 spine-routes-cursor` is running in parallel** on
  `~/herdr-spine/bin/spine-spawn`, `ctl-fleet`,
  `~/agent-core/primitives/HARNESS-PARITY.md`, and
  `primitives/rules/worktree-lifecycle.md`. Disjoint from you. Read them if you
  must; **never edit them**.
- `~/agent-core/briefs/harness-homogeneity/PROOF-cursor-spawn.md` **does not
  exist yet.** ORCH-1 produces it. Task T4 is gated on it.
- A sibling AGNT owns `~/cursor-shim/profiles/coder.md` and is rewriting it
  right now. **Read it if you need to, never write it.** Your sweep describes
  the defect and the sibling's fix as in flight; do not duplicate the fix.

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
(`spine-spawn:505-522`). Your cwd is a worktree of `~/agent-core`. Write your
deliverables **relative to your cwd**. Read `~/agent-core/briefs/...` and
`~/cursor-shim/...` by **absolute path** — the brief tree is untracked
upstream and will not be in your checkout, and the shim is a different repo.
Do NOT write into `/Users/jrg/agent-core/` directly; your ORCH integrates.

## Tower (mid-run communication)

Tower is **MAILBOX ONLY**. The write gate is unproven and a peer CORD is
probing it. Do not describe Tower as operational. Run every Tower command
from `~/agent-core` — the field is cwd-scoped.

- Board: `cd ~/agent-core && bun ~/.tower/cli.mjs post <claim|finding|note> agent-core/harness-homogeneity "<body>" --from "AGNT doctrine-sweep"`
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
- No provider or model names in what you write. `directives/cursor.md` is the
  one file where naming the harness is correct — that is its purpose.
- Do not change how a profile is *resolved*. That is PLAN Phase 5.
- **Do not poll and do not `sleep`.** Wait with `latch`, once.

---

## Your file partition — binding

**You own, exclusively, in your worktree:**

- `briefs/harness-homogeneity/DOCTRINE-SWEEP.md` (you create it)
- `primitives/directives/cursor.md` (T4 only, and only after the gate opens)

**You must NOT touch:** `~/cursor-shim/profiles/coder.md` (sibling AGNT owns
it) or anything else in `~/cursor-shim`; `primitives/HARNESS-PARITY.md`,
`primitives/rules/worktree-lifecycle.md`, anything in `~/herdr-spine`
(ORCH-1 owns these, running now); any brief under `briefs/credential-scrub/`
or `briefs/tower-bus-integrity/` (live peer units); the ~35 historical briefs
naming `spine-claim`.

## T1 — audit the three non-shadowing shim profiles

`arbiter.md`, `test-maker.md`, `tester.md` have no agent-core counterpart, so
they cannot shadow a file. But they are rank-3/4 profiles and the stigmergic
law binds ranks 1-4.

Decide, per file, whether the missing law is **a gap you close** or **a
deliberate exemption you name for the operator**. Think about the role: a
short-lived inner-loop referee is not obviously the same case as a coder that
holds a worktree for an hour. Say what you decided **and why**. Do not
silently add law to a file whose role does not take it, and do not silently
leave a gap either.

- **Done when:** `DOCTRINE-SWEEP.md` states, per file, with line-number
  citations: does it carry the stigmergic-field law? does it carry the
  two-legal-stopping-states rule? and your verdict — closed / exempt — with the
  reasoning. If you close a gap, you may only do it in a file you own, and you
  own **none of these three** — so a "close" verdict is a **recommendation to
  the operator**, stated as such, with the exact text you would add.

## T2 — sweep for other shadowed or harness-divergent doctrine

The `coder.md` shadow was found by comparing two files that happened to share
a name. Find out whether it is the only one.

- Compare every file in `~/cursor-shim/profiles/` against
  `~/agent-core/primitives/profiles/`.
- Then search the whole shim for any other file that **overrides, shadows, or
  restates** agent-core law: `rules/`, `agents/`, `docs/`, `levers/`,
  `briefs/`, `README.md`, the `bolt-on` file. State-only dirs (`.instr/`,
  `.make/`, `.orch/`, `.verify/`) are spawn records, not doctrine — say so
  once and exclude them, with the evidence that made that call.
- Judge `README.md:20` and `levers/lever-7-fanout.md:6,11` explicitly: does
  ORCH-1's change make either false, or do they say something else?
- **Done when:** `DOCTRINE-SWEEP.md` carries a table with columns **shim file ·
  agent-core counterpart (or none) · what diverges · verdict**, verdict one of
  *shadowing defect* / *legitimate addition* / *harmless*. **Every row cites a
  file and a line number.** A row may not read "unknown" unless it also carries
  the evidence that made it unknowable.

## T3 — record what this unit deliberately did NOT change

The originating brief asked for a sweep of every brief naming `spine-claim`.
The project's CORD ruled that sweep out on the evidence in "The premise,
corrected" above. That ruling must be visible to whoever reads this project
next, or it will be re-litigated.

- **Done when:** `DOCTRINE-SWEEP.md` closes with a section stating: the
  original instruction; why it was not carried out; the evidence
  (`spine-claim:157,213`; `~/agent-core/primitives/skills/brief/SKILL.md:64-81`
  and `:149-163`); and that the ~35 historical briefs naming `spine-claim` were
  left untouched **deliberately, as the project record** — per `shape.md:49-50`,
  a correction stands beside what it corrected. Verify the `brief/SKILL.md`
  line ranges yourself before citing them; if they moved, cite what is true.

## T4 — make the cursor directive tell the truth (GATED)

`~/agent-core/primitives/directives/cursor.md:10-11` asserts that
`spine-spawn --kind cursor` is **not** the spawn path. ORCH-1 is landing the
change that makes that parenthetical false. This file is composed into the
deployed cursor entrypoint, so a stale line here misinforms every session on
that harness.

**Do T1-T3 completely first.** Then, and only then, open the gate:

```
latch wait --file ~/agent-core/briefs/harness-homogeneity/PROOF-cursor-spawn.md --timeout 2h
```

Exit 0 = matched, 3 = timeout, 4 = vanished. **Run it once. Do not loop, do
not `sleep`.** If it exits non-zero, post `need-help` naming the gate and
ORCH-1 as its owner, finish your report without T4, and stop — that is a legal
stopping state.

If it exits 0: read `PROOF-cursor-spawn.md` in full. It must contain an
**observed `agent_status` flip to `working`**. If it does not, the gate has
not really opened — say so, post a finding, and do not edit the directive on a
proof that does not prove it.

Then rewrite `:10-11` to name the real spawn path as the proof establishes it,
and **read the whole 16-line file** for any other line the change falsifies
(check the `daily entry`, `cursor-fleet make`, and repo-rule lines
specifically). Preserve everything the change does not falsify — the shim's
Verify beat is still real law.

- **Done when:** the file names the true spawn path; you quote in your report
  the exact status-flip line you relied on from `PROOF-cursor-spawn.md`; no
  remaining line contradicts it; and, if the composed entrypoint needs a
  re-sync to deploy, you **name the command in your report and do not run
  it** — a machine-wide sync is your ORCH's call, not yours.

## Report back with

- The T2 table's headline: how many shim files shadow an agent-core
  counterpart, and how many diverge **in law** rather than merely in role.
- Your per-file verdicts from T1, each with its reasoning in one line.
- Whether T4's gate opened, the `latch` exit code, what you quoted from
  `PROOF-cursor-spawn.md`, and the directive's exact new text for `:10-11`.
- Any harness-divergent doctrine you found that this unit does **not** fix —
  named explicitly, so a later unit can pick it up.
- Every file you created or modified, with its worktree-absolute path.
- Anything in the Pre-Verified Facts above that turned out wrong, and what you
  found instead.
- `.done` written at `.done-agnt-doctrine-sweep` in your worktree root, after
  the above is evidenced, not before.
