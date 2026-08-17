---
name: herdr
description: >
  Operate Herdr, the terminal multiplexer/runtime for this machine's agent
  fleet: a background server owns real terminal processes (panes survive
  crashes, detach, SSH drop), detects agent identity and status per pane,
  and exposes a CLI + socket API. Invoke when inspecting or controlling
  panes, tabs, workspaces, or terminals, or when spawning, naming, or
  observing an agent in a pane. Pane-local control requires HERDR_ENV=1;
  fleet observation and spawning work from any shell via the global server
  socket.
metadata:
  author: jrg
  version: "1.4"
  tags: herdr, multiplexer, panes, terminals, substrate, control-flow, comms-arch, tower
  upstream: UNKNOWN — https://raw.githubusercontent.com/ogulcancelik/herdr/master/SKILL.md returns HTTP 404 (verified live this session, 2026-08-10); no working upstream source confirmed
  gateway: strudel pantry (roots ~/.pi/agent + ~/agent-core/primitives)
---

# Herdr

Herdr is a terminal multiplexer and runtime for coding agents. A background
server owns real terminal processes; clients attach to render them. Panes
survive detach, terminal close, or SSH drop. Herdr detects agents inside
panes and reports each one's state, so a whole fleet is visible at once.
Verified live this session: `herdr --version` → `0.8.0`; every version stamp
below is 0.8.0 unless marked otherwise.

```bash
test "${HERDR_ENV:-}" = 1   # confirm you're in a Herdr pane before any control command; stop if it fails
```

**Sandbox policy (2026-08-06).** Harness exec sandboxes can block the control
socket (`PermissionDenied`/`fetch failed` on `~/.config/herdr/herdr.sock`).
Verify once per session with `herdr api snapshot`; if it fails, rerun herdr
commands with the sandbox disabled for those calls. Do not relocate to an
unsandboxed pane and do not fall back to polling files.

Machine composition (this install) lives in `~/agent-core/primitives/AGENTS.md`,
not in this skill. A prompt is not delivered until `agent_status` flips.

## Canonical docs — read these, don't re-derive them

This file is a working manual, not the authority; when it disagrees with a
doc below, the doc wins.

| Doc | Owns |
|---|---|
| `~/agent-core/primitives/rules/control-flow.md` | Hierarchy (OPERATOR>CONCIERGE>CORD>ORCH>AGNT/SAGT), naming prefixes, Made Well mapping, §Reaping, §Observability, §Two-plane CTRL |
| `~/.tower/COMMS-ARCH.md` | Comms law: four planes, one message/one audience/once/in full, notification rubric, project isolation |
| `~/herdr-spine/docs/spawn.md` | spine-spawn modes, the stamping mandate, the four name carriers, `$task`/`$role`, the spine-spawn naming gap |
| `~/herdr-spine/docs/ctl-fleet.md` | The CTRL fleet pane (two-plane machine/project view), row format |
| `~/agent-core/primitives/tools/statem/README.md` | statem (Made Well state tracker) + twr (Tower board viewer) |
| `~/source/herdr-RETROFIT-MAP.md` | Codebase map for the installed herdr 0.8.0 |

## Hierarchy and naming (control-flow.md — MANDATORY)

```
OPERATOR → CONCIERGE → CORD (1/project) → ORCH (1/unit of work) → AGNT (focused work)
                                                                 → SAGT (deferred/async)
```
Plus two infra prefixes: `CTRL` (fleet control pane) and `TOWR` (one Tower
viewer per project workspace) — display panes, not agents.

| Prefix | Role | Registration name |
|---|---|---|
| `CORD [project]` | Coordinator | `cord-<project>` |
| `ORCH [feature/bug/chore]` | Orchestrator | `orch-<slug>` |
| `AGNT [Task]` | Agent | `agnt-<slug>` |
| `SAGT [TODO]` | Subagent | `sagt-<slug>` |

Rename every spawned pane to its prefixed role **before** its agent starts.
`herdr agent start <NAME>` rejects spaces/uppercase (`invalid_agent_name`,
verified via `--help` this session) — registration names are always
lowercase-kebab (`orch-herdr-qol`); prefixed display case (`AGNT ...`) lives
in the pane label / `--display-agent`, never the registration name.

## The stamping mandate (spawn.md)

CTRL's fleet row shows a human work name next to the role prefix and refuses
a raw item id. Stamp the item's **title** (plain words, never `c004-i005`)
via all four carriers at birth:

