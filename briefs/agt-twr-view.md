# Brief: AGT twr-view — the TWR [project] pane viewer
Date: 2026-08-10
Orchestrator: OCH statem-tower (pane w1A:p5, board topic "statem")
Status: ready

## What This Is
ONE trivial live viewer for a herdr pane: the read side of the Made Well
stigmergy layer. It tails the Tower board filtered to one project and renders
three sections — last transitions, last findings, open questions — so the
operator never has to ask "what's the latest?". Per the observability spec
(`~/agent-core/primitives/rules/control-flow.md` §Observability), there is ONE
`TWR [project]` pane per project workspace. Not pane-per-agent.

The operator's sizing words are BINDING: "the simplest, easiest, minimal,
barebones answer." This is a styled `tail -f`, not a TUI framework.

## PARALLEL WORK NOTICE
AGT statem-core is live at the same time, building the write side (`statem.ts`)
in the SAME directory. Your partition is `twr.ts` and your own README section.
DO NOT create, edit, or delete `statem.ts` or `~/.tower/statem-tabs.json`.
`statem.ts` may not exist yet when you start — that is expected and does not
block you (see §Task 3). If you think statem.ts needs to change, board-post it on
topic "statem" and let the orchestrator route it.

## Your file partition (exclusive; touch nothing else)
- `~/agent-core/primitives/tools/statem/twr.ts`   (NEW — the whole deliverable)
- `~/agent-core/primitives/tools/statem/README.md` — append ONLY a `## twr`
  section. AGT statem-core owns the `## statem` section and may be writing the
  file concurrently: if the file does not exist yet, create it with just your
  section; if it does, append. Never restructure or rewrite the other section.

## Pre-Verified Facts (orchestrator, verified this session — do not re-derive)
- `~/.bun/bin/bun` is 1.3.14. `~/agent-core` IS a git repo; `primitives/tools/`
  exists.
- **Tower board** is append-only JSONL at `~/.tower/board.jsonl` (1.4MB, so read
  it efficiently — do not hold the whole parsed history in memory more than once
  per redraw). Row shape: `{"id","ts","cwd","type","from","topic","body"}`.
  `type` values seen live: `finding`, `note`, `claim`.
