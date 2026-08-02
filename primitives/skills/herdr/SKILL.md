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

## Session targeting (verified 2026-07-30, herdr 0.7.5)

Every CLI call must reach the intended server through ONE of:

- `herdr --session <name> <cmd>` — explicit; correct.
- `HERDR_SOCKET_PATH=<session-socket>` — honored by the CLI and unambiguous
  per server; the authoritative route inside plugin context, where herdr
  injects it (this is how herdr-spine's handlers target their session).

`HERDR_SESSION=<name>` is NOT routing authority: at 0.7.5 it is silently
ignored and the call reaches the DEFAULT server (reproduced live:
`HERDR_SESSION=spine-lab-probe herdr workspace list` returned the default
session's workspaces). Never target by session-name env, and never assume an
ambient environment variable pointed a call at the right server.

## IDs and current context

Public IDs are short, stable, opaque handles: workspace `w1`, tab `w1:t1`, pane
`w1:p1`, terminal `term_...`. The suffix can grow beyond one character. Closed
IDs are not reused; a pane moved to another workspace gets a new ID. Re-read
create/split/move/list responses after mutations.

Pane IDs contain colons (`w1:t1:p1`), so any `<session>:<pane>`-style joined
encoding must split on the FIRST colon only when parsing back. Prefer
separate fields over joined strings wherever possible.

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

Corroborate non-busy readings before acting on them: `agent_status` can read
`idle` while the harness is still running a long foreground tool, because the
detector keys on the agent loop, not the tool. Before concluding a pane is
not working, check the rendered screen for a busy banner/spinner. The reverse
does not apply to input waits — a permission dialog shows no busy banner yet
correctly surfaces as `blocked`.

## Start an agent in a pane (the spawn loop)

Default to a sibling pane in the current tab and cwd. Do not create a workspace,
tab, worktree, or different cwd unless the user asked for that topology. Inspect
geometry, split without stealing focus, read the returned ID, label it, launch:

```bash
herdr pane layout --pane "$HERDR_PANE_ID"
herdr pane split --current --direction right --no-focus   # or: down
herdr pane rename <returned-pane-id> "orch-catalog"
herdr agent start pi --kind pi --pane <returned-pane-id>   # native: starts + waits for readiness
herdr agent prompt <returned-pane-id> "Review the current diff; report only actionable findings." --wait --until working --timeout 30000
```

Launch the agent by its plain executable (`pi`, `claude`, `codex`, `opencode`,
`omp`) so its interactive TUI opens. Do not pass the task as an argv prompt and do
not add non-interactive flags unless explicitly asked. For prompts, prefer
`herdr agent prompt <id> "<text>" --wait --until working --timeout 30000` — it
submits and confirms the state flip in one call (verified 0.7.5), so the call
itself is the delivery evidence. `herdr agent start <name> --kind pi --pane <id>`
is the native launcher — it starts the agent AND waits for interactive
readiness (run-verified 2026-08-02: pi detected, `interactive_ready: true`).
Precondition: the pane must already sit at an interactive shell prompt — a
freshly seeded pane can reject the call within the first second or two of its
life; retry after a beat. `pane run` (text + Enter together) remains the
fallback path — and it carries the verification duty below.

**DELIVERY IS NOT DELIVERY UNTIL VERIFIED (hard rule, 2026-07-27; updated
2026-07-30).** A prompt sent with `pane run` can sit in the agent's input box
as `[Pasted text #N]`, typed but never submitted — observed on an IDLE pane,
not just busy ones (a coordinator's gate ruling sat unsent while the fleet
looked stalled). The `agent prompt --wait` primary path above makes the flip
observation atomic; two nuances of it were verified live at 0.7.5:

- An `agent_prompt_stalled` error ("no observed state change … status is
  idle") is NOT proof of non-delivery: client-side inputs such as `/reload`
  execute without any state flip. Check the transcript before retrying — the
  command may already have run.
- Slash- and dollar-prefixed input executes natively through `agent prompt`
  (no completion-popup interference observed at 0.7.5). When driving a
  composer manually via `pane run` / `pane send-text` instead, settle briefly
  after the text before sending Enter so a popup cannot consume it.

After EVERY `pane run` that carries a prompt to an agent pane, run the
verify-submit step before reporting delivery or moving on:

```bash
sleep 2 && herdr pane get <id>        # agent_status must flip to working
# still idle/blocked? check for a buffered paste and force the submit:
herdr pane read <id> --source visible --lines 6 | grep -q "Pasted text" \
  && herdr pane send-keys <id> Enter && sleep 2 && herdr pane get <id>
```

Never report a prompt as delivered, an agent as tasked, or a fleet as launched on
the strength of `pane run` alone — status-flip (or an explicit forced Enter plus
status-flip) is the only evidence of submission.

For background work, wait for the terminal state before reading the transcript:

```bash
herdr agent wait <id> --until working --timeout 30000
herdr agent wait <id> --until done --timeout 120000   # or idle if the user is watching that tab
herdr pane read <id> --source recent-unwrapped --lines 120
```

If a wait times out, inspect `herdr pane get <id>` and `pane read` before acting.
`blocked` needs input; `unknown` has no detected/integrated agent yet.

## Restart and liveness (husks)

Stopping and restarting a herdr server preserves workspace, tab, and pane IDs
and their labels — but NOT the processes or agent registrations inside them.
After a restart, a restored pane showing its old label with no registered
agent is a HUSK. Classify before acting: structurally gone pane = `missing`;
restored pane with a shell but no registered agent = `dead`; registered agent
= `alive`; unexpected read = `unreadable`. Replace a husk only when
confidently dead: create and verify the replacement BEFORE closing the old
pane (never close a workspace's last tab first), and refuse to touch live or
unreadable panes. A label is never evidence of liveness.

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
   2026-07-23).** Workers run as Herdr panes so agent_status stays observable —
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
herdr pane wait-output <id> --match "test result" --timeout 120000
herdr pane read <id> --source recent-unwrapped --lines 120
```

Read sources: `visible` (viewport), `recent` (scrollback as rendered),
`recent-unwrapped` (soft-wraps joined — prefer for logs/transcripts), `detection`
(agent-detection snapshot). Use `--format ansi` only when color is evidence.
If a `pane read` returns empty unexpectedly, retry with a much larger
`--lines` (e.g. 200) and trim locally before concluding the pane is blank —
an upstream adapter documented small-N reads returning empty below the
viewport height; NOT reproduced on 0.7.5 in shell or live-TUI contexts
(verified 2026-07-30), but the retry is cheap insurance against a
geometry-dependent regression.

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
the fleet and act on the push. Ordering discipline for any consumer that needs
both current state AND the stream: SUBSCRIBE FIRST, then reconcile from a
snapshot, buffering events that arrive during reconciliation — subscribing
after the snapshot leaves a gap where a transition is lost between the two
reads. For one-shot waits, `herdr agent wait <id> --until blocked --until done
--timeout MS` is the bounded primitive (0.7.5 syntax; `herdr wait agent-status`
is gone). Reserve
`pane read` for reading CONTENT once an event says a pane needs you — never as a
discovery loop. Polling panes on a timer is the expensive anti-pattern: it burns
tokens and lags behind reality.

**Compose with Tower (lean into both).** Herdr tells you WHICH pane changed;
Tower carries WHAT the agent needs, verbatim, to the user. Brief every spawned
agent to post `progress`/`blocked`/`deliverable` to the Tower board and to route
questions to the coordinator, not the user. Then watch the board and the Herdr
event stream together. A `blocked` pane with no Tower message = an agent that
stalled without saying why; go read it. The ideal end-state is a Herdr plugin
(`herdr-plugin.toml` + event hooks) that bridges `pane.agent_status_changed ->
blocked` straight into Tower, so the two planes fuse.

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

## Safety and coordination rules

- Use `--no-focus` for background work unless the user asked to switch context.
- Use `--current` or an explicit ID; never rely on another client's focused pane.
- Parse IDs from JSON responses, never from sidebar order or examples.
- Inspect existing output before waiting for future output/state.
- Do not close workspaces/tabs/panes/sessions you did not create unless asked.
- Mutation authority comes from create responses, not labels. Only an ID
  returned by YOUR OWN create/split call may be pruned, closed, or rebound; an
  object matched by label is adopted and read-only (herdr does not enforce
  label uniqueness — two `herdr-spine` workspaces coexisted in the default
  session on 2026-07-30).
- Close panes focus-safely: record the exact active tab/pane first, never
  close the focused pane, restore the exact prior focus afterward; on any
  ambiguity, warn and preserve instead of closing.
- Isolated experiments go through `~/herdr-spine/bin/spine-lab` — named
  spine-lab-* sessions only, guarded stop/delete that re-queries the exact
  session row before acting, and a default-session topology tripwire. Never
  improvise lifecycle commands against ad-hoc session names.
- Never run `herdr server stop` from an active session unless the user intends to
  stop the server and all its pane processes. Never kill the main Herdr process;
  use spine-lab for isolated experiments.

## References

- Human-facing guide: https://herdr.dev/agent-guide.md
- CLI reference: https://herdr.dev/docs/cli-reference/ · Socket API: https://herdr.dev/docs/socket-api/
- Upstream skill (authority for new commands): see `metadata.upstream` above.
