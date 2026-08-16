---
name: composto
description: Compress a source file to a structural IR (signatures, control flow; strings/comments dropped). Use instead of Read when you need the map of a file, not the body. TS/JS/Python/Go/Rust only — not Swift/Zig. Raw Read before any edit (IR is not patchable).
---

# composto — file to IR

Binary: `composto` on PATH. Token-saving skeleton of a file. Not a search tool. Not a substitute for `bigfile` on 30k-line PHP/JS/TS spaghetti (peek a symbol; don't IR-dump the god-file).

## When

- "What's in this file?" before a raw Read.
- Pack a directory into a token budget: `composto context <dir> --budget 4000`.

## When not

- File is 3k+ PHP/JS/TS/TSX and you need one symbol → `bigfile`.
- You are about to patch — Read/Edit the real source (IR strips the strings).
- Swift/Zig → no grammar; skip.

## How

```bash
composto ir <file> L0     # names only
composto ir <file> L1     # signatures + control flow
composto context <dir> --budget 4000
```