1. `herdr agent start <name>` — the only carrier surviving a server restart.
2. `herdr pane report-metadata <id> --source <src> --display-agent "AGNT wire OAuth callback"`
3. `herdr pane rename <id> "AGNT wire OAuth callback"` — feeds `panes[].label`.
4. `--token name="<title>"` — highest-priority override CTRL checks first.

Also stamp `--token task="<title>"` (80-char cap, the activity line) and
`--token role=3-AGNT` (`1-CORD|2-ORCH|3-AGNT|4-SAGT`, drives panel sort).
**The trap:** tokens do NOT survive a restart; `agent start` registrations
do — after a restart, tokens are blank until re-stamped.

## Reaping (control-flow.md §Reaping)

Done = gone. A truly-done agent (report delivered, done-conditions verified
by its spawner) is spawned down: pane closed, process ended, empty tab
closed. No trophy panes. The spawner reaps its own agents; the coordinator
reaps orchestrators after their final report. Exceptions: infra panes meant
to run forever (`CTRL`, `TOWR`, statem) and the operator's focused pane.
Durable state lives on disk and the Tower board, never a dead pane's
scrollback.

## Learn the CLI, session targeting, IDs

The installed binary is the authority — discover syntax with the command
group (never bare `herdr`, which launches the TUI; never probe a mutating
nested command by omitting args). Most commands print JSON; read IDs and
state from responses, never a display number.

Reach the intended server through ONE of: `herdr --session <name> <cmd>`, or
`HERDR_SOCKET_PATH=<socket>` (honored by the CLI, the authoritative route
inside plugin context — confirmed in `spine-wormhole`/`spine-watch`/
`spine-greeting`). `HERDR_SESSION=<name>` is NOT routing authority —
re-verified live this session (`HERDR_SESSION=nonexistent-probe-session
herdr workspace list` still returned the default session). Never target by
session-name env.

IDs are short, opaque, colon-joined, two segments (workspace-prefixed local
id, e.g. `w1A:p12` a pane, `w1A:tJ` a tab — split on the FIRST colon only
when parsing). Closed IDs are never reused, a moved pane gets a new one
(live-verified this session: split a pane → `w1A:p13`, closed it, split
again → `w1A:p14`, never `p13` again). Herdr injects `$HERDR_WORKSPACE_ID`/`$HERDR_TAB_ID`/`$HERDR_PANE_ID`
into every managed pane; prefer `--current` over omitting a target (which
can hit another client's focused pane). Herdr exposes NO pane-birth
timestamp anywhere (verified against `session.snapshot`) — a duration comes
from a transcript's first timestamped record or a board CLAIM, never
guessed. Discover live state with `herdr workspace list`, `tab list
--workspace <id>`, `pane list --workspace <id>`, `api snapshot` (full tree).

## Agent status

States: `idle`, `working`, `blocked`, `done`, `unknown`. `idle`/`done` are
the same state with different attention — `done` means unseen (background
tab); focusing the pane/tab marks it seen and flips it to `idle`. The
sidebar is an attention queue, not a status board.

Corroborate non-busy readings: `agent_status` can read `idle` while the
harness runs a long foreground tool (the detector keys on the agent loop,
not the tool) — check the rendered screen for a busy banner before
concluding a pane is free. This does not apply to input waits: a permission
dialog shows no busy banner yet correctly surfaces as `blocked`.

## Start an agent in a pane (the spawn loop)

Default to a sibling pane in the current tab/cwd unless the user asked for
different topology. Split without stealing focus, read the returned ID,
stamp its role, launch. Prefer `~/bin/spine-spawn` when spawning fleet
workers — it bakes topology, rename, readiness, and verified submit.

```bash
herdr pane split --current --direction right --no-focus   # or: down
herdr pane rename <id> "AGNT wire OAuth callback"
herdr agent start agnt-wire-oauth --kind claude --pane <id>   # NAME lowercase-kebab; [-- <AGENT_ARG>...] passes through, e.g. -- --model sonnet
herdr agent prompt <id> "Review the current diff; report only actionable findings." --wait --until working --timeout 30000
```

**pi kind — the blessed fleet path.** Gateway models are addressed as
`cursor/<id>[@ctx][:thinking|:fast]` via `--model` (the `cursor` provider
is pi config, nothing more), thinking level via `--thinking` (they do not
stack in one ID):

```bash
herdr pi                                  # the door (harness + concierge)
herdr claude                              # same, Claude Code
herdr cursor                              # same, cursor
herdr prime                               # same, prime-agent
spine-spawn worker --profile coder …      # fleet: kind from desk default
```

`agent start` waits for interactive readiness; launch by plain executable
kind (`pi`, `claude`, `codex`, …) so its TUI opens. The pane must
already sit at an interactive shell prompt (`agent_pane_busy` — retry
briefly), and NAME must be session-unique (`agent_name_taken`). A
freshly-split pane whose shell hasn't finished sourcing its profile yet can
instead surface as a `timeout` error with `command not found: <agent>` in
the pane, NOT `agent_pane_busy` — retrying after a beat succeeds either way
(reported verified by ORCH this session; not independently re-triggered by
this audit).

**DELIVERY IS NOT DELIVERY UNTIL VERIFIED (hard rule, 2026-07-27).** `agent
prompt --wait` submits and confirms the flip atomically — prefer it always.
`pane run` (fallback) can leave text buffered as `[Pasted text #N]`,
unsubmitted, even on an idle pane; `agent_prompt_stalled` is not proof of
non-delivery (`/reload`-style inputs never flip state — check the
transcript first). After every prompt-carrying `pane run`, verify the flip
or force it — status-flip is the only evidence of submission, never `pane
run` alone:

```bash
sleep 2 && herdr pane get <id>        # agent_status must flip to working
herdr pane read <id> --source visible --lines 6 | grep -q "Pasted text" \
  && herdr pane send-keys <id> Enter && sleep 2 && herdr pane get <id>
```

Two delivery traps (verified 2026-08-15):

- **Cursor follow-up trap.** A prompt sent to a cursor pane mid-turn queues
  as a follow-up ("enter send now") and sits UNSENT after the turn ends —
  the pane reads idle with the directive trapped in its input box. The
  status-flip check above catches it; the fix is one more `send-keys Enter`.
  Bake the retry into every delivery path, not just the happy one.
- **Status flips wake no one.** `done` is visible but nothing subscribes —
  an idle parent will sit forever beside finished children. The resident
  supervisor is tup's bellman: run `python3 ~/tup/socket/bellman.py` (wake
  organ v1 — evidence-gated claim, clock-drained outbox, one-link-up
  escalation, verified submit). Do not re-implement that loop in herdr-spine.

