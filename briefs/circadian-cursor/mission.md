# CORD cursor-shim — circadian wake for herdr-spawned cursor agents

> From: CONCIERGE (operator intake 2026-08-12 ~21:26 UTC). Binding. Self-contained.
> Board topic: `cursor-shim/circadian-wake`. `.done`: `~/agent-core/briefs/circadian-cursor/.done/`.

## 1. Operator directive (verbatim, the authority)

"i need to make sure circadian is wired in for cursor agent usage. so when i start a new cursor instance in herdr fresh, it gets circadian. i had previously seen in pi and claude, but it didnt seem to be getting added when using cursor."

## 2. Pre-verified facts (CONCIERGE, this session, 2026-08-12 ~21:28 UTC)

- `~/.cursor/hooks.json` HAS a `sessionStart` hook registered: `bash ~/agent-core/primitives/hooks/session-boundary-cursor.sh` (timeout 15). That script injects Session Boundary Contract legs 1–4; leg 4 = circadian wake via `~/circadian/src/wake.ts` (bun). Kill-switch mode (R7) is NORMAL upstream behavior: wake emits constitution + NOW only, not the full substrate.
- The hook header claims the sessionStart `additional_context` schema was "confirmed by local repro test 2026-08-12" — but the operator's lived experience is that herdr-spawned cursor agents do NOT get circadian. Trust the operator's observation; treat the repro claim as suspect until reproduced.
- **UNKNOWN (the crux):** whether the `cursor-agent` CLI (as spawned by cursor-spine in herdr panes) honors `~/.cursor/hooks.json` `sessionStart` at all — hooks may be IDE-only, version-gated, or flag-gated. Establish with evidence FIRST.
- pi path (working): `~/.pi/agent/extensions/circadian-mind.ts` + `session-boundary.ts`. claude path (working): `~/.claude/settings.json` circadian wiring.
- Fleet wake doctrine (canonical `~/agent-core/primitives/AGENTS.md`): "Circadian still injects memory for fleet panes, but greeting-instruction is omitted when `role` is `1-CORD|2-ORCH|3-AGNT|4-SAGT` (or `CIRCADIAN_SKIP_GREETING=1`)." For pi/claude fleets this injection happens in the SPAWN path (`~/herdr-spine/bin/spine-spawn` + `spine-greeting`) — study exactly how; that is the reference implementation.
- cursor-spine (`~/cursor-shim/cursor-spine`) builds an instruction file (`.instr/<name>.md`) and launches `cursor-agent` with "Read the file … now". Suspected gap: the shim's instr-file build never weaves circadian wake. Verify, don't assume.
- Repo: `~/cursor-shim` (git, main @ 6c85350). Suite: `bash docs/qa-verify.sh` (90/90 — MUST stay green; suite must never spawn real panes — cf. 78fa55c/6c85350). Worktree wall is repo-conditional (508b3ba) — this repo qualifies, full bifurcation applies.

## 3. Mission

1. **Diagnose with evidence:** does `cursor-agent` in a herdr pane fire `sessionStart` hooks from `~/.cursor/hooks.json`? (Live spawn probe in a scratch workspace; check for the hook's output/side effects. If it fires but output is lost, say so precisely.)
2. **Wire it, whichever way the evidence points:**
   - If hooks fire → fix why the wake doesn't reach the agent (env, cwd, schema, timeout).
   - If hooks DON'T fire for CLI spawns → port the spine-spawn wake injection into cursor-spine's instr-file build (wake output woven at spawn time), honoring the role-based greeting omission rule verbatim.
3. **Prove it:** spawn a fresh cursor agent in herdr via the shim; its initial context contains the circadian wake content (constitution + NOW per kill-switch mode). Evidence = the spawned pane's actual received context, captured.
4. Role-matrix proof: a fleet-role spawn (e.g. coder) gets memory atoms WITHOUT greeting-instruction; a non-role spawn gets the full wake.

## 4. Constraints

- Verify beat (make bifurcation) for implementation. Commits per convention; CORD gates.
- Do not weaken the kill-switch mode of wake (R7) — constitution + NOW is the intended payload.
- Do not touch `~/.cursor/hooks.json` semantics for the IDE path unless the evidence says it's broken there too — the IDE path is believed working.
- Topology: this workspace's workers in a dedicated tab; reap at collection.
- Comms: findings to `cursor-shim/circadian-wake`; operator mail only the final deliverable or a genuine fork.

## 5. Done-when

- Evidence-backed answer to "does cursor-agent honor sessionStart hooks" posted to the board.
- Fresh shim-spawned cursor agent verifiably receives circadian wake (live capture), role-matrix honored.
- qa-verify 90/90+ green (new cases for the wake wiring, dry-run level only); committed.
- `.done` markers; panes reaped; `to:"operator"` deliverable with what changed and how to see it.
