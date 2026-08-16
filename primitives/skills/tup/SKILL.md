---
name: tup
description: >
  The WWWWW+H of Tup — the durable-agent utility library. Its own registry,
  dependency atlas, component dictionary, extension and update protocol.
  Use whenever a task touches tup — findings, the store, events, renders,
  the dogfood, contracts under ~/tup, the lab under ~/tup-lab, board topic
  tup/layer4, spawn-door / supervisor / mirror contracts — or when an agent
  needs to know what tup is, where a piece lives, how to operate it from
  outside, how to extend it, or how to update it. Tup is a utility library
  operated through its seams; no one works "inside" it.
---

# Tup — the encyclopedia

The wired runtime behind `socket/` is discovered by `mirror/` POST, not
named here. This install's composition is `~/agent-core/primitives/AGENTS.md`.

## WHO

**Tup is the durable half of every agent** — identity, coordinates, brief,
claim, budget, memory, verdict, lifecycle position — held outside any
process. Engines (Claude, Grok, Codex, cursor, any) are seated into its
objects for one context and discarded. **Who operates it:** any engine or
human, from outside, through its seams — the CLI-shaped verbs, the field,
the renders. **Who it faces:** only the root (concierge) faces the
operator; only the operator faces the client; one bearing writer per
stream. **No one operates inside tup.** It is a utility library: you call
it, it never hosts you.

## WHAT — the component dictionary

Thirteen packages (law: `~/tup/contracts/shape.md`), each one need:

