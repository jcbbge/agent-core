# ORCH [onboard opencode's binding surface]

slug: `opencode-onboard` · branch: `wave/opencode-onboard`

Read `CONTRACT.md` in this directory first, then
`~/agent-core/primitives/HARNESS-SHAPE.md` in full — it is the contract you are
mapping opencode onto, and it carries the fourteen-question API-surface interview
that is the core of this task.

## Mission

Opencode is a registered harness with a **file surface only**: skills, subagents,
and a composed directive. It has **no binding surface** — no hooks line in its
profile, and therefore zero lifecycle capabilities. It is the only one of the six
registered harnesses with no memory at wake, no guards, no gates, and no session
capture. On 2026-08-20 an audit of circadian across five harnesses found opencode
had no circadian wiring whatsoever. Onboard its binding surface.

Unlike slate, opencode **is** a known agent kind to the fleet multiplexer, so its
panes are detectable — a genuine advantage.

## Pre-Verified Facts (verified 2026-08-20)

**Config home:** `~/.config/opencode/` contains `AGENTS.md`, `agent/`, `skills/`,
`opencode.jsonc`, `package.json`, `package-lock.json`, `node_modules/`.

**Current registry profile** — `~/.agent-core/registry`:

```
harness opencode
  skills      ~/.config/opencode/skills
  skill_format directory
  agents      ~/.config/opencode/agent
  delta       ~/agent-core/primitives/directives/opencode.md
end
```

Note `agents` is `agent/` (singular) here — verified present on disk, containing
exactly one file: `brainstorm.md`. So the subagent surface is deployed but nearly
empty; determine whether that is intentional or an unfinished deploy.

**Registration history, from the registry header comment:** opencode was DROPPED
2026-08-11 (target tree retired) and **RE-REGISTERED 2026-08-15** by operator
ruling. Separately the global directive carries a struck-through retirement with
a correction dated 2026-08-15 noting opencode is live again as a spawn seat for
fleets. Treat opencode as **live**.

**Already deployed and passing:** `directive/core` → `~/.config/opencode/AGENTS.md`,
`skill/agentcore` → `~/.config/opencode/skills/agentcore/SKILL.md`. Its delta
exists at `primitives/directives/opencode.md`.

**Circadian coverage:** none. A grep for `circadian` across
`~/.config/opencode/` matched only prose in `AGENTS.md` — no wiring. Contrast the
other harnesses' bindings, which are all registered as
`hook/circadian-{wake,sleep,graze,status}` and `hook/circadian-mind-{pi,prime}`.

**Reference adapters to copy from** — these solve the same problem for other
harnesses and are the best guide to what a new one needs:
- `~/agent-core/primitives/hooks/session-boundary-cursor.sh` — a single-config
  harness. Emits legs 1-4 (carry-over, handoff, flight pointer, memory) and wraps
  its output in a JSON envelope, `{"additional_context": "..."}`. Its header
  documents how that contract was confirmed by local repro. **Read this first.**
- `~/agent-core/primitives/hooks/session-boundary-pi.ts` — the code-extension
  shape, for harnesses whose hooks are modules rather than config entries.
- `~/agent-core/primitives/hooks/session-capture-cursor.mjs` — legs 5-6, and its
  header documents the hazard that a harness's per-event payload may differ from
  its documented base fields, so it reads both defensively.

**Multiplexer support:** `opencode` is a supported agent kind for the fleet
multiplexer, so its panes get status detection.

Baseline: `agent-core status` → `359 ok  0 stale  0 missing`.

## Tasks

1. Worktree per CONTRACT.md, sparse-scoped to `primitives`.
2. **Run the fourteen-question interview** from `HARNESS-SHAPE.md`. Answers come
   from opencode's official docs (fetch them), its `--help`, its config schema, or
   local repro. `UNKNOWN` is legal; a guess is not.
3. **The binding surface is the point of this brief.** Determine empirically:
   - Does opencode have a hook / plugin / event mechanism? `opencode.jsonc` is the
     obvious place; also check for a plugin directory, and note that
     `node_modules/` and a `package.json` in the config home suggest a JS plugin
     model. Establish which it is.
   - Map its event names onto the eight capabilities in HARNESS-SHAPE.md Half 2.
   - **Establish the injection contract empirically** for a `wake`-equivalent:
     write a throwaway hook that dumps its stdin to a file, bind it, start a
     session, read what arrived, and determine whether stdout becomes context
     directly or needs an envelope. Delete the throwaway afterward. This is exactly
     how the cursor adapter's contract was established — do not skip it and do not
     assume cursor's envelope applies.
   - If opencode has no hook mechanism at all, that is a legitimate finding. Say so
     and say what it would need.
4. **Report the mapping before writing registry rows.** Table: each capability →
   opencode's event name / mechanism, or `NONE` with the remedy it would need.
   Deposit as a `question` to `concierge`; continue with file-surface work while
   awaiting confirmation. Do not block.
5. **Prioritize `wake` above all other capabilities.** It is the one that makes the
   memory substrate work and the one whose absence caused the outage this wave
   exists to fix. If you get exactly one binding live, make it that one, ordered
   legs 1-3 then leg 4 per the ordering law in HARNESS-SHAPE.md.
6. Write the adapter if one is needed. Follow the layer doctrine the reference
   adapters state in their own headers: **data only, never instructions, silent
   when there is nothing to say, always exit 0** so a failure can never block
   session creation. Put it in `primitives/hooks/` following the existing naming.
7. Correct the profile: add `hooks` / `hooks_json` keys as appropriate. Back up
   the registry first; append-only for other components' blocks.
8. Extend `primitives/directives/opencode.md` with opencode's harness-specific
   facts — config paths, hook mechanism, spawn door, its agent-kind name. Harness
   facts only; no core doctrine, no provider or model names.
9. `agent-core sync --harness opencode`, then `agent-core status --harness opencode`
   → 0 stale, 0 missing. Also determine whether the near-empty `agent/` directory
   is an unfinished deploy, and if so, which subagents should land there.
10. Bind what opencode supports and **prove each binding** by running it and
    showing real output. Register each as a `check` row whose needle names the
    binding's own defining substring.
11. **Add or complete opencode's column in `primitives/HARNESS-PARITY.md`.** Fill
    every row; a blank cell is a NO and must name what it needs.
12. Commit. Deposit `done`.

## Done-when

- All fourteen interview questions answered or explicitly `UNKNOWN`.
- Capability→event mapping table exists, every `NONE` naming its remedy.
- The injection contract established **empirically**, with captured evidence
  pasted — or documented as nonexistent.
- If opencode supports it, memory-at-wake is **live and proven**, with the hook's
  real output pasted showing the memory block.
- Any adapter you wrote exits 0 on failure and is silent when it has nothing to
  say — demonstrate both.
- `agent-core sync --harness opencode` clean; `agent-core status --harness opencode`
  → 0 stale, 0 missing; overall status 0 stale, 0 missing.
- The `agent/` directory question answered.
- opencode's column in `HARNESS-PARITY.md` complete, no blank cells.
- Committed on `wave/opencode-onboard`.

## Report-back

Deposit `done` to `concierge` with: the interview answers, the mapping table, the
injection-contract evidence, proof of the wake binding, the status summary line,
and every parity gap with its named remedy. Write
`orch-opencode-onboard.md.done`.
