---
name: herdr
description: >
  Control Herdr, this machine's control plane for coding agents: a terminal
  multiplexer/runtime that owns terminals server-side (panes survive crashes,
  detach, SSH drop), detects agent identity and status per pane, and exposes a
  CLI + socket API. Herdr is the canonical spawn substrate on this machine —
  use it proactively when orchestrating multiple parallel agents (a raw
  headless spawn recipe exists below as fallback only). Also use when the user
  mentions Herdr or asks to inspect/control panes, tabs, workspaces, or
  terminals. Pane-local control commands require HERDR_ENV=1; fleet observation
  and spawning work from any shell via the global server socket.
metadata:
  author: jrg
  version: "1.0"
  tags: herdr, multiplexer, orchestration, panes, ground-and-tower, coordinator
  upstream: https://raw.githubusercontent.com/ogulcancelik/herdr/master/SKILL.md
  gateway: strudel pantry (roots ~/.pi/agent + ~/agent-core/primitives)
---

# Herdr

Herdr is a terminal multiplexer and runtime for coding agents. A background
server owns real terminal processes; clients attach to render them. Panes keep
running after detach, terminal close, or SSH drop. Herdr detects agents inside
panes and reports each one's state, so a whole fleet is visible at once.

Before any control command, confirm you are inside a Herdr-managed pane:

```bash
test "${HERDR_ENV:-}" = 1
```

If the check fails, say you are not running inside Herdr and stop.