**Prefer the wrapper:** `~/bin/spine-spawn <orch|worker|fanout|prompt>`
(= `python3 ~/herdr-spine/bin/spine-spawn` — **never `bun`**, bun parses the
Python file as JS and dies). Bakes topology, rename, readiness, verified
submit, control-flow stamps (doc: spawn.md). Modes: `orch` (task tab +
orchestrator), `worker` (sibling pane; registration prefixes `cord-`/`orch-`/
`agnt-`/`sagt-` set role tokens), `fanout` (dedicated `<task>-workers` tab,
gridded, **hard-capped at 4 briefs/call**), `prompt` (verified follow-up).
**Comms law:** idle/done after a board DONE + `.done` is success — collect on
Tower/CTRL, never re-prompt for status (`~/.tower/COMMS-ARCH.md`).
**The gap:** `fanout` still derives roles as `<task>-wN` — no prefix. Follow
every `fanout` call with, per worker:

```bash
herdr pane rename <id> "AGNT <headline>" && herdr pane report-metadata <id> \
  --source spine --display-agent "AGNT <headline>" --token role=3-AGNT \
  --token task="<headline>" --token name="<headline>"
```

For background work, wait for state before reading: `herdr agent wait <id>
--until working --timeout 30000`, then `--until done --timeout 120000` (or
`idle`), then `pane read <id> --source recent-unwrapped --lines 120`.
`blocked` needs input; `unknown` has no detected agent.

## Restart and liveness (husks)

A restart preserves workspace/tab/pane IDs and labels but NOT processes or
agent registrations. A restored pane with its old label and no registered
agent is a HUSK: `missing` (structurally gone), `dead` (shell, no agent),
`alive` (registered agent), `unreadable` (unexpected read) — a label is
never evidence of liveness. Replace a husk only when confidently dead:
verify the replacement before closing the old pane, never close a
workspace's last tab first.

