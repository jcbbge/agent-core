# statem tools

## statem

`statem.ts` watches a project's `.madewell/` state, derives the Made Well
outer stage and inner phase(s) as explicit states, and on every transition
appends one `finding` row (topic `statem`) to the Tower board and refreshes
tab-title progress glyphs via `herdr tab rename`. Modelled on Erlang
gen_statem: explicit state enums (`OUTER`, `INNER`), a pure `transitions()`
function that IS the transition table, and plumbing around them. Nothing else.

```
bun statem.ts <project-root> [options]
  --interval <ms>   poll interval, default 2000
  --once            derive state, print it, log any transitions, exit
  --board <path>    board file to append to, default ~/.tower/board.jsonl
  --tabs <path>     tabs config, default ~/.tower/statem-tabs.json
  --no-tabs         skip all herdr tab rename calls
  --baseline <path> snapshot cache, default ~/.tower/statem-<project>.json
```

States: outer `discovery|commit|build|land`, inner `imagine|plan|make|verify`
(source: the project's `.madewell/guides/STATE-SHAPE.md`), plus `absent` for a
cycle/item not present. Board row bodies: `<project> OUTER build→land`,
`<project> INNER c004 plan→make`, `<project> INNER c004 pending→done (i002)`,
and `absent→<phase> (opened)` / `<phase>→absent (closed)` when a cycle
enters/leaves `active[]`.

Cold start seeds the baseline silently (no boot spam); the baseline file makes
restarts pick up transitions that happened while statem was down. Malformed
state files skip the poll with a stderr note. A state value outside the enums
is logged as-is with a `?` prefix on the stdout line. stdout is the trace —
run it in a visible pane, not a daemon.

Tab config (`~/.tower/statem-tabs.json`): project-root key → array of
`{ "tab_id", "label", "cycle" }`. `cycle` `"*"` (or absent) tracks the outer
stage; a cycle id tracks that cycle's phase + `●done◐remaining` item counts.
Titles are glyphs only — no phase words, no agent text, no task text.
Example rendered label: `ORCH c004-ux ▰▰▰▱ ●3◐2`.

## twr

`twr.ts` — read-only live viewer for one project's Tower board (a styled
`tail -f`, per the observability spec in
`~/agent-core/primitives/rules/control-flow.md` §Observability: ONE
`TOWR [project]` pane per project workspace).

```
bun twr.ts <project-root> [--board <path>] [--interval <ms>] [--limit <n>]
```

- `--board` board file, default `~/.tower/board.jsonl`
- `--interval` poll interval ms, default 2000
- `--limit` rows per section, default 10 transitions / 5 findings / 5 questions

Renders three sections, chronological (operator reads down):
**TRANSITIONS** (rows written by statem itself — `from` starts with
`statem@`), **FINDINGS** (everything not written by statem, whatever the
topic — orchestrator prose lands here, not in TRANSITIONS),
**OPEN QUESTIONS** (bodies containing `QUESTION` with no later
same-topic row containing `RULING`/`ANSWER`). Lines truncate to terminal
width; multi-line bodies collapse with ` · `. Redraws only when the board's
(line count, newest row id) signature changes — no repaint on idle polls.
Writes nothing, ever: no board rows, no ledger rows, no state files.

Scoping is imported from `~/.tower/lib.mjs` — `boardFor` for the default
board path; for a `--board` override (self-test fixtures) it filters with the
same exported `normCwd`, so git-worktree collapse behaves identically and
there is no second scoping implementation.

### Spawn recipe — `TOWR future` pane (run by the orchestrator, NOT run here)

Flag shapes verified against `herdr tab create --help`,
`herdr pane split --help`, `herdr pane run --help` on 2026-08-10.

```sh
# 1. One tab in the future project's non-orchestrator workspace.
#    Returns JSON with the new tab and pane ids — note the pane id as <PANE1>.
herdr tab create --workspace w1B --cwd /Users/jrg/future --label 'TOWR future' --no-focus

# 2. Pane 1: the statem writer for /Users/jrg/future (stdout = local trace).
herdr pane run <PANE1> /Users/jrg/.bun/bin/bun /Users/jrg/agent-core/primitives/tools/statem/statem.ts /Users/jrg/future

# 3. Split pane 1 downward — returns JSON with the new pane id, <PANE2>.
herdr pane split --pane <PANE1> --direction down --no-focus

# 4. Pane 2: the viewer.
herdr pane run <PANE2> /Users/jrg/.bun/bin/bun /Users/jrg/agent-core/primitives/tools/statem/twr.ts /Users/jrg/future
```

Absolute `bun` paths so a bare login shell works; herdr panes survive detach,
crash, and SSH drop, so no supervisor is needed. Check `statem.ts`'s own usage
line before step 2 — its CLI is owned by AGNT statem-core.
