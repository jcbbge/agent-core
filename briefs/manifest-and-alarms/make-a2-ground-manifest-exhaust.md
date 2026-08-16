# MAKE A2 — Ground-manifest exhaust producer (CC-strong)

Repo: `/Users/jrg/agent-core` (make root worktree:
`/Users/jrg/.cursor/worktrees/agent-core/wt-orch-a2-exhaust` on branch
`feat/a2-ground-manifest-exhaust` @ `1565b9e` from `main`). Do NOT use emojis
anywhere. Do NOT commit (ORCH/finisher integrates).

Mission: emit `deps.json` + mandatory `coverage` as exhaust from compulsory
grounding reads (CC PostToolUse). Never hand-authored deps. Honest about
shell-lossy holes. Cursor exhaust is out of scope (document as follow-on).

## Pre-Verified Facts (ORCH verified 2026-08-14)

- Co-signed shape: `/Users/jrg/agent-core/briefs/manifest-and-alarms/A2-GROUND-MANIFEST-SHAPE.md`
  (readable at that absolute path even if missing from this worktree). Schema
  `ground-manifest/v1`. §5: absent/empty → fail VISIBLE not refuse; stale
  ref/mtime → refuse; coverage holes → flag; malformed schema → refuse.
- Live CC hook (NOT yet in git): `~/.claude/hooks/grounding-hook.mjs` (159 lines,
  sha256 prefix `2530567eb25eef51`). Modes: `pre|post|reset`. State under
  `/tmp/cc-grounding`. PostToolUse matcher `*` → `bun …/grounding-hook.mjs post`.
  PreToolUse matcher `Write|Edit|MultiEdit|NotebookEdit|Bash` → `pre`.
  SessionStart → `reset`. Today post only flips the grounded flag — NO path
  exhaust, NO `deps.json`.
- Tracked copy: `~/agent-core/primitives/hooks/grounding-hook.mjs` does NOT exist.
  Registry harness `claude-code` maps `hooks → ~/.claude/hooks` — canonical home
  for this unit is `primitives/hooks/`.
- Pi twin (reference only, do not edit this unit): `~/.pi/agent/extensions/grounding-hook.ts`.
- Artifact path (shape §2): `<project>/.madewell/ground/<cycle-or-unit-key>/deps.json`.
- Sample PostToolUse stdin fields the live hook already reads:
  `session_id`, `tool_name`, `tool_input.file_path` | `notebook_path` | `command`.
- Forbidden sibling files (A8 owns): `primitives/hooks/tower-ledger.mjs`,
  `primitives/mcps/tower/{lib,server}.mjs`, `COMMS-ARCH.md`. Do not touch.
- Do not edit `~/cursor-shim` (A3 consumer). Ignore dirty `primitives/profiles/models.json`
  and A8 uncommitted diffs on other worktrees.
- No standalone `ground` CLI on PATH tonight. Exhaust rides the grounding-hook
  observation surface + a `flush` synthesis step you implement.

## Parallel Work Notice

- Board/field topic: `tower/manifest-and-alarms`. Post CLAIM then findings with
  `--from` your role (`AGNT a2-coder` / `AGNT a2-test-maker`).
- ORCH a8-alarms is live on `w2Y:p1V` — ignore their partitions.
- CORD cursor-shim owns A3 — do not implement cursor preToolUse exhaust.

## Tower

- Post claim/finding to `tower/manifest-and-alarms`.
- No operator mail. nQ=0.
- Write `.done` under `briefs/manifest-and-alarms/workers/` when your partition
  is complete (`a2-coder.done`, `a2-test-maker.done`). Create the directory if
  missing in your worktree.

## Binding design decisions (ORCH-resolved — do not re-litigate)

1. **Canonical source:** `primitives/hooks/grounding-hook.mjs` (+ new sibling
   `primitives/hooks/grounding-exhaust.mjs` for pure exhaust helpers). Live
   `~/.claude/hooks/grounding-hook.mjs` is a **deploy target** — coder does NOT
   mutate `~/.claude/hooks/` (ORCH deploys after green). Seed the tracked hook by
   copying the live 159-line file as the starting point, then extend.
2. **Module split:** gate logic stays in `grounding-hook.mjs`; path extract,
   coverage accounting, session exhaust accumulate, and `emitDepsJson` live in
   `grounding-exhaust.mjs` and are imported by the hook. Export pure functions
   for tests. **No agent-callable `addDep(path)` / hand-injection API.**
3. **Accumulate on `post`; write on `flush`:**
   - `post`: observe tool → update coverage counters; if a path is known, append
     a deps entry (`via`: `read|write|bash-parse`); Bash with no extractable path
     increments `shell_calls` AND `unaudited_shell_calls`.
   - New argv mode `flush`: write `deps.json` for the session under
     `$GROUND_MANIFEST_ROOT` (default: `<cwd>/.madewell/ground/<key>/deps.json`
     where key = `$GROUND_CYCLE_KEY` or `default`). Then clear exhaust state for
     that session (keep gate flag behavior unchanged unless reset).
   - When any Bash/`Shell` was observed without full path extraction,
     `coverage.mode` MUST be `shell-lossy` (never silently claim `full`).
   - `unaudited_shell_calls` must never silently zero when unaudited Bash ran.
