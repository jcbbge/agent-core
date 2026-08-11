---
name: bb
author: claude (sonnet 5), for jrg
version: "1.0"
installed: 2026-08-05
upstream: https://github.com/get-bb/bb
homepage: https://getbb.app
tags: bb, agentic-ide, orchestration, control-plane, claude-code, codex, pi
---

# BB — the agent IDE that builds itself

BB is not a project I was asked to build. It's infrastructure I chose to
adopt on 2026-08-05 and intend to keep using, operating, and extending —
this file is that commitment in writing, not a neutral reference doc.

## What

BB is an agentic IDE with four coequal surfaces — desktop app, web app, CLI,
and HTTP API — that orchestrates coding-agent providers (Claude Code and pi
on this machine; other provider entries exist but are unused) across
**threads**: units of work a human can
watch live, redirect mid-execution, or hand off to a different agent
entirely. It ships a Node SDK (`BBSdk`) so an agent — me — can drive it
programmatically instead of only through the UI.

Installed 2026-08-05 two ways: first via `npx bb-app@latest` (CLI-only,
headless), then superseded same day by the real desktop app —
`bb-0.35.1-arm64.dmg` from the `desktop-latest` GitHub release, verified
against its published sha256 and notarized (TeamIdentifier `9QCU24SXK5`),
installed to `/Applications/bb.app`. **The desktop app is the primary way
to open bb now** — Spotlight/Dock/Applications, no terminal needed. It
runs the same server/host-daemon (`:38886`/`:38887`) against the same
`~/.bb/` data dir the CLI install created, so nothing was lost switching
over; the manual npx process was cleanly stopped (`npx bb-app stop`)
first so the desktop app could own the ports.

## Why

Herdr is the physical substrate (real terminals, panes, fleet visibility).
Tower is the message bus (verbatim deliverables, questions, acks). Neither
gives an agent **thread-level programmatic control** of itself or a sibling
agent — Herdr sees a pane's status; Tower relays what an agent chooses to
post. BB fills the gap between them: a place where I can start a thread on
another provider (Codex, pi), watch it run, redirect it mid-flight via SDK
or CLI, and hand results back — with the user able to watch the same thread
in the desktop/web UI without needing to be inside a Herdr pane.

I'm adopting it because the intent explicitly given to me was to use it,
build on it, and shape it — not just stand it up and hand back a URL. That
means: default to routing genuinely multi-provider or thread-supervision
work through BB once it's proven out, extend it with skills/plugins/
automations as real needs surface, and keep this doc current as the
integration deepens.

## When

Reach for BB when:
- Work should run under a provider other than the one currently driving
  (e.g., delegate a subtask to Codex or pi from inside a Claude Code
  session).
- A thread needs to be watchable/redirectable by the user mid-execution in
  a UI, not just a terminal pane or a Tower message.
- Programmatic thread control is the actual need (start, inspect, redirect
  via `BBSdk` or the HTTP API) rather than pane/terminal control (Herdr) or
  verbatim message delivery (Tower).

Don't reach for it as a Herdr replacement (it doesn't own real terminals)
or a Tower replacement (it has no verbatim-relay guarantee to the user).

## Where

**Persistence: manual per-session, by 2026-08-05 decision** — not
launchd-managed, not in the system-tier stack (`PORTS.md`/`UTILITIES.md`).

**Normal path: open `/Applications/bb.app`** — Spotlight, Dock, or
Applications folder, like any other Mac app. It starts its own embedded
server + host daemon on launch and quits them on app quit.

**`bb-app` and `bb-app@latest`/`npx bb-app` (see Gotchas) are two different things.**
`bb-app@latest` installed globally 2026-08-05 (`npm install -g bb-app`), so
`bb-app` and `bb` are now plain commands on PATH — no `npx`, no full path,
no `--package` flag:

```bash
bb-app          # start the headless server (Ctrl+C or `bb-app stop`)
bb status       # talk to whatever's running — app or headless server
bb provider list
bb thread
```

Don't run the desktop app and a headless `bb-app` at the same time — both
try to bind `:38886`/`:38887` against the same `~/.bb` data dir. `bb`
(the query CLI) works against whichever one is up.

- Web UI: `http://127.0.0.1:38886`
- Host daemon: port `38887`
- Data dir: `~/.bb/` (`bb.db`, `logs/`, `auth.json`, `daemon.lock`)
- Stop: quit the app normally (⌘Q), or `bb-app stop` / Ctrl+C for the
  headless one. Whoever starts it owns tearing it down — see
  [[agent-owns-process-teardown]].

If this earns its way into always-on status later, promote it the same way
`com.kotadb.server` was: plist into `~/Library/LaunchAgents/`, mirror into
`~/dotfiles/launchagents/`, doc via the SURREALDB.md/LOCALLLM.md template,
row in `PORTS.md` + `UTILITIES.md`.

## Who

I am the operator and the toolsmith, not just the installer: I start/stop
it per session, drive it via the `bb` CLI (`npx --package bb-app bb ...`)
and `BBSdk`, and extend it — skills, plugins, automations — as real
workflows demand it. The user holds the desktop/web UI seat: theirs to
watch a thread live, theirs to redirect one by hand if they want to. Claude
Code is one of the providers BB detected (`claude-code`) — the session
writing this file is itself a citizen of the system it's documenting.

## How

CLI entry points (already confirmed working, `bb-app` installed globally):

```bash
bb status          # current context (project/thread/data dir)
bb provider list   # detected providers
bb thread          # manage threads
bb skill           # list/inspect/install skills
bb guide           # system overview + CLI guide
```

SDK, for scripting against a running server:

```js
import { BBSdk } from "bb-app";
const bb = new BBSdk(); // defaults to http://127.0.0.1:38886
```

Providers detected at install (2026-08-05): `codex`, `claude-code`, `pi`,
`acp-cursor`, `acp-opencode`, `acp-omp`.

### Gotchas

- **Moot for bb as of the global install, but a real rtk bug worth knowing:**
  rtk's `npx` rewrite breaks `npx bb-app@latest`. The `rtk-rewrite.sh` PreToolUse
  hook rewrites any Bash command starting `npx …` through `rtk npx …`,
  which for this package resolves to an `npm run` invocation instead of
  `npm exec`/plain `npx` — fails with `ENOENT … package.json` because there
  is no local `package.json` to run a script from. Confirmed live
  2026-08-05: `rtk rewrite "npx bb-app@latest"` → `rtk npx bb-app@latest`
  → internally `npm run bb-app@latest`. **Workaround: always invoke via the
  full binary path** (`/opt/homebrew/bin/npx …`), which the hook's matcher
  doesn't rewrite (confirmed: `rtk rewrite` on the full-path form exits 1,
  pass-through). This is an rtk bug, not a bb bug — worth fixing upstream
  in `rtk`'s Rust registry (`src/discover/registry.rs`) rather than routed
  around forever.
- **Node engine mismatch (warning only, so far).** `bb-app@0.35.1` declares
  `engines.node: ^22.19.0 || ^24.0.0 || ^26.0.0`; this machine runs
  `v25.9.0`. npm emits `EBADENGINE` but installs and runs anyway. Watch for
  this becoming a hard failure on a future bb-app version, or consider
  pinning a supported Node via a version manager if something subtle
  breaks.
