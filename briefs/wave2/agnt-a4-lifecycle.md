# AGNT A4 — lifecycle consolidation (ledger grammar + flight-recorder/stop-verdict shims)

You are agnt-a4-lifecycle. Do NOT use emojis anywhere. Fleet worker: no wake greeting. Workers NEVER commit.

## Mission
Extract ONE shared ledger-grammar library consumed by the three current copies, and convert flight-recorder + stop-verdict to shim-to-canonical (store owns body; live paths re-export). Pipe-test every live hook you touch before retiring old bodies. Grounding + herdr-task-report only if every gate stays green; otherwise document as next-wave with evidence.

## Pre-Verified Facts (ORCH verified 2026-08-11)
- Proven shim pattern (DO THIS): `~/.pi/agent/extensions/slim-rewrite.ts` is 2 lines:
  `export { default } from "/Users/jrg/agent-core/primitives/hooks/slim-rewrite.ts";`
  LIVE — do not modify slim-rewrite.ts or slim-guard.sh (OUT OF SCOPE).
- Ledger grammar currently triplicated:
  1. `~/.tower/lib.mjs` — exports TOWER/LEDGER/BOARD, `inboxState`, `boardFor`, `readAll`, `append`, `normCwd`, etc. (flight-recorder already imports `FLIGHT, inboxState` from here)
  2. `~/.pi/agent/extensions/tower-lifecycle.ts` — comment says "verbatim port of ~/.tower/lib.mjs semantics"; own LEDGER constants + parsers (~221 lines total file)
  3. `~/.pi/agent/extensions/tower-auto.ts` — own ledger helpers (~20kB file; large — touch only the duplicated grammar sections or import shared)
- Live CC hooks: `~/.tower/hooks/flight-recorder.mjs` (69 lines), `stop-verdict.mjs` (137 lines), also deposit-reminder.mjs (out of scope unless free).
- Pi twin: `tower-lifecycle.ts` ports flight-recorder / stop-verdict / deposit-reminder behavior for pi.
- Grounding: `~/.claude/hooks/grounding-hook.mjs` + `~/.pi/agent/extensions/grounding-hook.ts` — optional stretch.
- Task report: `~/.claude/hooks/herdr-task-report.sh` + `~/.pi/agent/extensions/herdr-task-report.ts` — herdr-managed; treat as OUT OF SCOPE unless trivial. Do not break herdr-agent-state.ts.
- Store hooks dir: `~/agent-core/primitives/hooks/` already has slim-*. Place new canonicals here, e.g. `flight-recorder.mjs`, `stop-verdict.mjs`, and shared `tower-ledger.mjs` (or deepen lib.mjs — pick ONE home and document it).
- LIVE-HOOK DANGER: broken hooks brick sessions machine-wide. Pipe-test BEFORE swapping:
  `echo '{"cwd":"/Users/jrg/agent-core","hook_event_name":"SessionEnd","session_id":"test-orch-a4"}' | bun ~/.tower/hooks/flight-recorder.mjs; echo exit:$?`
  Similar realistic stdin for stop-verdict (include fields it guards on). Record command + exit code (must be 0).
- Do NOT edit `~/.claude/settings.json`. Do NOT touch slim-*.
- Grounding hook blocks Edit-without-Read — Read→Edit always.
- `agent-core sync` FORBIDDEN.

## Parallel Work Notice
A1/A2/A3 own skills/docs/store purge. Ignore their diffs. Your partition is lifecycle only.

## Tower
```bash
cd /Users/jrg/agent-core && bun ~/.tower/cli.mjs post claim agent-core/wave2 "A4 CLAIM: ledger grammar + flight/stop shims" --from agnt-a4-lifecycle
bun ~/.tower/cli.mjs post finding agent-core/wave2 "A4 DONE: <one line>" --from agnt-a4-lifecycle
```

## File partition (TOUCH ONLY)
- `~/agent-core/primitives/hooks/tower-ledger.mjs` (or `.ts` — prefer .mjs if CC hooks import it) — NEW shared grammar OR document that `~/.tower/lib.mjs` is canonical and make pi import it via bun/jiti absolute path
- `~/agent-core/primitives/hooks/flight-recorder.mjs` — NEW canonical body (move from ~/.tower/hooks)
- `~/agent-core/primitives/hooks/stop-verdict.mjs` — NEW canonical body
- `~/.tower/hooks/flight-recorder.mjs` — become thin shim/re-export or `import` wrapper that loads canonical (must remain bun-executable entry for settings.json)
- `~/.tower/hooks/stop-verdict.mjs` — same
- `~/.tower/lib.mjs` — only if consolidating grammar HERE (then pi imports this path); keep API stable for session-start.mjs and others
- `~/.pi/agent/extensions/tower-lifecycle.ts` — switch to import shared grammar; keep pi extension entrypoint
- `~/.pi/agent/extensions/tower-auto.ts` — switch duplicated ledger helpers to shared import (minimal diff)
- Optional stretch only: grounding-hook pair → store + shim
- Evidence: `briefs/wave2/a4-pipe-tests.txt` + `.done`

Do NOT touch: slim-guard.sh, slim-rewrite.ts, herdr-agent-state.ts, settings.json, session skills, store plugins.

## Tasks
1. Map the three ledger-grammar copies (functions/types duplicated). Choose canonical home (prefer `~/agent-core/primitives/hooks/tower-ledger.mjs` exporting the shared API, with `~/.tower/lib.mjs` re-exporting for back-compat OR make lib.mjs the canonical and have store file be a note — pick one, don't leave three).
2. Move flight-recorder + stop-verdict bodies into `primitives/hooks/`. Leave live `~/.tower/hooks/*.mjs` as thin executable shims that load/run the canonical (shebang + import/dynamic import is fine; must accept stdin like today).
3. Update tower-lifecycle.ts and tower-auto.ts to consume the shared grammar (delete duplicated parsers).
4. PIPE-TEST every live path you changed; write commands + exit codes to `briefs/wave2/a4-pipe-tests.txt`. If a test fails, REVERT that hook to previous body before continuing.
5. Grounding/task-report: only if steps 1–4 green and time permits; else write `briefs/wave2/a4-deferred.md` with exact next-wave scope.
6. Tower finding + `.done`.

## Constraints
- Always exit 0 from hooks (existing discipline). Never throw into harness.
- No settings.json changes — paths must keep working.
- No commits. Backup originals to `briefs/wave2/a4-backups/` before overwrite.

## Done when
- One shared ledger grammar; the other two sites import it (grep evidence: no duplicate `inboxState` implementations left, or deferred with reason).
- flight-recorder + stop-verdict live paths are shims; canonical bodies under `primitives/hooks/`.
- `a4-pipe-tests.txt` shows exit 0 for each tested hook.
- `~/agent-core/briefs/wave2/done/a4-lifecycle.done` written last.

## Report-back
`.done`: canonical paths, shim strategy, pipe-test summary, deferred list, deviations.
