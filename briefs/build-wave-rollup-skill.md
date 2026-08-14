# UNIT — Build the daily wave rollup (skill + agent), and the carry-forward ledger

**Operator directive, 2026-08-13.** The concierge hand-wrote a wave briefing today. The
operator's verdict: *"this is perfect but can be better… this does not scale. We need some
kind of skill or a dedicated agent to produce this rollup. This is a bottleneck."* Standard
he set: **10X DX, 10X UX, 10X AX.** And: *"this is going to be the norm. Every day, launch a
wave of work to be facilitated and managed by me the developer and you the concierge."*

Read the hand-written exemplar in the session record before building anything: it is the
quality floor, not the ceiling. It was called "great but weak."

---

## What this produces

**One artifact per wave**, generated not authored: a rollup the operator can read cold,
after a day of client meetings, with **zero contextual awareness**, and come away owning
every commit. He is legally and professionally responsible for all of it.

His framing of the required intelligence: **"phoropter level — high level with the ability
to adjust lens depth."** Wide first, then click deeper on any single axis without losing the
frame. Two output targets:

1. **Terminal/markdown** — the default, fast, readable in a pane.
2. **An atelier-style single-file HTML document** — he named this explicitly ("this might
   also be nice as an atelier style html document"). Use the existing `atelier` skill; do
   not invent a presentation layer.

## The five questions every entry must answer

Derived from his own words — *"what was it? what changed? what was it solving? what was the
original intent and purpose?"* — plus the two he added:

1. **Original intent** — what the work set out to do, in product terms.
2. **What changed** — the actual diff, named concretely (tables, files, endpoints).
3. **What it solves** — the real-world problem, ideally traced to its discovery source
   (a `STG-` item, a transcript, a named person's request).
4. **Where it sits** — placement in the component-level abstractions. This is the one that
   made the hand-written version land: which layer, what it connects to, which seam it
   closes.
5. **Trajectory** — what it means for what comes next.

## CTRL-level data — mandatory, he asked for it by name

*"in addition to '53 commits, 7 migrations' I want to see CTRL level data as well. Files
touched. LOC differentials."*

Per wave and per stream: commits, files changed, insertions/deletions, **churn by area**
(`apps/api`, `apps/web`, `packages/*`, `docs`), migrations by number with a one-line
description of each, and a **top-N files by churn** table. Computed from git, never
estimated. Reference numbers from today's wave, for calibration: 164 files,
+15,021 / −923; `apps/api` 64, `apps/web` 53, `docs` 17, `packages/db` 15.

## VERIFY-PHASE VISIBILITY — a named defect to fix

*"I need stronger and more visibility into the verify phase of the inner loop."*

Today's rollup hid it completely, and the irony is that **six of the ten highest-churn
files in the wave were integration tests** (`inventory-walk.integration.test.ts`,
`contracts-sign-identity.integration.test.ts`, `menu-plan-snapshot-coherence.test.ts`,
`ws-b-pr5-merge-tags.integration.test.ts`, …). The verify work WAS the bulk of the wave and
was rendered invisible.

The rollup must surface, per unit of work: which suites were authored and by whom (test-maker
versus implementer — they must be different agents), what actually ran, what passed, what a
human still has to check, and any arbiter rulings with their verdict. **Never report a green
that was claimed rather than reproduced** — this project has already lost a day to a
gate-green deliverable that never landed. Where evidence is absent, say so explicitly; an
honest gap beats a confident green.

## THE CARRY-FORWARD LEDGER — the second half of this unit

*"often we won't be able to zero-shot a solution and it will have to be completed in waves
of work… we need some way to say, here is what was done AND this is a key piece of relevant
information for the next scope of work… 'Oh yeah, our future selves already added a
mutateAndEnqueue, we just need to know how to wire it up.' Essentially nipping any
double-work issues before they have a chance to materialize."* He explicitly does not know
what shape this should take and is open to ADR/STG metadata or something new.

**Concierge proposal to implement unless you find better: not a new tracking system — a
standing, accumulating section of the rollup called "already built, not wired."** Four
fields per entry: **what exists · where it is (`file:line`) · what it is missing · what
would wire it.** Append-only across waves; an entry retires when something consumes it.
Made Well's ground step reads it before planning, so it becomes an *input* rather than a
record. Waves may span a day or months — the ledger is what survives the gap.

Seed it with the three entries today already produced:

| What exists | Where | Missing | To wire |
| --- | --- | --- | --- |
| Galley write arrow — `mutateAndEnqueue` + allowlist | `apps/api/src/lib/galley/` (#268) | any caller; no UI | a caller, not a build |
| `approveMenuPlanEvent` allowlisted, deliberately unwired | Galley allowlist (#270) | the reconciliation gate is built and shut | operator ruling on approve semantics, then wire |
| Inventory walk auth | `0064_inventory_walk_sessions.sql` | the append-only `inventory_counts` ledger does not exist | counts table; capture currently authenticates then has nowhere to write |

Validate each against the repo before publishing — they are the concierge's reading, not
verified fact.

## NO FLEET-INTERNAL VOCABULARY IN OPERATOR OUTPUT

*"'WS-D — Galley data plane' — where are these artifacts generated? what do they mean? I
have no idea but truthfully I don't care. It's more noise than anything else."*

Stream codes (`WS-B`, `WS-D`, `ws-e-w2`), pane ids, workspace ids, brief filenames, board
topics, and PR numbers as primary carriers are all **noise**. Name work by what it is:
"Galley data plane," "portal client auth," "multi-location inventory." PR numbers may appear
as trailing anchors only. This is the same law as the CTRL pane's row format — human work
name, never an opaque id.

## Build shape

- A **skill** is the primary deliverable so any harness can run it; add a dedicated agent
  only if the skill genuinely cannot carry it. Follow the existing skill conventions in
  `~/agent-core/primitives/skills/`.
- **Generate from evidence, never from narrative.** Git is the source for churn, migrations,
  and file lists. The board and the field are the source for verify evidence and rulings.
  Discovery (`~/Infinity/discovery/STAGING.md`, `STG-` items) is the source for "what it
  solves." An assertion with no source is a defect.
- Must run **cheaply and repeatedly** — this fires every day. The operator is a solo
  developer and spend is his binding constraint: prefer mechanical extraction over spawning
  agents, and a read over a sweep.
- Idempotent and re-runnable mid-wave, not only at close.

## Deliberately NOT in this unit

The inner/outer loop rollup-timing question — whether Land can roll up before the inner
queue drains, and whether a project's outer stage should be a scalar or a rollup of its
cycle states — is a **methodology decision the operator owns**. Do not decide it here.
Design the rollup so it can present either shape once he rules.

## Contract

Branch first; small PRs; explicit staging. Every unit of work is a visible pane. Post to
board topic `agent-core/wave-rollup`, and use the field (emit `work-available` with
evidence, claim with `ref`, heartbeat, `work-done`). **Dogfood it:** generate the rollup for
today's Arc wave as the acceptance test, and if it is weaker than the hand-written version
in the session record, it is not done.

SOURCES: operator message 2026-08-13 (quoted verbatim above); `git diff --shortstat`/
`--numstat` on Arc `c203706..origin/main`; migrations `0058`–`0064`; today's hand-written
briefing; `atelier` skill; `~/agent-core/primitives/skills/` conventions.
