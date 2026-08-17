# statem tools

## statem

`statem.ts` watches a project's `.madewell/` state, derives the Made Well
outer stage and inner phase(s) as explicit states, and on every transition
sends one Tower `msg` row (kind `finding`, topic `<project>/statem`) to the
Tower bus (`~/agent-core/primitives/tower/tower.mjs`) and refreshes tab-title
progress glyphs via `herdr tab rename`. Modelled on Erlang gen_statem:
explicit state enums (`OUTER`, `INNER`), a pure `transitions()` function that
IS the transition table, and plumbing around them. Nothing else.

```
bun statem.ts <project-root> [options]
  --interval <ms>   poll interval, default 2000
  --once            derive state, print it, log any transitions, exit
  --tabs <path>     tabs config, default ~/.tower/statem-tabs.json
  --no-tabs         skip all herdr tab rename calls
  --baseline <path> snapshot cache, default ~/.tower/statem-<project>.json
```

Which Tower store it writes to is controlled the same way the bus itself is
controlled — `TOWER_HOME` (and `TOWER_DB`) env vars, honored by `tower.mjs`.
Point it at a throwaway store for testing: `TOWER_HOME=$(mktemp -d) bun
statem.ts <project-root> --once`. There is no `--board` flag any more; the
store is a single sqlite `msg` table, not a per-tool JSONL file.

States: outer `discovery|commit|build|land`, inner `imagine|plan|make|verify`
(source: the project's `.madewell/guides/STATE-SHAPE.md`), plus `absent` for a
cycle/item not present. Message bodies: `<project> OUTER build→land`,
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

`twr.ts` — read-only live viewer for one project's Tower messages (a styled
`tail -f`, per the observability spec in
`~/agent-core/primitives/rules/control-flow.md` §Observability: ONE
`TOWR [project]` pane per project workspace).

```
bun twr.ts <project-root> [--interval <ms>] [--limit <n>] [--once]
```

- `--interval` poll interval ms, default 2000
- `--limit` rows per section, default 10 transitions / 5 findings / 5 questions

Like `statem.ts`, the store it reads is whatever `TOWER_HOME`/`TOWER_DB` point
at (default `~/.tower/tower.db`). There is no `--board` flag.

Renders three sections, chronological (operator reads down):
**TRANSITIONS** (rows written by statem itself — `sender` starts with
`statem@`), **FINDINGS** (everything else under this project's topic prefix,
whatever the exact topic — orchestrator prose lands here, not in
TRANSITIONS), **OPEN QUESTIONS** (bodies containing `QUESTION` with no later
same-topic row containing `RULING`/`ANSWER`). Lines truncate to terminal
width; multi-line bodies collapse with ` · `. Redraws only when the
(row count, newest row id) signature for this project's rows changes — no
repaint on idle polls. Writes nothing, ever: no `msg` rows, no cursor
advances, no state files.

### Scoping: the topic-prefix convention

The old board scoped rows by a `cwd` field (`boardFor`/`normCwd`, including
git-worktree collapse). The new Tower `msg` table has no `cwd` column — only
`topic` and `recipient`. statem and twr agree on this convention instead:
**a project's rows all carry a topic starting with `<project>/`** (`project`
= `basename(realpath(project-root))`), mirroring the
`<project-slug>/<topic>` fleet-mail board-topic shape already used elsewhere
in Tower (`~/.tower/COMMS-ARCH.md`). statem's own transitions use
`<project>/statem`; anything else about the project — findings, questions,
rulings — should use `<project>/<its-own-topic>` to show up in twr's view.
`twr` matches with `topic LIKE '<project>/%'`; there is no second scoping
implementation to keep in sync.

The old integrity footer counted unparseable JSONL lines
(`readJsonlStats`'s "N unparseable lines"). That failure mode is gone — the
sqlite schema (`NOT NULL` on `sender`/`body`/`kind`) rejects a bad write at
the door instead of admitting it and asking a reader to tolerate it later —
so the footer now reports `PRAGMA integrity_check` instead: `integrity: ok`,
or the check's own diagnostic text if the database file itself is ever
corrupted at the storage layer. Contract agreed with the sibling test-seat
(`agnt-statem-test`, tower/cutover msg 44): keep the literal `integrity: `
prefix.

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
