# CORD herdr-spine — spawn-doctrine correction + Verify beat for pi/claude fleets

> From: CONCIERGE (operator directives 2026-08-12 ~18:20 UTC). Binding. Self-contained.
> Board topics: `herdr-spine/verify-beat-port` (U2), `herdr-spine/topology-doctrine` (U1 correction note). `.done`: `~/agent-core/briefs/verify-beat-port/.done/`.

## 1. Operator law (verbatim emphasis is the operator's; these bind)

- **"IM AGNOSTIC BY DESIGN"** — the entire stack is provider/model/harness/platform/vendor-agnostic. Nothing in any repo may codify a harness preference.
- Harness selection is an **operator intake decision per mission/session, cost-determined** (operator's words: pi for personal projects, claude-code for client projects, cursor currently for subscription subsidization, possibly an API gateway like openrouter later — "effectively this is a cost determined situation").
- **Fleets are harness-homogeneous:** the root spawn's harness defines every downstream agent. pi root → pi fleet. claude-code root → claude fleet. cursor root → cursor fleet.
- **The Verify beat is a Made Well feature and must be applied across the board** — every harness, not cursor-only.

## 2. U1 — Correct the spawn doctrine (docs, small, do first)

`~/herdr-spine` commit `63e1010` ("fleet spawn-path doctrine — cursor-shim is the spawn path") codified a per-session resource decision as universal law. WRONG. Amend `docs/spawn.md` (and `docs/ctl-fleet.md` if it repeats it):

- Strike any "cursor-shim is THE fleet spawn path" framing.
- The law: fleets are harness-homogeneous (root spawn's harness defines the fleet); per-harness spawn paths are `spine-spawn --kind pi|claude` and `cursor-fleet`/`cursor-spine` for cursor; harness choice is the operator's per-mission intake call driven by cost; pi's sole distinction is open-source + inference-gateway capable.
- The 2026-08-12 topology doctrine (Engine Shop, task workspaces) stands untouched — this corrects the spawn-path framing only.
- Post the correction note to `herdr-spine/topology-doctrine` (the earlier collection note there repeated the wrong framing).

## 3. U2 — Port the Verify beat to spine-spawn (pi + claude kinds)

Today the enforced Plan→Implementation wall lives only in `~/cursor-shim/cursor-spine` (coder spawn REFUSED without a forked test path; bifurcated worktrees; tester/arbiter; nQ≤3 — see `~/cursor-shim/rules/cursor-fleet.md` and `docs/inner-loop-verify.md`). pi and claude fleets have profile discipline only — no enforcement. Port it:

- Study `~/cursor-shim/cursor-spine` (the wall's implementation) and `~/herdr-spine/bin/spine-spawn` (the pi/claude path).
- Design the harness-agnostic wall first — post the design to `herdr-spine/verify-beat-port` before implementing (one board post, then proceed unless CONCIERGE says hold). The bifurcation mechanics (separate worktrees from the same plan, verify-mark gate, break-glass audit) are harness-agnostic; the agent-launch specifics are not.
- Implement in `~/herdr-spine/bin/spine-spawn` (+ new sibling files as needed) so `spine-spawn … --kind pi` and `--kind claude` enforce the same beat: no forked test path → implementation spawn refused; break-glass loud + audited to Tower.
- This mission's own implementation workers go through `cursor-fleet make` (cursor-kind, per current operator harness choice) — the wall testing its own port is encouraged.

## 4. Partitions (parallel missions live — disjointness is law)

YOU OWN: `~/herdr-spine/bin/spine-spawn` + new sibling spawn-path files + `docs/spawn.md` + `docs/ctl-fleet.md` (U1 only).
DO NOT TOUCH: `bin/handlers/` (tower-stigmergy mission) · `bin/ctl-fleet*` (fleet-tasks mission) · `~/agent-core/cli/`, registry, `primitives/` (cursor-parity mission) · `~/.tower/`.

## 5. Comms + evidence

- Findings to the topics above; provenance blocks (`date -u`; `pwd -P`; `git -C ~/herdr-spine rev-parse HEAD`); commits per convention (CORD gates; workers never commit).
- Epistemics: cite file:line for claims about cursor-spine/spine-spawn behavior. Epistemic honesty on tests: evidence = commands + outputs.
- Operator mail only for genuine external forks. Final: board report + `to:"operator"` deliverable.

## 6. Done-when

- U1: spawn.md (and ctl-fleet.md if needed) amended, committed, correction note on `herdr-spine/topology-doctrine`.
- U2: design posted; spine-spawn enforces the Verify beat for pi AND claude kinds — evidence: (a) an unwalled implementation spawn is REFUSED for each kind; (b) a walled make-style spawn bifurcates for each kind; (c) break-glass audits to Tower. Committed; tests/QA evidence on the board.
- `.done` markers; panes reaped; operator deliverable sent.
