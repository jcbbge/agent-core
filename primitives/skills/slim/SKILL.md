---
name: slim
description: Six-verb output compactor (ls, ps, wc, df, git status, git log) that keeps shell output from eating the context window. Use whenever running those six commands directly, or when output would be long and formulaic. Truth law - child exit codes propagate, unparseable output passes raw, truncation is always marked.
---

# slim — output compactor

Binary: `~/.local/bin/slim` (source `~/agent-core/primitives/tools/slim/`, Zig).

## Verbs

```bash
slim ls [args...]         # compacted ls
slim ps [args...]         # compacted ps
slim wc [args...]
slim df [args...]
slim git status [args...]
slim git log [args...]
slim rewrite "<command>"  # hook mapper: prints rewritten command, exit 1 = no rewrite
```

## When to use

- Running any of the six verbs in an agent shell — prefer `slim <verb>` over the raw verb.
- Long directory listings, process tables, git status/log output.

## When NOT to use

- Pipes, compounds (`&&`, `;`), command substitution — slim refuses; run raw.
- Machine-format flags (`--porcelain`, `--format`, `--pretty`) — output must stay exact; run raw.
- Any command outside the six verbs.

## Guarantees

- Child exit codes propagate unchanged.
- Unparseable output passes through raw (never invented).
- Every truncation is marked inline.
