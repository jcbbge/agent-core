# CORD [muster-full-cutover]

Retire tup and herdr-spine completely. Muster is the only durable+spawn control plane. Do NOT use emojis. You never implement. Spawn ORCHs. nQ to operator = 0.

**Operator order (2026-08-19):** A + B + C in full. After Land, operator deletes `~/tup` and `~/herdr-spine`. Those repos are out of service — no leave-behinds, no temporary alias back to tup, no docs that teach them as live.

**Superior:** cursor-concierge. **Done signal:** `~/muster/bin/muster-deposit deposit --from cord-muster-full-cutover --to cursor-concierge --kind done --body` with SHAs, proof commands+exits, every file touched, deviations; plus `~/agent-core/briefs/muster-full-cutover/CORD-muster-full-cutover.done`; ORCHs reaped.

## Pre-Verified Facts (concierge verified this session)

- Desk injection path: `herdr cursor` → `~/bin/herdr` → `SPINE_SPAWN` default `~/herdr-spine/bin/spine-spawn` (stub) → `~/tup/socket/spawn.py` → `compose_directive_block` → `~/agent-core/primitives/agent-bridge/compose-directive` prepends Tup/herdr-spine Agent bridge, then `profiles/concierge.md`, then harness start with cursor `--force --trust --model …` + `verified_prompt`.
- Reproduced: `compose-directive concierge cursor '' cursor-concierge ''` emits the Tup deposit + `~/herdr-spine/bin/spine-report` block byte-matching the live desk open.
- `profile-model get concierge` → `cursor/grok-4.5:high` (maps to `cursor-grok-4.5-high`).
- Always-on `~/AGENTS.md` already teaches muster (composed from `primitives/AGENTS.md` + `directives/cursor.md`); spawn-time bridge still teaches tup — split-brain.
- Muster has deposit door: `~/muster/bin/muster-deposit` (kinds done|need-help|report|question). **No** `muster-spawn` / `runtime/spawn.lisp` on disk yet.
- `~/muster/docs/PORT-PROGRAM.md` already scopes: spawn → `~/muster/runtime/spawn.lisp` + `~/muster/bin/muster-spawn`; spine-report keep herdr-native; herdr-spine absorb.
- Registry still has `skill/tup` with **source missing** (`agent-core status --harness cursor`).
- Stale tup skills remain at `~/.pi/agent/skills/tup`, `~/.config/opencode/skills/tup`. Cursor has muster skill, no tup skill.
- Isolation env in muster Lisp/docs still named `TUP_FIELD_DIR` / `TUP_STORE_DIR` / `TUP_EVENTS_PATH` (e.g. `field/field.lisp`).
- herdr-spine plugin registered in `~/.config/herdr/plugins.json`; `config.toml` still calls spine-greeting / spine-inbox.
- Spawn-door hook deny text still points at `~/bin/spine-spawn` + `~/herdr-spine/docs/spawn.md`.

## Operator rulings (do not re-ask)

1. **Spawn home:** Lift today’s proven spawn body into **muster** as `~/muster/bin/muster-spawn` (Python OK for this Land so tup/herdr-spine can be deleted). Lisp `runtime/spawn.lisp` may follow later — not a blocker for repo deletion after this Land proves the Python door in muster.
2. **Wrappers:** `~/bin/herdr` desk seating and `~/bin/spine-spawn` must exec **muster-spawn**, never tup/herdr-spine. `spine-spawn` may remain as a compatibility name that only forwards to muster-spawn.
3. **compose-directive + profiles + skills:** muster verbs only (`muster-deposit`, muster skill, herdr for panes). Zero tup paths, zero herdr-spine paths, zero `field.py`, zero `spine-report` under herdr-spine.
4. **Sidebar report:** if still needed, relocate under muster (`~/muster/bin/…`) or drop from doctrine; must not require `~/herdr-spine`.
5. **Plugin:** uninstall/disable herdr-spine from herdr plugins; remove spine-managed fragments that invoke herdr-spine bins.
6. **Isolation env:** prefer `MUSTER_FIELD_DIR` / `MUSTER_STORE_DIR` / `MUSTER_EVENTS_PATH`; temporary read of old `TUP_*` only if needed for one release; docs and new code use MUSTER_*.
7. **Registry:** remove `skill/tup`; ensure `skill/muster` deploys; delete stale harness tup skill copies; `agent-core sync` regenerates entrypoints.
8. **Commits:** CORD Lands and pushes agent-core + muster remotes after verify. Workers commit only if an ORCH brief explicitly orders it.
9. **Do not delete** `~/tup` or `~/herdr-spine` yourself — operator deletes after Land proof.

