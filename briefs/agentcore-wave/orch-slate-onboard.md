# ORCH [onboard slate — the harness you are running in]

slug: `slate-onboard` · branch: `wave/slate-onboard`

Read `CONTRACT.md` in this directory first, then
`~/agent-core/primitives/HARNESS-SHAPE.md` in full — it is the contract you are
mapping slate onto, and it carries the fourteen-question API-surface interview
that is the core of this task.

## Mission

Slate is registered as a harness for the **file surface only**: it receives
skills, subagents, and a composed directive. It has **no binding surface at all** —
no hooks line in its profile, and therefore zero lifecycle capabilities. No memory
at wake, no guards, no gates, no session capture. Onboard it properly.

You are running inside slate. You are the harness auditing itself, which is an
advantage: you can determine its real behavior by observation rather than from
documentation alone.

## Pre-Verified Facts (verified 2026-08-20)

**Installed:** `command -v slate` → `/opt/homebrew/bin/slate`.

**Config home:** `~/.config/slate/` contains `AGENTS.md` (16164 bytes),
`slate.json`, `ui-preferences.json`, `skills/`, `package.json`, `bun.lock`,
`node_modules/`, `.gitignore`.

**Current registry profile** — `~/.agent-core/registry`, at the very end of the
file:

```
harness slate
  skills      ~/.config/slate/skills
  skill_format directory
  agents      ~/.config/slate/agents
  delta       ~/agent-core/primitives/directives/slate.md
end
```

Note: `agents` points at `~/.config/slate/agents`, but the directory present on
disk is `~/.config/slate/skills`. **Verify whether `agents/` exists at all** —
this may be an unverified assumption in the existing profile.

**Already deployed and passing:** `directive/core` → `~/.config/slate/AGENTS.md`,
and `skill/agentcore` → `~/.config/slate/skills/agentcore/SKILL.md`. Its delta
exists at `primitives/directives/slate.md`.

**CLI surface** (from `slate --help` and `slate run --help`, this session):
- commands: `completion`, `[project]` (TUI, default), `run [prompt]`, `serve`
  (headless server), `attach <url>`, `export [sessionID]`, `mcp`, `upgrade`,
  `pr <number>`, `program`, `models`, `session`, `uninstall`.
- options include `-p/--prompt`, `-c/--continue`, `-s/--session/--resume`,
  `-q/--queue <markdown file, messages separated by --->`, `-r/--recent`,
  `-w/--workspace <array>`, `--dangerously-skip-permissions` (alias `--yolo`),
  `-m/--model` plus per-slot `--model-main`, `--model-search`,
  `--model-subagent`, `--model-program-search`, `--model-program-execute`,
  `--thinking-level`, `--print-logs`.
- `slate run` adds `--output-format {text,json,stream-json}` and
  `--input-format {text,stream-json}`.
- **Model slots are a slate-specific concept** (main / search / subagent /
  program-search / program-execute) and it spawns its own subagents. Record this
  in the delta; it has no analogue in the other five harnesses.

**Known gap in the surrounding fleet infrastructure** (context, not your task):
the terminal multiplexer on this machine has no `slate` agent kind, so slate panes
get no status detection. Do not try to fix that here. If your interview turns up
what slate would need to be detectable, record it as a finding.

Baseline: `agent-core status` → `359 ok  0 stale  0 missing`.

## Tasks

1. Worktree per CONTRACT.md, sparse-scoped to `primitives`.
2. **Run the fourteen-question interview** from `HARNESS-SHAPE.md`. Every answer
   from slate's own docs, its `--help` output, its config schema, or local repro.
   `UNKNOWN` is a legal answer; a guess is not.
3. **The binding surface is the hard part and the reason this brief exists.**
   Determine empirically:
   - Does slate have a hook or event mechanism at all? Check `slate.json`, the
     `~/.config/slate/` tree, `slate --help` subcommands, and its docs.
   - If it does: what are its event names, and how do they map onto the eight
     capabilities in HARNESS-SHAPE.md Half 2 (`wake`, `prompt_submit`, `pre_tool`,
     `post_tool`, `stop`, `session_end`, `pre_compact`, `status_line`)?
   - **What is the injection contract?** For a `wake`-equivalent, does the hook's
     stdout become session context, does it need a JSON envelope, or is there no
     such mechanism? Determine this by **writing a throwaway hook that dumps its
     stdin to a file, binding it, starting a session, and reading what arrived.**
     Assumed schemas are how bindings end up silently dead. Delete the throwaway
     when done.
   - If slate has **no** hook mechanism, that is a legitimate and important
     finding. Say so plainly and say what it would need — the answer then shapes
     whether slate can ever carry memory-at-wake.
4. **Report the mapping before writing any registry rows.** Produce the table:
   each agent-core capability → slate's event name / directory / mechanism, or
   `NONE`. Every `NONE` is a parity gap that must name what it would need — copy,
   shim, port, or adapter. Deposit this as a `question` to `concierge` and
   continue with the file-surface work while you await confirmation; do not block.
5. **Correct the existing profile** from your verified answers — especially the
   `agents` path, and add `hooks` / `hooks_json` keys only if slate genuinely has
   that mechanism. Back up the registry first; append-only for other components.
6. **Extend the delta** at `primitives/directives/slate.md` with slate's
   harness-specific facts: config paths, its CLI door, the model-slot concept, its
   own subagent spawning, and its hook mechanism or the absence of one. Harness
   facts only — no core doctrine, no provider or model names.
7. Deploy the file surface: `agent-core sync --harness slate`, then
   `agent-core status --harness slate`. Require 0 stale, 0 missing.
8. Bind whatever capabilities slate actually supports, then **prove each one** —
   run it and show its real output. A binding is not live because the config
   parses. Register each as a `check` row with a needle naming the binding's own
   defining substring.
9. **Add slate's column to `primitives/HARNESS-PARITY.md`** and fill every row. A
   blank cell is a NO, and NO must name what it needs.
10. Add or correct slate's entry in `primitives/COMPONENTS.md` if the harness
    itself owns surfaces worth tracking.
11. Commit. Deposit `done`.

## Done-when

- All fourteen interview questions answered or explicitly `UNKNOWN`, written into
  your report.
- The capability→event mapping table exists, with every `NONE` naming its remedy.
- The injection contract for a wake-equivalent is established **empirically**, with
  the captured stdin/stdout evidence pasted — or documented as nonexistent.
- The `agents` path question is resolved with an `ls`.
- `primitives/directives/slate.md` extended; `agent-core sync --harness slate`
  clean; `agent-core status --harness slate` → 0 stale, 0 missing.
- Every binding you added is ✓ and you have pasted its real output.
- slate's column in `HARNESS-PARITY.md` is complete, no blank cells.
- Committed on `wave/slate-onboard`.

## Report-back

Deposit `done` to `concierge` with: the interview answers, the mapping table, the
injection-contract evidence, the status summary line, and every parity gap with
its named remedy. Write `orch-slate-onboard.md.done`.
