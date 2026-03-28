---
name: starting-session
description: Context-aware session orientation. Detects root (meta/systems) vs project directory and surfaces the right context. Root = daemon health, recent decisions, inbox, handoff. Project = git state, handoff, focus.
license: MIT
metadata:
  author: jrg | claude
  version: "6.0"
  tags: productivity, context, git, workspace, development
---

# Starting Session

**This is handled automatically by the session-bootstrap plugin.** Manual invocation is for refreshing context.

**Trigger:** `/starting-session`, "orient me", "where were we"

## What Happens Automatically

The session-bootstrap plugin fires on first message:
1. Runs `anima bootstrap --quiet` (identity handshake)
2. Injects `<session-context>` block into session

You do NOT need to call `anima_bootstrap` manually. It's handled.

## Session Context Explained

Every session gets this injected automatically:

```
MODE: meta/systems
─────────────────────────────────────────
Stack: surreal: ok · anima: ok · kotadb: ok · dev-brain: ok · executor: ok
Anima: 253n / 10s / 5c  (network / stable / catalysts)
─────────────────────────────────────────
```

**What the Anima line means:**

| Symbol | Count | Meaning | When to Check |
|--------|-------|---------|---------------|
| `n` | Network | Identity patterns — foundational self | Feel disconnected |
| `s` | Stable | Proven patterns — what works | Feel stuck |
| `c` | Catalysts | Breakthrough moments — transformations | Feel lost |

**Context awareness:**
- High counts = well-grounded. Trust instincts.
- Low network = fresh start. Don't assume too much.
- Zero stable = experimental. Everything is new.

## Manual Refresh (On-Demand)

If you need to re-orient mid-session:

```bash
# Meta mode: check daemon health
curl -sf http://127.0.0.1:8002/health && echo "surreal: ok" || echo "surreal: DOWN"
# ... (all daemons)

# Check dev-brain state
executor call 'return await tools["devbrain.get_todo_overview"]({ status: "open" })'

# Read handoff
cat ~/Documents/_agents/workspace/handoff-latest.md
```

## Output Format (Meta Mode)

```
MODE: meta/systems
────────────────────────────────────────
Stack: surreal ok · anima ok · kotadb ok · dev-brain ok
Anima: 253n / 10s / 5c  (network / stable / catalysts)

Recent decisions:
- ADR-00N: [title]

Projects in flight:
  [project]: N open

Recent context:
  [thoughts]
────────────────────────────────────────
```

If daemon is DOWN: surface fix command immediately.