**Sandbox policy (standardized 2026-08-06).** Harness exec sandboxes can block
the control socket (`PermissionDenied`/`fetch failed` on
`~/.config/herdr/herdr.sock` — observed 2026-08-05 from a sandboxed
coordinator; other sessions' sandboxes allow it). Verify once per session with
`herdr api snapshot`; if it fails, rerun herdr control commands with the
sandbox disabled for those calls. That is the standard remedy — do not
relocate the coordinator to an unsandboxed pane and do not fall back to
polling files.

## Your topology: Coordinator > Orchestrator > Agents

Herdr has **four nouns and no hierarchy**: session, workspace, tab, pane, plus a
control socket. It knows nothing of coordinators, orchestrators, or agents — that
trinity is a discipline imposed by *who spawns whom*. Because every node is a real
terminal, every node is observable from every other node. The mapping for this
machine (root `~/`, every project a dir within it):

| Your concept | Herdr object | Rule |
|---|---|---|
| the machine / all work | session (default) | One background server; rarely name a second. |
| a project (`~/strudel`, `~/infinity/arc`) | workspace | `cd <project> && herdr`. Sidebar rolls agent state up per workspace. |
| the coordinator | tab 1, labelled `tower` | The persistent pane you talk to on entry. Not a Herdr primitive — just the first desk. |
| a task ("email-feature") | a tab | One per task. Orchestrator in the big pane; close the tab when shipped. |
| an orchestrator | the large pane in a task tab | Spawned by the coordinator. |
| agents / subagents | splits beside the orchestrator | Spawned by the orchestrator, in its own tab. |

Discipline that keeps the tree legible:
- The coordinator only creates task **tabs** and their orchestrator pane.
- An orchestrator only splits **its own tab** for agents.
- Rename every pane to its role — the name shows in the sidebar and on the split border.
- When two tasks touch the same code, back a task tab with a git worktree
  (`herdr worktree create`) so parallel agents do not collide.

**Composition with Tower:** Herdr is the *physical substrate* (where agents live,
how you see them). Tower (`tower-orchestration.md`) is the *message bus* (how
deliverables and questions reach the user verbatim). They stack: an agent in a
Herdr pane uses Tower to surface a blocking question; Herdr shows you which pane
is `blocked`; you click it.

## Learn the current CLI

The installed binary is the authority. Discover syntax with the command group
(never bare `herdr`, which launches the TUI; never probe a mutating nested
command by omitting args — some, like `workspace create`, run with defaults):

```bash
herdr --help
herdr pane            # workspace | tab | worktree | wait | agent | api ...
```

Most control commands print JSON. Read identifiers and state from those
responses; never construct an ID from a display number.

## IDs and current context

Public IDs are short, stable, opaque handles: workspace `w1`, tab `w1:t1`, pane
`w1:p1`, terminal `term_...`. The suffix can grow beyond one character. Closed
IDs are not reused; a pane moved to another workspace gets a new ID. Re-read
create/split/move/list responses after mutations.

Herdr injects the caller's context into every managed pane:

```bash
printf '%s\n' "$HERDR_WORKSPACE_ID" "$HERDR_TAB_ID" "$HERDR_PANE_ID"
```

Prefer `--current` when a command targets the calling pane. Omitting a target may
hit the UI-focused pane, which can belong to the user or another client.

Discover live state:

```bash
herdr workspace list
herdr tab list --workspace "$HERDR_WORKSPACE_ID"
herdr pane list --workspace "$HERDR_WORKSPACE_ID"
herdr api snapshot          # the entire tree — agents, states, geometry — as JSON
```

## Agent status

Pane records expose `agent`, `agent_status`, and session metadata. States:
`idle`, `working`, `blocked`, `done`, `unknown`.

`idle` and `done` are the same underlying state with different attention:
- `idle`: waiting, and its result is considered seen.
- `done`: finished, and its result has **not** been seen (background tab/workspace).

Focusing a pane, switching to its tab, or regaining outer-terminal focus marks it
seen, so `done` becomes `idle`. The sidebar is an attention queue, not a status
board.

## Start an agent in a pane (the spawn loop)

Default to a sibling pane in the current tab and cwd. Do not create a workspace,
tab, worktree, or different cwd unless the user asked for that topology. Inspect
geometry, split without stealing focus, read the returned ID, label it, launch:

```bash
herdr pane layout --pane "$HERDR_PANE_ID"
herdr pane split --current --direction right --no-focus   # or: down
herdr pane rename <returned-pane-id> "orch-catalog"
herdr pane run <returned-pane-id> "pi"                     # normal executable; interactive TUI
herdr pane get <returned-pane-id>
herdr wait agent-status <returned-pane-id> --status idle --timeout 30000
herdr pane run <returned-pane-id> "Review the current diff; report only actionable findings."
```

Launch the agent by its plain executable (`pi`, `claude`, `codex`, `opencode`,
`omp`) so its interactive TUI opens. Do not pass the task as an argv prompt and do
not add non-interactive flags unless explicitly asked. `pane run` sends text +
Enter together — use it for the first prompt and every follow-up.

**DELIVERY IS NOT DELIVERY UNTIL VERIFIED (hard rule, 2026-07-27).** A prompt sent
with `pane run` can sit in the agent's input box as `[Pasted text #N]`, typed but
never submitted — observed on an IDLE pane, not just busy ones (a coordinator's
gate ruling sat unsent while the fleet looked stalled). After EVERY `pane run`
that carries a prompt to an agent pane, run the verify-submit step before
reporting delivery or moving on:

```bash
sleep 2 && herdr pane get <id>        # agent_status must flip to working
# still idle/blocked? check for a buffered paste and force the submit:
herdr pane read <id> --source visible --lines 6 | grep -q "Pasted text" \
  && herdr pane send-keys <id> Enter && sleep 2 && herdr pane get <id>
```

Never report a prompt as delivered, an agent as tasked, or a fleet as launched on
the strength of `pane run` alone — status-flip (or an explicit forced Enter plus
status-flip) is the only evidence of submission.

At 0.7.5+ prefer the native primitives over the raw loop: `herdr agent start
<name> --kind <kind> --pane <id>` verifies interactive readiness (NAME must be
session-unique — use the role label; a fresh pane's shell needs a moment, so
retry on `agent_pane_busy`), and `herdr agent prompt <id> <text> --wait
--until working --timeout MS` is a native verified submit — it requires an
observed state change and returns `agent_prompt_stalled` instead of silently
buffering. One-command wrapper with all of this plus the Pasted-text fallback
and liveness evidence baked in: `~/herdr-spine/bin/spine-spawn
<orch|worker|fanout|prompt>` (doc: `~/herdr-spine/docs/spawn.md`, lab-verified
2026-08-06) — prefer it over hand-running the loop.

For background work, wait for the terminal state before reading the transcript:

```bash
herdr wait agent-status <id> --status working --timeout 30000
herdr wait agent-status <id> --status done --timeout 120000   # or idle if the user is watching that tab
herdr pane read <id> --source recent-unwrapped --lines 120
```

If a wait times out, inspect `herdr pane get <id>` and `pane read` before acting.
`blocked` needs input; `unknown` has no detected/integrated agent yet.

## Coordinated fan-out contract (verified 2026-07-23)

The pattern that ran a 3-worker parallel fan-out on this machine with zero
collisions (Circadian bulletproofing). Composes the `brief` skill (spec), the
Tower board (comms), and `.done` markers (completion gating):

1. **Brief on disk.** One markdown brief per worker — mission, pre-verified
   facts, file partition, done-when conditions, report contract — plus one
   shared worker contract (hard rules: touch only assigned files, never commit,
   no mocks, final action writes the `.done` file).
2. **Disjoint file partitions.** State the partition map in every brief;
   workers ignore anything outside their assigned list.
3. **Spawn — panes by default, in a dedicated worker tab (liveness doctrine,
   2026-07-23; ONE TRUTH PLANE, 2026-07-24).** If work is not visible in Herdr,
   it is not happening: BUILD workers are never harness-internal subagents
   (Agent tool), no matter how convenient the worktree isolation — run the pane
   with its cwd inside a worktree to get both visibility and isolation.
   Harness-internal subagents are for single-turn read-only work only
   (research, scout, verify). Workers run as Herdr panes so agent_status stays observable —
   an invisible-but-alive worker is indistinguishable from a dead one, which is
   how a whole wave once "ran" with zero observable footprint. Create ONE
   dedicated worker tab per task (`herdr tab create --label <task>-workers
   --no-focus`), lay workers out as a grid (split down first, then right), keep
   at most ~4 panes visible, and close each pane the moment its worker
   finishes. Never crowd the orchestrator's own tab into unreadable slivers.
   Headless (`claude -p` / `pi -p` fire-and-forget) is the EXCEPTION, allowed
   only with ALL of: stdout/stderr redirected to a per-worker log file, a
   `.done` marker as the final action, AND a spawn-time CLAIM post carrying the
   PID. After any spawn, verify liveness with `pgrep -fl <pattern>` — plain
   pgrep, never a filter/proxy grep chain (chained greps have produced false
   "nothing running" evidence) — and never report a worker as launched or
   running without that process- or pane-level evidence.
4. **Comms.** Workers append CLAIM and DONE lines to `~/.tower/board.jsonl` —
   file append works in every harness, no MCP required:
   `{"id","ts","cwd","type":"finding","from":"<worker>","topic":"<t>","body":"..."}`
   A worker's FIRST action is its CLAIM (pane id or PID included). Silence plus
   no pane/process activity for 10+ minutes = presumed dead; investigate, do
   not wait.
5. **Gate.** The coordinator owns integration: read every `.done`, run the
   verification suite personally, commit. Workers never commit.

Circadian composition is free: harness sessions spawned in panes load their own
config, so wake/graze/sleep fire per pane automatically (verified: three
headless pi workers were metabolized by the memory substrate the same day).

## Run an ordinary command in another pane

```bash
herdr pane split --current --direction right --no-focus
herdr pane run <id> "just test"
herdr wait output <id> --match "test result" --timeout 120000
herdr pane read <id> --source recent-unwrapped --lines 120
```

Read sources: `visible` (viewport), `recent` (scrollback as rendered),
`recent-unwrapped` (soft-wraps joined — prefer for logs/transcripts), `detection`
(agent-detection snapshot). Use `--format ansi` only when color is evidence.

## Fleet operating notes (composition, monitoring, gotchas)

Hard-won lessons for running a multi-agent fleet through Herdr as the coordinator.
They compose with the Tower message bus (see the `tower-orchestration` rule).

**Signal over polling — subscribe to events, do not read panes on a loop.** The
socket API streams state changes; subscribe instead of polling with repeated
`pane read`/`wait`. Over the raw socket:

```json
{"id":"sub1","method":"events.subscribe","params":{"subscriptions":[
  {"type":"pane.agent_status_changed","agent_status":"blocked"},
  {"type":"pane.agent_status_changed","agent_status":"done"}
]}}
```

The connection acks, then pushes an event whenever a matching pane changes. Watch
`blocked` (an agent needs a decision) and `done` (work finished, unseen) across
the fleet and act on the push. For one-shot waits, `herdr wait agent-status <id>
--status blocked|done|idle --timeout MS` is the bounded primitive. Reserve
`pane read` for reading CONTENT once an event says a pane needs you — never as a
discovery loop. Polling panes on a timer is the expensive anti-pattern: it burns
tokens and lags behind reality.

**Compose with Tower (lean into both).** Herdr tells you WHICH pane changed;
Tower carries WHAT the agent needs, verbatim, to the user. Brief every spawned
agent to post `progress`/`blocked`/`deliverable` to the Tower board and to route
questions to the coordinator, not the user. Then watch the board and the Herdr
event stream together. A `blocked` pane with no Tower message = an agent that
stalled without saying why; go read it. This bridge exists: the herdr-spine
plugin (`~/herdr-spine`) maps `pane.agent_status_changed` into Tower — board
lines + notifications (10-notify) and ledger questions/deliverables
(40-tower-bridge) — so the two planes fuse without any polling.

**Surface to the human with `notification.show`** when something genuinely needs
their eyes: `herdr notification show "orch blocked" --body "needs a decision"
--sound request`.

**Sending a prompt to ANY pane can silently fail to submit — idle panes
included (observed 2026-07-27).** `herdr pane run <id> "<text>"` types text +
Enter, but the text may sit buffered as `[Pasted text #N]`, unsent, regardless
of the target's state. The verify-submit step in "Start an agent in a pane" is
mandatory after every prompt-carrying `pane run`: status must flip to `working`,
else check the visible buffer for `Pasted text` and force `herdr pane send-keys
<id> Enter`. Never assume delivery.

**Ground the substrate before you drive it.** When a task involves an unfamiliar
tool or harness, FIRST read its installed skill and run `which <tool>` — do not
reverse-engineer from `--help` when the authoritative skill already exists (skills
live in `~/agent-core/primitives/skills/`). Confirm `HERDR_ENV=1` before any
control command. "Acquire before assert" applies to the environment, not just to
code.

**The coordinator resolves fleet questions.** A decision an agent raises is the
coordinator's to answer, not the user's — reserve the user for genuinely external
prerequisites (credentials, third-party access). Resolve against three tests:
does it lead to a 10x developer experience, a memorable and lovable user
experience, and an efficient, optimized agent experience? If yes, act; do not
escalate. Front-load questions: when you spawn an orchestrator, ask it up front
for every ambiguity in one batch, answer them all, then let it run to done.

## Restart and persistence doctrine (verified 2026-08-06, herdr 0.7.5)

What survives a server stop/start (or reboot), verified live in a lab session:
the session's TOPOLOGY — workspace/tab/pane records, IDs, role labels, and
each pane's agent-session mapping (e.g. a claude session id) — is restored on
the next server start. What does not survive: every pane PROCESS. Terminal ids
are re-minted, `pane read` fails until terminals re-materialize, and a
restored pane's `agent_status` is retained metadata, not detection — treat
every agent as DEAD after a server stop, whatever the sidebar claims.

Recovery is rebuild, not resume, and it is never automatic:
- Rebuild from the durable planes: Tower board/ledger/deliverables, briefs on
  disk, `.done` markers, git, herdr config + plugin registration. TTL tokens
  (`$task`/`$q`/`$claim` pheromones) evaporate by design; the plugin agent
  view is reapplied by spine-startup on server start (0.7.5+).
- Nothing may auto-respawn the server or re-launch agents. A server restart is
  an explicit operator action; the coordinator then re-spawns whatever the
  durable planes say was unfinished. Restored pane labels + agent-session ids
  are the map of what WAS running and make manual resume possible.

## Safety and coordination rules

- Use `--no-focus` for background work unless the user asked to switch context.
- Use `--current` or an explicit ID; never rely on another client's focused pane.
- Parse IDs from JSON responses, never from sidebar order or examples.
- Inspect existing output before waiting for future output/state.
- Do not close workspaces/tabs/panes/sessions you did not create unless asked.
- Never run `herdr server stop` from an active session unless the user intends to
  stop the server and all its pane processes. Never kill the main Herdr process;
  use a named test session for isolated experiments.

## References

- Human-facing guide: https://herdr.dev/agent-guide.md
- CLI reference: https://herdr.dev/docs/cli-reference/ · Socket API: https://herdr.dev/docs/socket-api/
- Upstream skill (authority for new commands): see `metadata.upstream` above.
