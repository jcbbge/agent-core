---
name: colgrep
description: Semantic grep — find code by meaning, not exact text. Use when the words in the query will not match identifiers (e.g. "error handling logic", "quote price lock"). Hybrid with -e for grep+semantic. Current working tree.
---

# colgrep — grep by meaning

Binary: `colgrep` on PATH (`~/.cargo/bin/colgrep`). Any harness. Indexes the working tree incrementally.

## When

- Natural-language lookup in the project you are standing in.
- The identifier is unknown; the job is known.

## When not

- You know the string or regex → `rg` / harness Grep.
- You know the symbol and need callers/impact → `coraline`.
- One huge PHP/JS/TS file → `bigfile`.
- Old sessions → `pickbrain`.

## How

```bash
colgrep "error handling logic"
colgrep "quote price lock" -e "price_lock"    # hybrid
```

Do not go through a search router. Call this binary.