4. **Schema fields** (exact keys from shape §3): `schema`, `ts`, `cwd`,
   `cycle_or_unit`, `harness` (`claude-code`), `emitter`
   (`grounding-hook-exhaust@<shortsha-or-dev>`), `deps[]`, `coverage{}`.
   Exhaust may leave `verdict: "UNKNOWN"`; `ref`/`mtime` best-effort (null OK).
5. **Docs:** `primitives/mcps/tower/GROUND-MANIFEST.md` — producer contract
   matching co-signed shape §1–§5 + CC-strong / cursor-honest fence + note that
   cursor preToolUse exhaust is follow-on owned with cursor-shim. Do NOT edit
   `COMMS-ARCH.md` (A8). One-line pointer from GROUND-MANIFEST to the shape file
   path is enough.
6. **Fixture sample:** under `briefs/manifest-and-alarms/fixtures/demo/deps.json`
   — MUST be generated by calling the emitter against a recorded PostToolUse
   fixture (JSONL or .json of stdin events), not hand-typed as if observed.
   Check the generator script/command into
   `briefs/manifest-and-alarms/fixtures/` (e.g. `emit-demo.mjs`).
7. **Deploy note** (in GROUND-MANIFEST.md): after land, replace or symlink
   `~/.claude/hooks/grounding-hook.mjs` → tracked canonical (agent-core registry
   hooks dir). Coder only documents; does not flip the live file.

## Tasks — Implementer (coder)

Touch ONLY:
- `primitives/hooks/grounding-hook.mjs` (new; seed from live copy)
- `primitives/hooks/grounding-exhaust.mjs` (new)
- `primitives/mcps/tower/GROUND-MANIFEST.md` (new)
- `briefs/manifest-and-alarms/fixtures/**` (generator + generated demo deps.json)
- `briefs/manifest-and-alarms/workers/a2-coder.done`

1. Adopt live hook into `primitives/hooks/grounding-hook.mjs` preserving pre/post/reset gate behavior.
2. Add `grounding-exhaust.mjs` with pure helpers: path extract from tool events,
   coverage accounting, accumulate, `buildDepsDocument` / `flushDepsJson`.
3. Wire `post` to accumulate; add `flush` mode.
4. Write GROUND-MANIFEST.md per decisions above (include §5 matrix verbatim enough to match co-sign).
5. Emit demo fixture via generator (not a hand-authored lie).
6. Prove in finding: public surface has no hand-injection API for agents.

Done when: emitter builds schema-valid docs with mandatory coverage; shell-lossy
honesty holds; docs match §5; demo fixture generated; `.done` written.

Do NOT write or edit test files (test-maker owns tests). Do NOT commit.
Do NOT touch `~/.claude/hooks/`. Do NOT touch A8 / cursor-shim files.

## Tasks — Test-Maker

Touch ONLY:
- `primitives/hooks/grounding-exhaust.test.mjs` (preferred) and/or
  `primitives/hooks/test/**` if matching existing hook test layout
- `briefs/manifest-and-alarms/workers/a2-test-maker.done`

Do NOT read or edit implementation bodies beyond importing the public exports
the brief names (`grounding-exhaust.mjs`). Derive tests from this brief + the
shape schema only.

Write tests (NO MOCKS) that assert intent:

1. Path extract — Read/Edit with `file_path` yields a deps path; bare Bash
   `ls` with no path tokens yields no path and increments unaudited.
2. Coverage accounting — after unaudited Bash, `unaudited_shell_calls >= 1`
   and `mode === "shell-lossy"`.
3. Schema shape — `buildDepsDocument` / flush output has `schema:
   "ground-manifest/v1"` and mandatory `coverage` object with the counters
   named in shape §3.
4. No hand-authored injection — module exports must NOT include an
   agent-facing `addDep` / `declareDep` / similar; only observe/accumulate/flush
   from tool-event shaped inputs. Assert by enumerating exports.
5. Fixture proof — loading the recorded PostToolUse fixture through the
   accumulator increments unaudited when the fixture includes pathless Bash.

Done when: tests exist on disk covering 1–5; no implementation edits; no commit.

## Tasks — Tester (after both land)

Run from the integrated tree:
`cd <repo> && bun test primitives/hooks/grounding-exhaust.test.mjs`
(and any sibling test path test-maker created).

- New A2 tests must pass.
- Do not expand scope to fix unrelated failures elsewhere.
- Report pass/fail counts.

## Constraints

- NO MOCKS.
- Stage nothing; do not `git add` / commit.
- Match surrounding style; minimal comments.
- One plate: coder owns impl + docs + fixtures generator; test-maker owns tests only.

## Report back with

- Files touched + per-file summary
- Exact export names added
- How to regenerate the demo fixture
- Residual: cursor exhaust still follow-on
- Path to `.done`
