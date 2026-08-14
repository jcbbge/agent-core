# COMMS-ARCH-FACTUAL-PROOF — flock doctrine + verify-gate-bypass naming (T3, bounce)

Agent: AGNT comms-arch-factual-nq1 (coder)  
Worktree: `/Users/jrg/.cursor/worktrees/agent-core/wt-orch-bus-data-residuals`  
Branch: `tower/bus-data-residuals`  
Date: 2026-08-13

Re-applied factual flock/schema fixes onto CURRENT main COMMS-ARCH (318 lines, Plane 5 intact). Prior coder worktree forked before `b20f63a` and overwrote the whole file — rejected at ORCH Verify.

---

## 1. Append-lock language (Reading scoped + Board row schema)

**Path:** `primitives/mcps/tower/COMMS-ARCH.md`

### Before (L278–279)

```
Hand-append to `board.jsonl` is banned in docs; there is still no kernel
lock on the file itself (see Board row schema below).
```

### After (L278–279)

```
Hand-append to `board.jsonl` is banned in docs; sanctioned writes use
flocked `append()` in `tower-ledger.mjs` (see Board row schema below).
```

### Before (L291–293)

```
Append-only JSONL, one object per line, newline-terminated (`tower-ledger.mjs`
`append`). No file lock on append — concurrent writers may interleave lines;
cursor locks exist only for read cursors, not writes.
```

### After (L291–295)

```
Append-only JSONL, one object per line, newline-terminated (`tower-ledger.mjs`
`append`). Exclusive lock on the write path: `append()` uses `flock(2) LOCK_EX`
on the append fd (per-file lockfile fallback if FFI unavailable). Hand-append
and direct `appendFileSync` bypass that lock and remain banned for production
writers. Cursor locks (`*.cursor`) exist only for read cursors, not writes.
```

**Live source:** `primitives/hooks/tower-ledger.mjs` — `append()` opens fd, `flock(fd, LOCK_EX)`, `writeSync`, `flock(fd, LOCK_UN)`; lockfile fallback via `${file}.append.lock`.

---

## 2. Machine-emission kind naming

**Path:** `primitives/mcps/tower/COMMS-ARCH.md` §Board row schema table

### Before (L288)

```
| **Machine emission** | `kind` (e.g. lineage, bypass-audit) | ...
```

### After (L288)

```
| **Machine emission** | `kind` (e.g. lineage, verify-gate-bypass, bypass-audit) | ...
```

**Live emitter:** `cursor-shim/cursor-spine` appends `kind=verify-gate-bypass` via shell `printf` (see `~/cursor-shim/docs/inner-loop-verify.md`). Readers unchanged: `from ?? '?'`.

---

## 3. Plane 5 survival proof

```
$ rg -n 'Plane 5' primitives/mcps/tower/COMMS-ARCH.md
61:### Plane 5 — stigmergic coordination (mandatory scope)
```

Plane 5 section, Concierge exception, and nQ-on-field blocks left byte-stable (no edits in L61–155).

---

## 4. Stale-language absence proof

```
$ rg -n 'no kernel|No file lock' primitives/mcps/tower/COMMS-ARCH.md
(no matches)
```

---

## 5. Untouched

§JSONL consumer integrity (L297+) — skip-and-count, surface count, compaction deferred — left intact per brief.
