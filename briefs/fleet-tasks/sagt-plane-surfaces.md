# SAGT internal plane surfaces — Tower / herdr / statem API ground truth

> From: CORD fleet-tasks (w2E:p2). Binding. Self-contained.
> Board topic: `agent-core/fleet-tasks`. `.done` marker: `~/agent-core/briefs/fleet-tasks/.done/sagt-plane-surfaces.done`.

## Mission

Establish the exact local API surfaces a CORD/ORCH-plane task whiteboard would
compose with or extend. **Read-only.** `~/.tower/` is a live bus — read, never
write (no board posts except your own summary finding per Report-back). No edits
anywhere except your findings file.

CORD has already read and will supply to the design phase: `statem/README.md`,
`herdr-spine/docs/ctl-fleet.md`, `herdr-spine/docs/spawn.md` (§$task trap),
`~/.tower/COMMS-ARCH.md`, `research/harness-ontology-map.md`. Do NOT re-summarize
those docs; your job is the *code-level* ground truth underneath them.

## Surfaces to pin down (file:line citations for each)

1. **Tower board/ledger schema** — `~/.tower/server.mjs` + `~/.tower/lib.mjs`:
   - Exact JSONL row shapes for `board.jsonl` (claim/finding/note) and
     `ledger.jsonl` (deliverable/question/alert/ack): every field, which are
     required, what `to`, `topic`, `cwd`, `ts`, `id` look like.
   - `board_post` / `board_read` tool input schemas and any guards (scratch-cwd
     refusal, etc.).
   - Scoping: how `boardFor`/`normCwd` collapse worktrees; what a raw unscoped
     read sees.
   - `~/.tower/cli.mjs` verbs (status|inbox|board|burn|all|projects) — what each
     prints.
2. **herdr metadata/token API** — from `~/agent-core/primitives/skills/herdr/SKILL.md`
   and (cheap) `herdr ... --help` output:
   - `herdr pane report-metadata` (tokens, display-agent, ttl-ms), `herdr tab rename`,
     `agent.view.set`, `events.subscribe` frame shapes — enough that a designer
     knows exactly how statem rewrites tab glyphs and how ctl-fleet reads tokens.
   - Confirm/deny: is there any herdr-native per-pane *list* structure (multiple
     tasks per pane), or is a pane's metadata flat key→string tokens only?
3. **statem.ts / twr.ts mechanics** — `~/agent-core/primitives/tools/statem/`:
   - How statem derives state from `.madewell/` files (which files, which fields),
     the transition-detection/baseline mechanism, and the exact board row format
     it appends.
   - How twr renders (sections, poll/redraw signature) — it's the closest existing
     "live task viewer" prior art.
4. **ctl-fleet WORK section** — `~/herdr-spine/bin/ctl-fleet`: how it reads
   `.madewell/madewell.json` + `cycles/*.json`, the 5s slow tick + mtime cache,
   and the render path (so the design can say precisely what a TASKS section
   would cost).

## Report-back

1. Write findings to `~/agent-core/briefs/fleet-tasks/research-plane-surfaces.md`
   with a provenance block (`date -u`; `pwd -P`) and file:line citations.
2. Post a 5-10 line summary finding to board topic `agent-core/fleet-tasks`
   (`from`: your pane id).
3. Write `.done` marker `~/agent-core/briefs/fleet-tasks/.done/sagt-plane-surfaces.done`
   containing one line: outcome + path to findings.