Terminal ids are re-minted, `pane read` fails until they re-materialize, and
`agent_status` is retained metadata not detection — while agent-session ids
(e.g. a claude session id) ARE retained, enabling manual resume. Recovery is
rebuild, never automatic: an explicit operator action, then the coordinator
re-spawns from durable planes (Tower board/ledger, briefs on disk, `.done`
markers, git). `--token` pheromones evaporate on restart. The plugin-owned
agent view does NOT currently survive via `[[startup]]` — `herdr-plugin.toml`
carries no `[[startup]]` stanza (removed 2026-08-09) and live evidence from
that date shows the view was never reapplied. Correction to a claim inside
`~/herdr-spine/bin/spine-startup`'s own docstring (and `herdr-plugin.toml`'s
comments): both assert `RawPluginManifest` "declares no `startup` field" —
FALSE, verified this session by reading
`~/source/herdr/src/app/api/plugins/manifest.rs` directly: line 25 declares
`startup: Vec<RawPluginManifestStartup>` with `#[serde(default)]`, and
`PluginManifestStartup` is imported at line 3. The schema supports it; the
stanza is simply absent from the deployed toml, a config choice, not a
parser limitation — so re-adding `[[startup]]` may work at 0.8.0 (untested).
The live replacement in the meantime,
`~/herdr-spine/bin/handlers/15-restore-view`, reapplies the view via
`agent.view.set` on every `pane.agent_status_changed` event, so the
first event after a restart restores it.

## Coordinated fan-out contract (verified 2026-07-23)

Composes the `brief` skill (spec), the Tower board (comms), `.done` markers
(gating):

1. **Brief on disk** per worker — mission, pre-verified facts, file
   partition, done-when, report contract — plus a shared contract (touch
   only assigned files, never commit, no mocks, final action writes `.done`).
2. **Disjoint file partitions**, stated in every brief.
3. **Spawn as panes**, in a dedicated worker tab — invisible in Herdr means
   not happening. BUILD workers are never harness-internal subagents, however
   convenient worktree isolation is — run the pane's cwd inside the worktree
   for both; harness-internal subagents are for single-turn read-only work
   only (research, scout, verify). One tab per task (`herdr tab create
   --label <task>-workers --no-focus`), gridded (down then right), ~4 panes
   max, close each on finish. Headless (`claude -p`/`pi -p`) is the
   exception, only with output redirected to a log file, a `.done` marker,
   and a spawn-time CLAIM carrying the PID. Verify liveness with plain
   `pgrep -fl <pattern>` — never report a worker running without evidence.
4. **Comms** — see below; COMMS-ARCH.md is the law.
5. **Gate** — the spawner owns integration: read every `.done`, verify, commit. Workers never commit.

## Observability infra — where it lives, what it shows

