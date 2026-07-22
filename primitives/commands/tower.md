---
description: Tower orchestration — fleet inbox, open questions, blackboard, subagent coordination
argument-hint: "[status|inbox|board|burn]"
---

# Tower Orchestration

Fleet message bus for multi-agent coordination. Shows pending messages, open questions, blackboard state, and token burn.

```!
bun ~/.tower/cli.mjs ${ARGUMENTS:-status}
```

## Arguments

| Arg | What it does |
|-----|--------------|
| `status` | Counts + pending items for current project (default) |
| `inbox` | Full pending messages/questions, verbatim |
| `board` | Blackboard entries for current project |
| `burn` | Fleet token burn (today, by session) |

## After Running

1. **Unrelayed messages (`!` lines)**: Relay each one to the user **VERBATIM** — full content, attributed ("from <agent> at <time>"), no summarizing. Then call `tower.mark_relayed` with the ids.

2. **Open questions (`?` lines)**: Surface each verbatim and ask the user to answer. When they do, call `tower.reply` with the question id and their answer.

3. **Board claims/findings**: Summarize anything load-bearing for current work.

4. **Nothing pending**: Say "Tower clear." and stop.

## Related Primitives

| Type | Name | Purpose |
|------|------|---------|
| Rule | `tower-orchestration` | Full protocol for orchestrators and subagents |
| MCP Server | `~/.tower/server.mjs` | The actual message bus |

## Project Namespacing

Tower stores all data centrally at `~/.tower/` but namespaces by working directory. Each project sees only its own messages, questions, and board entries.

## MCP Tools

| Tool | Purpose |
|------|---------|
| `send_to_user` | Surface message to user (deliverable/alert/progress) |
| `ask_user` | Ask user a question mid-run |
| `reply` | Record user's answer to open question |
| `check_inbox` | Poll for answers |
| `mark_relayed` | Acknowledge messages after relaying |
| `board_post` | Claim file ownership, share findings |
| `board_read` | Check peer claims before editing |
