---
name: starting-session
description: Context-aware session orientation. Detects root (meta/systems) vs project directory and surfaces the right context. Root = daemon health, recent decisions, inbox, handoff. Project = git state, handoff, focus.
license: MIT
metadata:
  author: jrg | claude
  version: "5.0"
  tags: productivity, context, git, workspace, development
---

# Starting Session

Context-aware orientation. One skill, two modes — detected automatically from working directory.

**Trigger patterns:** `/starting-session`, `/start-session`, "start session", "orient me", "where were we"

---

## Step 1: Detect Context

```bash
pwd
git rev-parse --show-toplevel 2>/dev/null || echo "NOT_GIT"
```

**Root/Meta mode** — if cwd is `/Users/jcbbge` OR git returns `NOT_GIT`
**Project mode** — if inside a git repo under a project directory

---

## Root / Meta Mode

Used when working at `/Users/jcbbge/` — systems development, agent-core, brain infrastructure, meta-programming.

### What to surface

Run in a single bash call:

```bash
# Stack health
curl -sf http://127.0.0.1:8002/health >/dev/null && echo "surreal: ok" || echo "surreal: DOWN"
curl -sf http://127.0.0.1:3098/health >/dev/null && echo "anima: ok" || echo "anima: DOWN"
curl -sf http://127.0.0.1:3099/health >/dev/null && echo "kotadb: ok" || echo "kotadb: DOWN"
curl -sf http://127.0.0.1:3097/health >/dev/null && echo "dev-brain: ok" || echo "dev-brain: DOWN"

# Primitive counts
echo "skills: $(ls ~/.claude/skills/ 2>/dev/null | wc -l | tr -d ' ')"
echo "rules:  $(ls ~/.claude/rules/*.md 2>/dev/null | wc -l | tr -d ' ')"

# Inbox
echo "inbox:  $(ls ~/Documents/metaprompts/_inbox/*.md 2>/dev/null | wc -l | tr -d ' ') captures pending"
```

Then read (separate calls):
- `~/Documents/_agents/decisions/INDEX.md` — last 3 ADRs (what was recently decided)
- `~/Documents/_agents/workspace/handoff-latest.md` — last session handoff

If any daemon shows DOWN: surface it prominently with the fix command.

### Output format

```
MODE: meta/systems
─────────────────────────────────────────
Stack: surreal ok · anima ok · kotadb ok · dev-brain ok
Primitives: N skills · N rules
Inbox: N captures pending

Recent decisions:
- ADR-00N: [title] (date)
- ADR-00N: [title] (date)

Last session: [date]
Completed: [key items]
Next: [top priority]
─────────────────────────────────────────
```

If a daemon is DOWN, add:
```
⚠ dev-brain DOWN — run: launchctl start com.jcbbge.dev-brain-mcp
```

---

## Project Mode

Used when working inside a project directory (git repo under `/Users/jcbbge/[project]/`).

### What to surface

```bash
git branch --show-current
git status --porcelain | head -10
git log --oneline -3
```

Then read: `[git-root]/workspace/handoff-latest.md` (if exists)

### Output format

```
MODE: project
Project: [repo name]   Branch: [branch]
─────────────────────────────────────────
Status: [clean / N files modified]
Recent commits: [last 2]

Last handoff:
  Completed: [items]
  Next: [items]
─────────────────────────────────────────
Focus: [top priority from handoff or NEXT_STEPS]
```

---

---

## On-Demand Startup Health Checks

Startup hooks have been removed from `SessionStart`. Health checks are now **on-demand tools** — fast, composable, callable any time.

### Available tools

| Command | Tool script | What it checks |
|---------|-------------|----------------|
| `/startup-check-surreal` | `~/.claude/tools/startup-checks/startup-check-surreal.sh` | SurrealDB reachable at port 8002 |
| `/startup-check-anima` | `~/.claude/tools/startup-checks/startup-check-anima.sh` | `anima bootstrap` (5s hard timeout) |
| `/startup-check-chain` | `~/.claude/tools/startup-checks/startup-check-chain.sh` | SurrealDB + all MCP servers + symlink sync |
| `/startup-check-all` | all three in sequence | Full stack health summary |

### How to invoke

Each tool is a bash script returning structured JSON:
```json
{
  "status": "ok" | "warning" | "error",
  "component": "surreal" | "anima" | "core-chain",
  "message": "...",
  "details": { ... }
}
```

To run all checks (invoke `/startup-check-all`):

```bash
bash ~/.claude/tools/startup-checks/startup-check-surreal.sh
bash ~/.claude/tools/startup-checks/startup-check-anima.sh
bash ~/.claude/tools/startup-checks/startup-check-chain.sh
```

When the user invokes `/startup-check-all` (or asks for a full health check), run all three scripts in a single Bash call and surface the results. If any status is `"error"` or `"warning"`, display the fix command from `details.fix` or `details.problems`.

### Why this changed

`anima bootstrap` was hanging for 63s on `SessionStart`, blocking all startup. Total startup blocking was ~71.5s. Removing the hooks drops session startup to <1s. Run checks on-demand instead.

---

## Speed Requirements

- Max 5 tool calls total (bash batch + 2 reads + optional health fix)
- Output under 30 lines
- No analysis — surface state only
- If daemon is DOWN, surface the fix command immediately — don't wait to be asked