- **`CTRL` fleet/project pane** — `bun ~/herdr-spine/bin/ctl-fleet` (machine
  plane: every agent-bearing pane by project + a WORK section from each
  project's `.madewell/`) or `--project <root>` (that project only). Spawn
  with `bun ~/herdr-spine/bin/ctl-fleet --spawn [workspace_id] [--project
  <root>]` — the only sanctioned placement: splits the `CORD` host pane in
  tab 1 at 0.62, `--no-focus`, renamed `CTRL fleet`/`CTRL <project>`. Always
  a SPLIT of tab 1, never an isolated tab. Display only.
- **`TOWR [project]` pane** — one per project workspace, read-only tail of
  that project's Tower board: `bun
  ~/agent-core/primitives/tools/statem/twr.ts <project-root>`. Renders
  TRANSITIONS/FINDINGS/OPEN QUESTIONS; writes nothing.
- **statem** — per-project Made Well tracker: `bun
  ~/agent-core/primitives/tools/statem/statem.ts <project-root>`. Derives
  outer stage/inner phase from `.madewell/`, appends one `finding` row per
  transition (topic `statem`), rewrites glyph-only tab titles via `herdr tab
  rename` — no phase/agent/task words (mapping
  `~/.tower/statem-tabs.json`). Full spawn recipe: statem README.

## Comms rules that bind every agent (COMMS-ARCH.md is the law)

One rule: every message has exactly one audience, reaches it exactly once,
in full. Four planes — STATUS (pane states + board `finding` lines,
pull-based, never mail), FLEET MAIL (agent→agent: briefs, CLAIMs, DONE
reports, addressed hierarchically up the CORD/ORCH/AGNT chain), OPERATOR
MAIL (only `to:"operator"` rows reach the operator — external credentials,
destructive-action approval), OPERATOR DIRECTIVES (through the coordinator
or directly into a pane, recorded on the board either way).

Status is not mail, status is not a toast. Notify only for task completion,
a genuine operator summons, or an alert — never AGNT/SAGT activity. Content
is contextual (role + human work name + outcome), never raw ids;
coalesce/drop anything within 60s of the prior notification from the same
source.

Tower topics are project-namespaced (`<project-slug>/<topic>`, e.g.
`future/c004`); bare topics (`statem`, `comms`, `fleet`) are machine-plane
infra only. Post with `tower send --from <you> --topic <t> --kind finding
"<body>"` — one CLI on PATH, every harness, no MCP and no file-append
fallback to reach for. The old MCP board tool's cwd-hygiene refusal
(rejecting scratch/temp) is not in the rebuilt bus — `primitives/tower/tower.mjs` has
no cwd check, so this is DOCTRINE only now, not enforced: post from your
real repo cwd by convention.

## Run an ordinary command in another pane

```bash
herdr pane split --current --direction right --no-focus
herdr pane run <id> "just test"
herdr pane wait-output <id> --match "test result" --timeout 120000
herdr pane read <id> --source recent-unwrapped --lines 120   # or: visible | recent | detection
```

Empty read unexpectedly? Retry with a much larger `--lines` before
concluding the pane is blank.

## Fleet operating notes

**Signal over polling.** Subscribe to `events.subscribe` over the raw
socket instead of polling `pane read`/`wait` on a loop — watch for
`pane.agent_status_changed` with `blocked` (needs a decision) or `done`
(unseen), and act on the push. If you need both current state and the
stream: subscribe FIRST, then reconcile from a snapshot, buffering events
that arrive mid-reconciliation. For one-shot waits, `herdr agent wait <id>
--until blocked --until done --timeout MS` is the bounded primitive. Reserve
`pane read` for content once an event flags a pane — never as discovery.

**Compose Herdr with Tower.** Herdr says WHICH pane changed; Tower carries
WHAT the agent needs, verbatim (COMMS-ARCH.md, not `tower-orchestration.md`,
is the comms law now). Brief every spawned agent to post to the board and
route questions up the hierarchy, not to the operator — a `blocked` pane
with no Tower message stalled silently, go read it. The bridge:
`~/herdr-spine` maps `pane.agent_status_changed` into board lines
(`10-notify`) and ledger questions (`40-tower-bridge`), fusing both planes
without polling. Surface to the human with `herdr notification show "orch
blocked" --body "needs a decision" --sound request` for genuine eyes-needed
moments; sending a prompt to ANY pane, idle included, can silently fail to
submit — the verify-submit step above is mandatory after every
prompt-carrying `pane run`.

**Ground the substrate before driving it.** Run `which <tool>` before
improvising from `--help`. Confirm `HERDR_ENV=1` before any control command. A blocked
agent's decision belongs to its spawner, up the chain — reserve the
operator for genuinely external prerequisites; batch every ambiguity to a
spawned orchestrator up front, then let it run.

## Safety and coordination rules

- Use `--no-focus` for background work unless switching context was asked for.
- Use `--current` or an explicit ID; never rely on another client's focus.
- Parse IDs from JSON responses, never sidebar order or examples.
- Inspect existing output before waiting for future output/state.
- Don't close workspaces/tabs/panes/sessions you didn't create unless asked.
- Mutation authority comes from create responses, not labels — only an ID
  YOUR OWN create/split call returned may be pruned/closed/rebound; a
  label-matched object is adopted and read-only (herdr doesn't enforce
  label uniqueness).
- Close panes focus-safely: record the active tab/pane first, never close
  the focused pane, restore prior focus after; on ambiguity, preserve.
- Isolated experiments go through `~/herdr-spine/bin/spine-lab` (named
  spine-lab-* sessions, guarded stop/delete, default-session tripwire) —
  never improvise lifecycle commands against ad-hoc session names.
- Never `herdr server stop` from an active session unless intending to stop
  it and all pane processes; never kill the main process — use spine-lab.

## References

- Human-facing guide: https://herdr.dev/agent-guide.md
- CLI reference: https://herdr.dev/docs/cli-reference/ · Socket API: https://herdr.dev/docs/socket-api/
- Upstream skill (authority for new commands): see `metadata.upstream` above.
- Codebase map for this install: `~/source/herdr-RETROFIT-MAP.md`.
