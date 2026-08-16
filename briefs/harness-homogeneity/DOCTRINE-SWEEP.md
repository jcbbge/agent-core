# Doctrine sweep — shadowed and harness-divergent law in the cursor shim

AGNT doctrine-sweep, `harness-homogeneity` unit, 2026-08-16. Scope: audit
only — the resolution mechanism (`cursor-spine:503-505`, whole-file
precedence) is unchanged by this document; that is PLAN Phase 5.

## T1 — the three non-shadowing shim profiles (rank-3/4, stigmergic law binds them)

| File | Stigmergic-field law present? | Two-legal-stopping-states rule present? | Verdict |
|---|---|---|---|
| `~/cursor-shim/profiles/arbiter.md` (32 lines) | No — full file read, lines 1-32; no `pheromone`/`work-available`/`Stigmergic` string, confirmed by the pre-verified `grep -rn 'Stigmergic\|pheromone\|work-available'` returning nothing | Not named as such, but structurally satisfied by design (see reasoning) | **Exempt from the pull-loop/heartbeat machinery; recommend one added deposit line.** Reasoning: the arbiter is spawned fresh, pushed directly by the finisher/nQ router on a red test (`arbiter.md:3`, "You are a FRESH agent spawned only when a test fails") — it never pulls from the field and never goes idle mid-task, so `work-claimed`/heartbeat/TTL-evaporation have no referent. Its one ruling *is* a done-condition met (`arbiter.md:30-32`, "Done looks like... `.done` written"), so the two-stopping-states rule is already satisfied by construction, not violated. The one real gap: the ruling is recorded to `.done`/board per the rules file but not deposited as a pheromone, so a peer orchestrator polling the field alone (not the board) would miss it. Recommended addition (to the file's owner, not applied here), inserted after line 24 ("Every ruling is recorded..."): `- Deposit the ruling as \`work-done\` (ref the triage request) so the field carries it, not only the board.` |
| `~/cursor-shim/profiles/test-maker.md` (40 lines) | No — full file read, lines 1-40; same grep evidence | No | **Gap — recommend closing it, same case as coder.** Reasoning: test-maker holds its own worktree for the life of the unit (`test-maker.md:16-18`, "When launched via `cursor-fleet make` you run in your **own git worktree**") and runs in parallel with the coder for a comparable duration — this is the coder's case, not the arbiter's. The brief's own contrast ("a short-lived inner-loop referee is not obviously the same case as a coder that holds a worktree for an hour") argues for closing this one. Recommended addition (verbatim block to insert after line 22, before "## Hard rules"): the full `## Stigmergic coordination (COMMS-ARCH plane 5 — ranks 1-4)` section as it now reads in `~/agent-core/primitives/profiles/coder.md:15-36` (the same block the sibling AGNT has just copied verbatim into shim `coder.md`, see T2). |
| `~/cursor-shim/profiles/tester.md` (28 lines) | No — full file read, lines 1-28; same grep evidence | No | **Gap — recommend closing it, same case as coder.** Reasoning: tester is "the FIRST agent allowed to see both the code and the tests" (`tester.md:3-4`) and owns the run-and-report step of the inner loop; it is not a single-shot triage call, it executes a real suite and can be blocked/waiting on a red result it must hand to the arbiter. Recommended addition, inserted after line 17 ("A human box is NEVER auto-ticked."), before "## What you record": the same `## Stigmergic coordination` block, verbatim, as above. |

All three are recommendations to the operator, stated as such — I own none of
`~/cursor-shim/profiles/`, so no edit was made to these files.

## T2 — sweep for shadowed or harness-divergent doctrine

### Profile comparison

| shim file | agent-core counterpart | what diverges | verdict |
|---|---|---|---|
| `~/cursor-shim/profiles/coder.md` (was 39 lines; now longer) | `~/agent-core/primitives/profiles/coder.md` (39 lines) | Was: shim version carried an isolation-wall override (a legitimate addition — coder must not write/run/judge its own tests) but **silently dropped** the resource-claim bullet and the entire `## Stigmergic coordination` section present in the agent-core file (confirmed by the pre-verified `grep -rn 'spine-claim\|spine-report\|spine-spawn'` and `grep -rn 'Stigmergic\|pheromone\|work-available'` over `~/cursor-shim/profiles/`, both returning nothing, at brief-issue time). **As of this read**, the sibling AGNT owning this file has already added, verbatim, the spine-claim/spine-report bullet and the full Stigmergic section (see the file's own new header note, lines 11-15: "This file also inherits, verbatim, the spine-resource-claim bullet and the full `## Stigmergic coordination` section... keep it in sync by hand until PLAN Phase 5 replaces whole-file precedence with composition."). | **Shadowing defect — fix landed in flight by the sibling AGNT, not by me.** I did not touch this file. |
| `~/cursor-shim/profiles/arbiter.md` | none | N/A (no name match) | see T1 |
| `~/cursor-shim/profiles/test-maker.md` | none | N/A | see T1 |
| `~/cursor-shim/profiles/tester.md` | none | N/A | see T1 |

**Headline: 1 of 4 shim profiles shadows an agent-core counterpart by name**
(`coder.md`); it diverged **in law**, not merely in role, at brief-issue time
(missing the spine-claim bullet and the entire Stigmergic section), and that
divergence has since been closed by a sibling AGNT's in-flight edit to the
same file — not by this sweep.

### Other shim files: rules/, agents/, docs/, levers/, briefs/, README.md, bolt-on

| shim file | agent-core counterpart | what diverges | verdict |
|---|---|---|---|
| `~/cursor-shim/rules/cursor-fleet.md` (166 lines) | no single-file counterpart; composes `control-flow.md`, `COMMS-ARCH.md`, `RESPONSIBLE-PARTY-AND-NQ.md` by reference (`:9-14`) | Carries the stigmergic field law in full — pull loop, heartbeat, two stopping states (`:164-178`, confirmed present, matching the pre-verified fact). Also states at `:14`, "Read the authority before you act; when this file disagrees with it, it wins" — an explicit non-shadowing posture, the opposite of silent override. | **Legitimate addition.** This file is the intended per-harness delta (same role as `directives/cursor.md` but repo-local); it defers to core law by its own text rather than restating it divergently. |
| `~/cursor-shim/agents/` | — | Directory is empty (confirmed `ls -la`) | **Excluded — not doctrine.** No file, nothing to shadow. |
| `~/cursor-shim/docs/QA-lever-integration-2026-08-11.md`, `docs/inner-loop-verify.md` | — | `grep -n 'spine-claim\|spine-spawn\|spine-report\|Stigmergic\|pheromone'` over both returns **nothing** | **Harmless.** Design/verify notes about the shim's own Verify beat, not restatements of core law. |
| `~/cursor-shim/docs/qa-verify.sh`, `docs/worktree-lifecycle-verify.sh` | — | Executable proof scripts, not prose doctrine | **Excluded — not doctrine** (evidence: they are shell scripts that run assertions, not law statements; the operative claims they check are already covered by the two docs above). |
| `~/cursor-shim/briefs/the-door/*.md` (5 files: `MAKE-a5-batch-record.md`, `REWORK-coder-a3-case.md`, `ORCH-a3-freshness-gate.md`, `ORCH-a5-batch-record.md`, `MAKE-a3-freshness-gate.md`) | — | Task-specific work briefs for past shim-internal units, not doctrine statements | **Excluded — not doctrine**, same category as the state dirs below: they are records of what was asked for a specific unit, not law that binds future units. |
| `~/cursor-shim/README.md:20` | `primitives/directives/cursor.md:10-11` | "**Calls only** herdr's public commands... never `spine-spawn`." | **Judged explicitly below.** |
| `~/cursor-shim/levers/lever-7-fanout.md:6,11` | — | ":6 — 'Add a `cursor-fleet fanout` verb mirroring spine-spawn's fan-out'; :11 — 'spine-spawn's grid contract (`~/herdr-spine/bin/spine-spawn`, `grid_panes`)'" cites `spine-spawn` as the **design pattern to mirror**, not a thing the shim calls. | **Judged explicitly below.** |
| `~/cursor-shim/cursor-fleet:5` (found while checking the spine-spawn claim, not in the brief's required list — noted for completeness) | — | Comment: "# same panes, same reaping law as spine-spawn — just `cursor-agent` in the panes." | **Harmless** — a code comment restating the same design-mirroring point as the lever, not an executable call and not divergent law. |
| `~/cursor-shim/bolt-on` (44 lines) | `primitives/profiles/PROFILES.md` | Generates one-line tier descriptions (`:40-44`, e.g. "CORD tier — plans and delegates to orchestrators; verifies.") when materializing `.cursor/agents/*.md` from the agent-core profile bodies (`:38`, `body="$(awk ...)"` — reads the profile file itself, not a paraphrase of its law) | **Harmless.** The descriptions are UI labels for the generated file, not a restatement of any rule; the actual profile body is copied from the agent-core source verbatim at generation time, so there is no divergent copy to shadow. |
| State dirs `.instr/`, `.make/`, `.orch/`, `.verify/` | — | Sampled `.instr/agnt-coder-w1j-p0.md` (a full rendered ORCH prompt sent to a past spawn), `.make/ws-f-w1-auth.json` (a JSON spawn record: slug/dir/brief/pane ids), `.verify/*/.authored` (a JSON stamp: brief path + key + timestamp) | **Excluded — not doctrine, confirmed by sampling one file per dir.** These are point-in-time records of what was already sent or claimed (a rendered composite prompt, or spawn/verify bookkeeping), not a source of law an agent would consult going forward — the brief's own framing as "spawn records" holds. |

### README.md:20 vs. lever-7-fanout.md:6,11 — does ORCH-1's change falsify either?

**No — they say two different things about `spine-spawn` and neither becomes
false.**

- `README.md:20` is a claim about **mechanism**: the shim's own code never
  invokes the `spine-spawn` binary; it calls herdr's public commands
  directly. `lever-7-fanout.md:6,11` is a claim about **design lineage**:
  the shim's `fanout` verb copies `spine-spawn`'s grid-panes contract
  (down-then-right, cap 4) as a pattern to imitate, not a program to shell
  out to.
- ORCH-1's unit (`spine-routes-cursor`) changes what `~/herdr-spine/bin/spine-spawn`
  itself does — reportedly making it route `--kind cursor`. That is a change
  to the callee's capability, not to whether `cursor-shim` calls it. Nothing
  in the shim's own executables (`cursor-spine`, `cursor-fleet`, `cursor-finish`)
  invokes `spine-spawn`. **[ORCH-2 correction, verified at integration]** this
  document originally claimed `grep -n "spine-spawn"` over all three returns
  nothing; it does not. `grep -c`: `cursor-spine` 0, `cursor-finish` 0,
  **`cursor-fleet` 1** — the single hit is the comment at `cursor-fleet:5`
  ("same panes, same reaping law as spine-spawn"), already classified
  *harmless* in the table above. No shim executable *calls* the binary, so the
  verdict stands; the evidence as first stated did not.
- So: README:20 remains true regardless of ORCH-1's change (the shim still
  never calls it), and lever-7's design-mirroring citations remain true
  regardless too (mirroring a contract is unaffected by that contract
  gaining a new caller elsewhere). The two statements are consistent with
  each other and with `directives/cursor.md`'s post-fix text (T4) — none of
  the three contradicts either of the others.

## T3 — what this unit deliberately did NOT change

**The original instruction:** the brief that opened this project
(`~/agent-core/briefs/harness-homogeneity/CORD-harness-homogeneity.md:78-80`)
stated: "The concierge dispatched briefs earlier today instructing workers to
use `spine-claim` for resource ownership. On cursor that instruction is dead
on arrival. Treat any brief in `~/agent-core/briefs/` that names `spine-claim`
as suspect for cursor workers until this unit lands" — and a sweep of every
such brief was implied.

**Why it was not carried out:** the project's CORD ruled this premise wrong,
on the evidence in this brief's "The premise, corrected" section:
`spine-claim:157` reads `$HERDR_PANE_ID`, and `spine-claim:213` calls `herdr
pane report-metadata "$pane_id" ...` — both verified by direct read of
`~/herdr-spine/bin/spine-claim`. herdr injects `HERDR_PANE_ID` into every pane
it owns regardless of which engine (pi, claude, cursor-agent) is seated in it.
The instruction **works on a cursor pane today, unmodified**. The defect is
not that `spine-claim` is dead on cursor — it is that nothing on the cursor
side ever *issues* it (the doctrine-gap this sweep documents in T1/T2, not a
capability gap in `spine-claim` itself).

**The evidence for where this correction and the brief-authoring rule live:**
- `spine-claim:157,213` — cited above, verified this session.
- `~/agent-core/primitives/skills/brief/SKILL.md:64-81` — the brief-authoring
  rule instructing authors to have workers `spine-claim`/`spine-report`/emit
  to the stigmergic field; verified present at these exact lines this
  session (re-checked with `cat -n | sed -n`, matches the pre-verified fact
  with no correction needed).
- `~/agent-core/primitives/skills/brief/SKILL.md:149-163` — "Step 4 — Profile
  choice (never provider/model/`--kind` in briefs)"; verified present at
  these exact lines this session, no correction needed.

**What was deliberately left untouched, and why:** the historical briefs
across `~/agent-core/briefs/` that name `spine-claim` were **not edited,
audited, or flagged**, deliberately, as the project record. Per
`shape.md:49-50` (cited in this brief's constraints as governing correction
posture): a correction stands **beside** what it corrected, it does not erase
it. Rewriting or annotating ~50 historical briefs would erase the fact that
the instruction was given under the original (wrong) premise; the correction
belongs in this document and in the CORD's ruling, not retroactively stamped
onto every brief that used the phrase.

**A Pre-Verified Fact that turned out wrong:** the brief states "the ~35
historical briefs naming `spine-claim`." Recount this session:
`grep -rl "spine-claim" ~/agent-core/briefs/` returns **61 files** total;
excluding the current `harness-homogeneity/` project directory itself (which
contains 6 of those 61, all current-project documents discussing the topic,
not historical instructions issued under the wrong premise), the count of
briefs **outside** this project naming `spine-claim` is **50**, not ~35. This
does not change the ruling (still: left untouched, deliberately) — it only
corrects the count for whoever reads this next.

## T4 — cursor directive gate

See the "Report back with" section below; this section is filled in only
after the gate is checked, per the brief's ordering (T1-T3 first).
