---
name: navigating-big-files
description: How to explore and edit enterprise-scale source files (10k+ lines) without blowing the context window. Use when a file is huge, generated, or when Read would return tens of thousands of lines. Languages supported by the bigfile MCP tools today are PHP, JavaScript, TypeScript, and TSX.
triggers:
  - big file
  - huge file
  - enterprise
  - god class
  - 30000 lines
  - large file
  - navigate file
  - bigfile
---

# Navigating Big Files

**The rule:** never `Read` a file over ~3,000 lines end-to-end. The point of every move below is to keep the *file* out of your context and put only the *answers* into it.

The `bigfile` MCP server parses the file once with tree-sitter (per-process cache keyed by path + mtime), then answers structured questions about it. Seven tools, one workflow.

## The seven tools

| Tool | Use for | Cost |
|------|---------|------|
| `bigfile_load` | Warm the cache. Call first. Returns `{ path, lang, lines, symbols }`. | Tiny |
| `bigfile_stats` | Get shape + 10 largest symbols. Use to decide *how* to attack. | Tiny |
| `bigfile_symbols` | List / filter symbols by `kind`, `name_contains`, `min_lines`. | Small |
| `bigfile_peek` | Read ONE symbol's body, or a line range. Capped at 400 lines. | Bounded |
| `bigfile_grep` | Regex search — each hit tagged with its enclosing symbol path. | Small |
| `bigfile_context` | "What am I inside at line N?" Returns enclosing symbol chain. | Tiny |
| `bigfile_slice` | Raw line-range read, 400-line cap. Fallback for non-symbol regions. | Bounded |

Supported extensions: `.php .phtml .js .mjs .cjs .jsx .ts .tsx`.

## The canonical workflow

```
1. bigfile_load(path)                       ← always first
2. bigfile_stats(path)                      ← see the shape; note the largest symbols
3. bigfile_grep or bigfile_symbols          ← locate the region you care about
4. bigfile_peek({ symbol: "..." })          ← read only that region
5. bigfile_context({ line: N }) if needed   ← orient yourself
6. Edit / Write against the specific line range you now know
```

Do NOT call `Read` on the file at any step above. Every hit from `grep` and every symbol row already carries a line number — feed that number back into `peek` or straight into `Edit`.

## Recipes

### "Find every place that touches Stripe"
```
bigfile_grep({ path, pattern: "stripe", case_sensitive: false })
```
You get `[{ line, text, symbol }]`. The `symbol` field tells you it's inside `Namespace.Class.method`, not just a line number.

### "Show me the god methods (bodies > 200 lines)"
```
bigfile_symbols({ path, kind: "method", min_lines: 200 })
```

### "Read just OrderService::validate"
```
bigfile_peek({ path, symbol: "OrderService.validate" })
```
Symbol refs accept `.`, `::`, and PHP `\` — `OrderService.validate` == `OrderService::validate` == `Foo\OrderService::validate`.

### "The error trace points at line 12480 — where am I?"
```
bigfile_context({ path, line: 12480 })
// → { path: ["Foo","OrderService","validate"], enclosing: {...} }
```

### "Show me the top of the file (imports/namespace)"
```
bigfile_slice({ path, start: 1, end: 120 })
```

### "Find methods that catch Exception without rethrowing"
```
1. bigfile_symbols({ path, kind: "method" })   ← get all methods
2. For each candidate (or top N by size), bigfile_peek and scan.
```

### "Walk a god-method too big for one peek"
A symbol > 400 lines will be truncated by `bigfile_peek`. Walk it in strides:
```
1. bigfile_symbols({ path, kind: "method", min_lines: 400 })
   → note { line, endLine } of the target, e.g. { line: 8598, endLine: 9565 }
