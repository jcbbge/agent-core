# Long-Running Processes — Etiquette (Hard Rules)

These rules exist because an agent ran `npm run dev` across sessions and never
tore it down — 28 orphaned `tsgo --watch` watchers, ~7.3 GB of leaked RAM,
surfaced only when the user noticed it in Activity Monitor. Non-negotiable.

## The one rule

**If you start it, you own its teardown.** A session MUST NOT end with a
process the agent started still running, unless the user explicitly asked for
it to persist. The agent that spawns is the agent that reaps.

## First question, always: does it need to be persistent?

Most of the time the answer is **no**, and the leak never happens because the
process never lived past one command. Reach for the one-shot form first:

| You want to… | Don't spin up a watcher. Do this one-shot: |
|---|---|
| Verify types after an edit | `tsc --noEmit` / `tsgo --noEmit` — runs once, exits |
| Verify a build | `npm run build` — runs once, exits |
| Run tests | `vitest run` / `jest --ci` — NOT `--watch` |
| Read recent logs | `tail -n 200 file.log` — NOT `tail -f` |
| Check a server responds | start it backgrounded, `curl` it, **kill it** (see below) |

A `--watch` / `-f` / dev-server is for a **human's interactive loop**. An agent
verifying a change almost never needs one. Default to one-shot.

## When you genuinely need it running (dev server, live-reload watcher, log trail)

Use the **harness-tracked** background mechanism — the Bash tool's
`run_in_background`. It is tracked and reaped when the session ends; it cannot
escape to `launchd`. Then tear it down explicitly the moment you're done.

**NEVER background a long-lived process with `&`, `nohup`, `disown`, or
`setsid` from a shell command.** Those detach it from the session — when the
session/terminal dies, the process reparents to `launchd` (PID 1) and runs
forever. That is exactly the orphaning that caused the leak.

### Lifecycle (every persistent process follows this)

1. **Announce** — tell the user what you're starting and that you'll tear it
   down: "Starting the dev server in the background; I'll kill it when done."
2. **Start** — via `run_in_background`. Capture the task/PID.
3. **Use** — poll/curl/read what you needed.
4. **Tear down** — kill it as soon as the task is complete, not "later."
   Kill the **process group**, not just the parent, or children orphan:
   ```bash
   # a wrapper that dies as a unit:
   ( trap 'kill 0' EXIT; npm run dev )
   # or for concurrently-based dev scripts, ensure --kill-others is set
   ```
5. **Verify gone** — `ps`-grep for what you started; confirm zero remain.

## Monitoring logs / telemetry

A log stream is just another long-running process — a bare `tail -f &` orphans
exactly like `npm run dev &`. Pick the mode by *why* you're watching:

### Mode A — Snapshot (default for an agent verifying something)
Don't stream. Read a window and exit.
```bash
tail -n 200 app.log
journalctl -u myservice -n 200 --no-pager
log show --last 10m --predicate 'subsystem == "com.x"'   # macOS
curl -s "$TELEM/metrics?window=5m"                        # last-N telemetry
```

### Mode B — Bounded watch (agent needs the output to decide THIS turn)
Only when the agent is waiting on a *specific* condition it must act on right
now (e.g. "did triggering the request log an error?"). Follow, but with a hard
self-terminating stop so it physically cannot leak:
```bash
timeout 120 tail -f app.log
```
Better in this harness: start the source via `run_in_background` and read its
streamed output incrementally, or use the `Monitor` tool to wait until the line
appears — then kill it the moment the condition is met.

### Mode C — Hand it to the human in their own terminal (PREFER THIS for open-ended watching)
If there is **no specific condition the agent must act on this turn** — "just
capture logs," "keep an eye out for an error," "let it run while I work" — the
agent should **NOT run it at all.** Holding an open-ended stream on the agent's
thread wastes resources while the agent waits on nothing.

Instead: give the exact copy-paste command and tell the user to **open a new
terminal window/tab and run it there.** The user owns the lifecycle; `Ctrl-C`
ends it; the agent stays free.

```text
Open a new terminal window and run:
    tail -f ~/myapp/logs/app.log
(Ctrl-C to stop when you're done — this runs in your terminal, not mine.)
```

**Determination — which mode:**
- Agent must read the output to choose its *next action this turn* → **Mode B** (bounded, self-terminating).
- Open-ended, for the user's eyes, or no particular thing being waited on → **Mode C** (hand off the command, new window).
- Just need recent history, not live → **Mode A** (snapshot).

When in doubt between B and C, prefer C — handing the user a command is always
safe; holding a stream is the thing that leaks.

## Before ending ANY session

If you started anything persistent, confirm it's dead before you wrap up:

```bash
# adjust the pattern to what you started
ps -Axo pid,args | grep -E '<thing you started>' | grep -v grep
```

If it's still there and the user didn't ask for it to stay, kill it. Don't
hand off a session with live orphans.

## If the user DID ask it to stay running

Then it's theirs, not a leak. Say so explicitly: "Leaving the dev server
running on :3000 as you asked — it will NOT be torn down at session end; stop
it with Ctrl-C in that terminal." Make the persistence a stated decision, never
an accident.