## Parallel Work Notice

Single load-bearing thread. No parallel product work in Arc. Ignore unrelated uncommitted noise outside the file partitions below.

## Fleet comms (muster skill)

- Mail: `~/muster/bin/muster-deposit deposit --from <role> --to <parent> --kind done|need-help|report|question --body "<…>"`
- Inbox/collect: per muster skill / docs (do not invent tup CLIs).
- Pull loop ranks 1–4: pending before idle; collect what you take; `done`/`need-help` with evidence; empty inbox is not a stop; `report` is not `done`.
- nQ to operator = 0. Escalate to CORD only.
- Do not call tup, field.py, bellman, or any path under herdr-spine.

## File partitions (ORCH units — disjoint)

### ORCH-A — Prompt + doctrine cutover (agent-core)
Owns: `primitives/agent-bridge/compose-directive`, `primitives/profiles/{concierge,coordinator,orchestrator}.md`, `primitives/skills/{concierge,herdr,brief,muster,ending-session,coordinator,orchestrator}/SKILL.md`, `primitives/directives/*.md` residuals, `primitives/AGENTS.md` residual wording → muster-spawn, `primitives/rules/ENFORCEMENT.md` + `hooks/spawn-door.sh` deny text paths, cursor delta `TUP_*` → `MUSTER_*`. Sync via `agent-core sync`. Done when: live teachings of herdr-spine / tup / field.py / tup-skill / herdr-spine spine-report are gone from primitives; compose-directive names muster-deposit + muster-spawn only; `agent-core sync` exit 0; deployed `~/AGENTS.md` and cursor skills match.

### ORCH-B — Spawn door absorption (muster) + wrappers
Owns: lift `~/tup/socket/spawn.py` into muster behind `~/muster/bin/muster-spawn` (orch|worker|fanout|prompt|desk|reap|verify-* as needed for desk+fleet); point `~/bin/spine-spawn` and `~/bin/herdr` `SPINE_SPAWN` at muster-spawn; remove herdr-spine stub dependency; update muster skill + `docs/agent-spawn-sop.md` + `DRIVING.md` + `AGENTS.md` spawn lines; isolate tests via scratch dirs under MUSTER_* (TUP_* compat read OK briefly). Done when: desk seating opens no file under `~/tup` or `~/herdr-spine` (prove via wrapper heads + path audit); muster-spawn desk help works; compose path shows muster-only bridge text.

### ORCH-C — Plugin uninstall + registry + residual sweep
Owns: `~/.config/herdr/plugins.json` herdr-spine entry; spine fragments in `config.toml`; registry `skill/tup` removal; delete `~/.pi/agent/skills/tup` and `~/.config/opencode/skills/tup`; machine grep for remaining live refs in agent-core, muster, `~/bin`, `~/.cursor`, `~/.config/herdr` (exclude archives/backups/historical briefs). Done when: plugins list has no herdr-spine; `agent-core status` has no skill/tup; final rg report in done body lists only excused historical paths if any.

## Tasks (CORD)

1. Spawn ORCH-A, ORCH-B, ORCH-C with self-contained briefs (zero-context). Sequence: B door binary early enough that A’s synced paths resolve; C last after A+B green.
2. Verify each ORCH done-when with commands you run yourself. Never trust worker word alone.
3. Land: evidence on disk + muster done deposit + `.done` marker. Push agent-core and muster when green.
4. Final proof for concierge: document exact post-Land `herdr cursor` chain (wrapper → muster-spawn → compose-directive muster text) and a one-line certificate that it is safe for the operator to delete `~/tup` and `~/herdr-spine`.

## Stopping states

Every done-when met with evidence, or need-help naming owner after finishing independent work.