- **USE THE SANCTIONED SCOPING — DO NOT REIMPLEMENT IT.** `~/.tower/lib.mjs`
  exports `boardFor(cwd, {topic, limit})` (defined at `lib.mjs:123`) and `normCwd`
  (`lib.mjs:38`). `normCwd` does realpath + `git rev-parse --git-common-dir`
  collapse so a git worktree shares its main repo's Tower scope — that is
  load-bearing for this fleet (workers live in `~/.herdr/worktrees/future/c004-ux`
  and must appear in the `future` project's TWR pane). bun can import it directly:
  `import { boardFor } from '/Users/jrg/.tower/lib.mjs'`. Zero new deps, and no
  drift from the one canonical implementation.
- Live proof the scope works: 56 rows in the current board carry
  `"cwd": "/Users/jrg/future"`.
- `statem.ts` (AGT statem-core's deliverable) writes rows with
  `topic: "statem"`, `type: "finding"`, `from: "statem@<project>"`, and bodies in
  exactly these five shapes:
  - `future OUTER build→land`
  - `future INNER c004 plan→make`
  - `future INNER c004 pending→done (i002)`
  - `future INNER c004 absent→plan (opened)`
  - `future INNER c004 make→absent (closed)`
  That is the contract. Render them; do not re-parse them into a model.
- `herdr tab create --workspace <id> --cwd <path> --label <text> --no-focus`
  exists, returns JSON with the new tab and pane ids. `herdr pane split
  [--pane <id>] --direction right|down --no-focus` and `herdr pane run <PANE_ID>
  <COMMAND>...` exist. herdr panes survive detach, crash, and SSH drop — that is
  why the viewer needs no supervisor.
- **`~/.tower/ledger.jsonl` IS OPERATOR MAIL. This tool NEVER WRITES ANYTHING.**
  The viewer is read-only. No appends, no state files.

## Tasks

### 1. `twr.ts` — the viewer
CLI: `bun twr.ts <project-root> [options]`
```
--board <path>    board file, default ~/.tower/board.jsonl
--interval <ms>   poll interval, default 2000
--limit <n>       rows per section, default 10 transitions / 5 findings / 5 questions
```

Render, top to bottom:
```
TWR future                                      19:47:02
─ TRANSITIONS ────────────────────────────────────────
19:31  future INNER c004 pending→done (i002)
19:44  future OUTER build→land
─ FINDINGS ───────────────────────────────────────────
16:45  orch-c003 · BUILD RED after i004: adding ServerMe…
─ OPEN QUESTIONS ─────────────────────────────────────
19:38  OCH statem-tower · which tab carries c004 glyphs…
```
- **TRANSITIONS**: rows with `topic === "statem"`, newest LAST (chronological,
  like a log — the operator reads down). Show time + body.
- **FINDINGS**: rows with `type === "finding"` and `topic !== "statem"`, newest
  last. Show time + `from` + body, truncated to the terminal width.
- **OPEN QUESTIONS**: rows whose body contains `QUESTION` (case-insensitive) and
  that have no later row on the same topic containing `RULING` or `ANSWER`
  (case-insensitive). If that heuristic gets complicated, simplify it to "bodies
  containing QUESTION, last 5" and note the simplification in the README — a
  crude open-questions list that ships beats a correct one that does not.
- Truncate every line to the terminal width (`process.stdout.columns`, fallback
  100) so nothing wraps and the layout stays readable. Multi-line bodies collapse
  to one line (replace newlines with ` · `).
- Colour with raw ANSI escapes only: dim rules, bold header, nothing else. No
  dependency, no alt-screen, no mouse, no input handling.
- **Redraw only on change.** Poll every 2s; if the newest row id and the total row
  count are unchanged, do nothing (do not repaint). On change, clear and repaint.
  The header clock may update on repaint only — do NOT repaint just to tick it.
- Graceful on a missing/unreadable board file: print one line and keep polling.

### 2. Self-test against a FIXTURE (real file, no mocks, no board pollution)
**Do not write test rows into `~/.tower/board.jsonl`.** That file is shared live
fleet infrastructure.
1. Write a fixture JSONL at `/tmp/twr-selftest/board.jsonl` containing hand-written
   rows in the real shape: several `topic:"statem"` rows using all five body
   forms above, a couple of `finding` rows on another topic, one body containing
   `QUESTION`. Give them `cwd` values that exercise scoping: some
   `/Users/jrg/future`, one `/Users/jrg/.herdr/worktrees/future/c004-ux` (must
   appear — worktree collapse), one `/Users/jrg/circadian` (must NOT appear).
2. Run `bun twr.ts /Users/jrg/future --board /tmp/twr-selftest/board.jsonl` and
   capture the rendered output.
3. Append a new statem row to the fixture while it is running; confirm it appears
   within 2s and that no repaint happened in between (i.e. the change-detection
   works — state how you observed this).
4. Confirm the `/Users/jrg/circadian` row is absent and the worktree row present.
   **If the worktree row does NOT appear, say so plainly in your report** rather
   than tuning the fixture until it passes — that would be a real finding about
   `normCwd` and the orchestrator needs it.
5. Clean up `/tmp/twr-selftest`.

### 3. Write the spawn recipe — DO NOT RUN IT
The live `TWR future` pane is spawned by the orchestrator as the integration
step, because it needs BOTH `twr.ts` and AGT statem-core's `statem.ts` to exist.
Your job is to write the exact, copy-pasteable command sequence into your README
section, with the ids left as placeholders:
- one tab, label `TWR future`, workspace `w1B` (the future project's
  non-orchestrator workspace), cwd `/Users/jrg/future`
- pane 1 runs `statem.ts` for `/Users/jrg/future` (its stdout is the local trace)
- pane 2 (a `--direction down` split of pane 1) runs `twr.ts` for
  `/Users/jrg/future`
- both invoked via absolute `~/.bun/bin/bun` paths so a bare login shell works
Verify the command SHAPES against `herdr tab create --help`, `herdr pane split
--help`, `herdr pane run --help` (read them; do not guess flag names). Do not
create the tab, do not spawn the panes, do not rename any existing tab or pane.

## Hard budget
`twr.ts` ≤ 100 lines. Zero new dependencies (bun stdlib + the `~/.tower/lib.mjs`
import). No server, no port, no launchagent, no framework, no alt-screen TUI.
If you find yourself reaching for a dependency, stop and board-post instead.

## Out of scope
`statem.ts` and the tabs config (AGT statem-core owns both). The machine-wide
execution pane (that is OCH herdr-qol's work — do not build a fleet view).
Anything in `/Users/jrg/future` (read-only reference). herdr source. Dashboards.
HTTP/websocket. Committing to git — leave your changes uncommitted in
`~/agent-core`.

## How We'll Know It's Done
- [ ] `twr.ts` exists, ≤100 lines, imports `boardFor` from `~/.tower/lib.mjs`
      rather than reimplementing cwd scoping
- [ ] Self-test output pasted: the three rendered sections from the fixture
- [ ] Scoping verified: worktree row present, other-project row absent (or the
      failure reported honestly)
- [ ] Live update within 2s confirmed, and no-change means no repaint
- [ ] README `## twr` section carries the verified spawn recipe, un-run
- [ ] Nothing written to `~/.tower/board.jsonl` or `~/.tower/ledger.jsonl` by your
      testing — report both files' line counts before and after your work

## Report back
Board post, topic `statem`, from `AGT twr-view`: file path + line count, the
rendered self-test output verbatim, the scoping result, board/ledger line counts
before and after, the spawn recipe, and deviations or "none". Then say DONE in
your pane so your orchestrator's wake signal fires.
