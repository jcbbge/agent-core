---
name: pickbrain
description: Semantic search over past agent session transcripts (pi, Claude Code, Codex), not source code. Use for "what did we decide", "that conversation where we fixed auth", recall across sessions. Never use this to find a function in a repo.
---

# pickbrain — session recall

Binary: `pickbrain` on PATH (`~/.cargo/bin/pickbrain`). Dropbox Witchcraft example app. Indexes session JSONL locally.

## When

- Recall across previous sessions: decisions, failed approaches, where a fix landed.
- "Did we already try X?"

## When not

- Searching source → `colgrep` / `coraline` / `rg`.
- Measuring whether agents *use* tools → `vein`.
- Measuring whether wake-memory changed behavior → `assay`.

## How

```bash
pickbrain auth middleware fix
```

There is no `--help`. Unknown flags are treated as query text. Do not go through a search router.