| Piece | One line | Layer |
|---|---|---|
| `kernel/` | the law: contracts, profiles, org spec, ONE lexicon, evidence hierarchy + phase-aware lens + corroboration rule, capability table | L6 |
| `mirror/` | deployment truth: registry, parity, `tup status`, POST (boot self-test; a blank cell is a NO; every enforcer discoverable) | cross |
| `socket/` | seam to a runtime: 9 verbs (spawn·address·send·read·wait·events·tokens·claim·observe), spawn door (stamp identity, deliver brief, **verify the submit landed**), resident supervisor, drift tripwire | L1–2 |
| `field/` | the mediator: topics w/ coordinates, **traces** (unaddressed) vs **deposits** (addressed, into an object's inbox), claims+heartbeats+decay, typed refusal at the door, one transport contract | L3 |
| `durable/` | the keystone objects: agent · outer-lifecycle (reservoir+bearing) · inner-lifecycle (whiteboard) · project · finding · session/docket; store = cast·mark·edition; single-writer, everything else renders | L4 |
| `gates/` | mechanical refusal: stop lockout, grounding, brief gate, criteria-before-code, sequence gate (suite before docket), helm key, doorbell HOOK, drill deck | L6 |
| `mind/` | memory organ: wake·graze·sleep·consolidate; authors the letter (home = agent object); voice of the journal | L5 |
| `instruments/` | read-only measurement: compaction truth law, blocking wait, mining, SPC weather charts, wake render, fleet views. A surface that can write is not an instrument | L7 |
| `method/` | how work moves: outer loop (discover→commit→build→land), inner loop (imagine→plan→make→verify), verify beat (impl ∥ tests, arbiter), rubric, decision licenses | L5 |
| `mint/` | digestion, two diets: opinion→fences (checkable at plan/write/land), signal→findings+bearings; pack contract; **tailings rule** — every finding ends as fence/law/unit/instrument or is expelled; intake backpressure when clogged | L5 |
| `gateway/` | intent index over collections too big for context (search→prep→bake) | L7 |
| `bridges/` | per-engine adapters, rip-out-able without a trace (delete the dir, core untouched) | L6 |
| `deploy/` | installer, service defs incl. **the pulse** (the one clock), generated harness wiring, uninstall | cross |

Vocabulary of record: `shape.md` §3 (seat · deck · field · trace · deposit ·
spawn door · fascia · mint · touchstone · **kiln** · lockout · POST ·
letter · guild). Design language: camera-lucida
(`~/tup-lab/looking-glass/tokens.json` — day plates / night phosphor;
Whimsy Law: nothing delightful that isn't true).

## WHEN

Invoke this skill when a task touches: finding objects or their renders ·
`~/tup/contracts/*` · `~/tup-lab/*` · events/chain verification · the
dogfood phases · board topic `tup/layer4` · bearings/promotions/dismissals ·
spawn-door / resident supervisor / mirror contracts · or any question of
the form "where does X live in tup / how do I extend tup / what depends on
what."

## WHERE — registry and dependency atlas

```
~/tup/                     the product: contracts + DOGFOOD.md (criteria; run-record index)
~/tup-lab/                 the laboratory (v0 implementations)
  finding-store/           live store, one JSON per object · cli.py (THE single writer)
  phase-0/events.jsonl     hash-chained event log (append-only, sealed to genesis)
  phase-0/wake.py          --verify: exit 0 = chain intact; silences enumerated
  phase-0/staging.py       --write regenerates staging.md (render, NOT truth)
  phase-0/tests/           suite — run ONLY on an isolated replica
  bellman.py               exec wrapper → phase-0/supervisor.py (finding-M v0;
                           holds the runtime events.subscribe)
  briefs/                  spawn briefs (profiles only, never models)
Board: tup/layer4          claims · compares · keys · bearings
```

Dependency order (roadmap): L1 runtime contract → L2 nervous system → L3
field → **L4 durable (keystone)** → L5 organs → L6 harness bridge → L7
tooling. Nothing above L1 knows which runtime is wired; no organ before L4;
the atlas and looking glass rest on L4's project object. Migration posture:
strangler fig, outer loop first (finding → unit → agent).

## WHY

An engine forgets everything at the end of a context window; the work does
not end there. Everything follows from one sentence: **an agent is a
durable object with an engine seated in it.** Corollaries that bind every
caller: state whose only home is a context window is banned · truth is
never derived from exhaust · single writer, many renders · status is not
mail · every law names its enforcer or wears an honest DOCTRINE label ·
the system earns trust by being incapable of silence.

## HOW

**Operate (from outside, always):**
```bash
python3 ~/tup-lab/finding-store/cli.py list|get <id>
python3 ~/tup-lab/finding-store/cli.py mint --id <id> --json <FILE PATH>   # not inline JSON
python3 ~/tup-lab/finding-store/cli.py promote <id> --route "<dest>"
python3 ~/tup-lab/finding-store/cli.py dismiss <id> --reason "<why>"       # reason required
python3 ~/tup-lab/phase-0/staging.py --write     # refresh render (default only prints)
python3 ~/tup-lab/phase-0/wake.py --verify       # exit 0 = chain intact
```
Never hand-edit a render or the store files; never edit `events.jsonl`
(append-only, hash-chained). A finding's idea is durable; its grounding has
a shelf life — re-ground at promotion. Promotion spawns the inner unit;
dismissal needs a reason; the suite runs on a replica BEFORE docket
transitions.

**Extend (four kinds, no fifth):** implementations of instrument/organ
contracts (pass the conformance suite; POST audits) · cartridges/packs
(compile through the mint, enforced by the same lockout — Made Well is the
first pack) · profiles (spec is data; nAgents/nLayers arbitrary) · bridges
(rip-out test). First party has no privilege: the core may depend on a
contract, never on an implementation. Override stack: LAW > DEFAULT >
CARTRIDGE > SPEC — only LAW is immovable.

**Update:** contracts change via an amendments file (proposal → operator
red-pen → land in target, delete entry; corrections stand beside, retired
vocabulary stays labelled). Store state changes only via the CLI, evented.
Renders regenerate; they are never edited. Doc-of-record for phase
outcomes: `DOGFOOD.md` run-record (pointers only — the store and board are
the truth).

**Distribute (posture, decided direction):** tup ships as **one CLI on the
PATH** — verbs over stdin/stdout JSON, exit codes as verdicts — because a
binary on the PATH is the only seam every platform, framework, provider,
model, agent, and harness can call. Rust-native core → single static
binary. Harness hooks are *generated* by `deploy/` and shell out to the
CLI; MCP/SDK surfaces are bridges over the same verbs, never a second API.
**Made Well is not a binary — it is the first pack**, distributed as
content (`tup pack add madewell`); its extraction is a standing conformance
test. The lab's `cli.py` is the CLI's v0 prototype.
