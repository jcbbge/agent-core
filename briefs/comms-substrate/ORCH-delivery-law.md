# ORCH — write the delivery law, against what shipped

You own **Unit 4** of the comms-substrate project: the law that makes the
delivery guarantee a rule of this house rather than a property of one commit.

You are deliberately **not** the ORCH that built the substrate. The house rule
that the party writing acceptance criteria is never the party writing the
implementation applies to law as well: the builder is the worst-placed party to
describe what was built, because they will describe what they intended.

Do NOT use emojis anywhere.

## The one way this unit fails

**By writing the law from `DESIGN.md`.**

`DESIGN.md` is what was *planned*. It was amended four times mid-flight
(§3a, §5a, §6a, and the §3a sharpening) because reality kept contradicting it,
and it may have been amended again after this brief was written. Your done-when
is that the law is consistent with **what actually shipped** — read the code,
the tests, and `PROOF.md`, and where the shipped behavior differs from
`DESIGN.md`, **the shipped behavior is the truth and you say so in the law.**

If you find the law you must write is not the law that was designed, that is a
finding worth posting, not a discrepancy to smooth over.

## Pre-Verified Facts (CORD verified personally, 2026-08-16/17)

- `~/.tower/COMMS-ARCH.md` is a **symlink** to
  `~/agent-core/primitives/mcps/tower/COMMS-ARCH.md`. **Edit the canonical
  path in `agent-core`,** never through the symlink.
- `~/agent-core/primitives/rules/ENFORCEMENT.md` holds the enforcer ledger:
  the standing rule (DOOR / HOOK / DOCTRINE) at lines 14-26, the ledger table
  at lines 30-52, the parity law at 54-64, audited bypasses at 66-71, known
  gaps at 73-89.
- House rules live in `~/agent-core/primitives/rules/`. Existing members
  include `control-flow.md`, `tower-orchestration.md`, `ENFORCEMENT.md`,
  `worktree-lifecycle.md`, `session-lifecycle.md`.
- The enforcement standing rule is verbatim: a new law lands **with its
  enforcer named, or with an explicit DOCTRINE label and a compilation note.
  "Vows are not a status."**
- The parity law (2026-08-14, operator ruling): enforcement lands in ALL
  harnesses in the same unit, **or the ledger row says so**. Canonical gate
  logic in exactly one file per law; harnesses get thin adapters.
- `~/agent-core` remote is `git@github.com:jcbbge/agent-core.git`.
- Project docs for this unit live in `~/agent-core/briefs/comms-substrate/`:
  `DELIVERY-CENSUS.md` (Unit 0 evidence), `DESIGN.md` (Unit 1 drawings, with
  mid-flight amendments), `CONTRACT.md` (the build's pinned interface),
  `PROOF.md` (Unit 3 live evidence), `ORCH-deposit-courier.md` (the build brief).
- The measured defect this law exists to prevent recurring: **99 of 308
  completions (32.1%)** discarded by a drop-on-pace rule, plus fabricated
  completions from `idle` flips, plus a delivery verifier whose verdict was
  **uncorrelated** with reality (four identical FAILs, two delivered, two not).
  All three were found in this unit's own live traffic.

## Tower

Board topic: `agent-core/comms-substrate`.

- `bun ~/.tower/cli.mjs post <claim|finding|note> agent-core/comms-substrate "<body>" --from "<role>"`
- `bun ~/.tower/cli.mjs emit <scent> agent-core/comms-substrate <payload_ref> [--ref id] [--evidence path] [--ttl N]`
  Valid scents are exactly: `work-available`, `work-claimed`, `work-done`,
  `need-help`.
- `bun ~/.tower/cli.mjs field`

You are rank 2. Stigmergic coordination is mandatory. Heartbeat claims.
**nQ budget = 3**, questions climb to CORD (`cord-comms-substrate`) on the
board topic. Rule locally by the rubric — craft, DX, UX, agentic efficiency —
before spending budget.

## Tasks

### Task 1 — read what shipped

Before writing a word of law: read `primitives/mcps/tower/deposit.mjs`,
`lib.mjs`, `cli.mjs`, the courier and its launchd definition, the migrated
handlers, the enforcer hook, their tests, and `PROOF.md`.

- **done when:** you can state, from the code, the exact refusal strings, the
  exact queue states, the addressee schemes actually implemented, the real
  dead-letter reasons, and the enforcer's true coverage — and you have posted
  a finding naming **every** point where shipped behavior differs from
  `DESIGN.md`, or stating plainly that there are none.

### Task 2 — author `primitives/rules/message-delivery.md`

Cover, at minimum: the guarantee; the addressee model **as implemented**,
including what it defers and why; the **two** legal outcomes (delivered, or
dead-lettered with a reason) and the explicit statement that there is no third;
the prohibition on private drop policies; and the invariant that pacing writes
a future time and never a terminal state.

Write it as law — short, binding, checkable. Not a design retrospective.

- **done when:** the file exists, every claim in it is true of the shipped
  code, and it carries a SOURCES line citing what was read to write it.

### Task 3 — register it in ENFORCEMENT.md

Add the ledger row in the existing table format, with the enforcer named
honestly.

- **done when:** the row states DOOR / HOOK / DOCTRINE per what actually
  shipped and its real coverage. **If the DOOR could not be fully closed, the
  row says so** — an overstated enforcer is worse than an honest DOCTRINE
  label, because it stops the compilation queue from ever reaching it. Add any
  residual DOCTRINE to the known-gaps list in priority order. Honor the parity
  law: if coverage is not all harnesses, the row says which.

### Task 4 — update COMMS-ARCH.md

Make its planes reference the guarantee they assume. §Hard invariants already
says *"Delivery is verified at the substrate... A send without evidence is a
non-send"* — it now has a substrate that makes a non-send recoverable rather
than merely detectable. Update §What each existing component becomes for the
handlers that changed.

- **done when:** COMMS-ARCH describes the bus as it now is, with no surviving
  claim that the shipped code contradicts.

### Task 5 — land

- **done when:** commits carry the standard handoff format, are pushed to
  `origin` on green, and the SHAs are posted to the board topic. Workers never
  commit — you do.

## Constraints

- **Do not bypass** `credential-guard`, the grounding hook, the write-gate, or
  the spawn-door. A refusal is information.
- Never put a credential literal in a brief or artifact.
- Do not edit `~/.tower/COMMS-ARCH.md` through the symlink.
- Do not change shipped behavior to match the design. You write law, not code.
  If the code is wrong, post a finding and escalate — do not fix it here.
- Disjoint file partitions across your workers.

## Report back with

- The list of differences between `DESIGN.md` and what shipped, or an explicit
  statement that there are none.
- The enforcer's honest DOOR/HOOK/DOCTRINE label and coverage as registered.
- Any residual DOCTRINE added to the known-gaps queue.
- Every file created or modified.
- Commit SHAs pushed.
- Any Pre-Verified Fact above that turned out wrong, and what you found instead.