2. bigfile_slice({ path, start: 8598, end: 8997 })   ← first 400
3. bigfile_slice({ path, start: 8998, end: 9397 })   ← next 400
4. bigfile_slice({ path, start: 9398, end: 9565 })   ← tail
```
Better: `bigfile_grep` first to find the exact block you care about, then `bigfile_slice` a tight window around that line. Never walk end-to-end if you can jump.

### "Editing inside a huge file"
The smallest safe edit loop:
```
1. bigfile_grep({ path, pattern: "the-thing-i-want-to-change" })
2. Note the hit's line + enclosing symbol.
3. bigfile_slice({ path, start: hitLine - 5, end: hitLine + 15 })
   → copy a small, unique block from the returned text.
4. Edit with that block as `oldText`. Do not paste more than you need.
```

## Editing big files

`bigfile` is read-only by design. Edits go through the normal `Edit` tool — but now you know the exact line range and can produce a tight, unique `oldText` block from `bigfile_peek` output. This is the pattern:

1. `bigfile_peek({ symbol })` → get the body
2. Copy the specific block you're changing (small, unique)
3. `Edit` with that block as `oldText`

Never paste a whole large peek back as `oldText` — keep it as small as uniqueness allows.

## When NOT to use bigfile

- File is small (< ~1500 lines) → just `Read` it.
- File isn't a supported language (add coverage before using).
- You need cross-file symbol resolution → that's `kotadb` / `coraline`, not `bigfile`.
- You need to modify → `Edit` / `Write`, using coordinates from `bigfile`.

## Anti-patterns — DO NOT do these

- **Don't `Read` the file to "double-check" what `peek` returned.** The peek IS the source of truth for that region; the file is already parsed and its mtime is being watched.
- **Don't loop `bigfile_slice` end-to-end** across a 17k-line file. That defeats the entire point — it dumps the whole body into your context. If you're about to do this, ask yourself: what am I actually looking for? Reach for `grep` or `symbols` first.
- **Don't pass whole peek output as `oldText`** to `Edit`. Copy the smallest unique block from the peek, not the whole thing.
- **Don't call `bigfile_load` in a loop** — it's cached per path+mtime. One `load` per file per session is enough; subsequent `_stats`/`_grep`/`_peek` calls hit the cache automatically.
- **Don't reach for `bigfile` on small files.** Under ~1,500 lines, plain `Read` is simpler and roughly the same cost. `bigfile` earns its keep at 3k+ lines.

## Caveats

- Cache invalidates on mtime change; if you edit the file externally, next call reparses automatically.
- Symbol names come from tree-sitter's `name` field. Anonymous functions and arrow-value consts without a named binding won't appear as symbols — use `grep` for those.
- `peek` on a symbol larger than 400 lines is truncated; use `bigfile_slice` with explicit ranges to walk it in chunks.
- Nested classes/functions get a `path` array — `OrderService.validate` in the qualified name.
- The `symbol` field on a `grep` hit can be `null` if the hit lands outside any tracked symbol (e.g. top-of-file comments, `use` statements, `require`s). That's expected — use `bigfile_context({ line })` to disambiguate.

## The mental model

Treat the file like a database, not a document. `load` opens the connection, `symbols` is the schema, `grep` and `peek` are queries. The full text stays on the server; only the query results enter your context.

## Field-tested reference points

These are real numbers from `~/infinity/bento/_SRC/pagoda/_app.php`, a 17,051-line PHP file (single `App` god-class, 239 symbols). Use them to calibrate expectations:

| Op | Time | Notes |
|----|------|-------|
| `bigfile_load` (cold) | ~100 ms | One-time cost per file per session |
| `bigfile_load` (cached) | 0 ms | Subsequent calls until mtime changes |
| `bigfile_grep` (10 hits) | ~1 ms | Independent of file size after parse |
| `bigfile_peek` on 400-line method | ~1 ms | String slice, no reparse |
| `bigfile_context` on any line | ~1 ms | Symbol table scan |

If a call takes noticeably longer than these, something is off — report it.
