# A2 — Ground manifest shape (exhaust + coverage)

**Status:** CO-SIGNED with CORD cursor-shim (2026-08-14). §5 matrix amended (absent≠refuse).  
**Producer:** CORD Tower (comms/doctrine). **Consumer:** CORD cursor-shim (freshness gate).  
**Law:** `deps` is NEVER hand-authored — it is exhaust from `/ground` compulsory reads.  
**Date:** 2026-08-14. Field topic: `tower/manifest-and-alarms`.

SOURCES: `briefs/A1-A2-A8-manifest-and-alarms.md`; `research/peer-ignition-decision-brief.md` §A2–A3;
`cursor-shim/docs/inner-loop-verify.md` §3 `.authored` marker; live hook surfaces
`~/.claude/settings.json` PostToolUse `*`; `~/.cursor/hooks.json` (sessionStart / preToolUse Shell only /
sessionEnd / preCompact).

---

## 1. Design invariants (non-negotiable)

1. **Exhaust, not declaration.** The block is emitted by a hook that observes what
   grounding already read. No agent fills in a form. A hand-authored `deps:` is
   `tax.jsonl` with more ceremony (0 bytes for a month).
2. **Coverage is mandatory.** A graph that hides holes is worse than no graph —
   downstream A3 would trust a lie. Record what was observed **and** how complete
   the observation was.
3. **Fail closed on staleness; fail visible on incompleteness** (A3 contract).
   Incomplete coverage → flag, never a spawn refusal by itself.
4. **Harness asymmetry is explicit.** CC PostToolUse `*` can see Bash after the fact.
   Cursor has **no PostToolUse** and only Shell on preToolUse — capture is pre-call and
   weaker. Do **not** write one "cursor-first" policy for A2 exhaust and A5 batch record
   (they point opposite directions).
5. **Shell is the real read path.** Tonight's grounding ran through `wc`, `git`, `grep`,
   `python3`, `curl`. Tool-level Read hooks alone will miss the facts that overturn theses.
   Coverage must admit shell-lossy observation.

---

## 2. On-disk artifact (where it lives)

Mirror the shim marker geometry so A3's walker has one mental model:

```
<project>/.madewell/ground/<cycle-or-unit-key>/deps.json
```

Optional human twin (same directory): `deps.md` rendered from JSON for cold reading.
Spawned briefs **embed or link** the block (path + content hash) — presence is what A3
checks first.

Schema version field: `schema: ground-manifest/v1`.

---

## 3. Machine schema (`deps.json`)

```json
{
  "schema": "ground-manifest/v1",
  "ts": "2026-08-14T01:00:00.000Z",
  "cwd": "/absolute/project",
  "cycle_or_unit": "opaque-key-or-brief-path",
  "harness": "claude-code|cursor|pi",
  "emitter": "grounding-hook-exhaust@<rev>",
  "deps": [
    {
      "path": "relative/or/absolute/file",
      "ref": "git-sha-or-null",
      "mtime": "ISO-8601-or-null",
      "verdict": "BUILT|PARTIAL|NET-NEW|UNKNOWN",
      "via": "read|write|bash-parse|declared-fallback"
    }
  ],
  "coverage": {
    "mode": "full|partial|shell-lossy|unknown",
    "observed_tool_calls": 0,
    "observed_with_path": 0,
    "shell_calls": 0,
    "shell_paths_extracted": 0,
    "unaudited_shell_calls": 0,
    "notes": "human-readable one-liner on holes"
  }
}
```

### Field rules

| Field | Rule |
|---|---|
| `deps[].path` | Required when known. Omit entry rather than invent a path. |
| `deps[].ref` | `git rev-parse HEAD:path` when in a git repo; else null. |
| `deps[].mtime` | Filesystem mtime ISO; else null. |
| `deps[].verdict` | From `/ground` synthesis Step 3 — BUILT / PARTIAL / NET-NEW / UNKNOWN. Exhaust hook may leave UNKNOWN; synthesis fills. |
| `deps[].via` | How the path entered the set. `bash-parse` is always provisional. |
| `coverage.mode` | `full` only if every tool call that could touch files yielded paths (rare on cursor). Default honest value on shell-heavy sessions: `shell-lossy`. |
| `coverage.unaudited_shell_calls` | Count of Bash/Shell invocations where no path could be extracted. **Must be >0 when shell was used and paths missing** — never silently zero. |

---

## 4. Exhaust producers (per harness)

| Harness | Capture surface | Strength | Notes |
|---|---|---|---|
| Claude Code | Existing `PostToolUse` matcher `*` → extend `grounding-hook.mjs post` | Strong | Sees Bash after execution; still lossy for which files Bash touched |
| Cursor | `preToolUse` matcher `Shell` (+ Read/Edit/Write if matchers added later) | Weak | Pre-call only; no PostToolUse. Prefer logging argv intent + best-effort path tokens |
| pi | `grounding-hook.ts` | Medium | Mirror CC semantics |

**Fence:** A2 exhaust ships **CC-strong / cursor-honest**, not "cursor-first." A5 batch record remains cursor-first (separate fence).

---

## 5. What A3 (cursor-shim) may assume

**CO-SIGNED 2026-08-14** with CORD cursor-shim (board `cli-098a9c38-d9c7-4c57-9045-a7c885237e36`).
Operator brief `A3-A5-the-door.md` binds the absent≠refuse delta.

| Condition | Gate |
|---|---|
| Manifest **absent** or `deps` empty | **Fail VISIBLE** (warn/flag stderr + board note) — do **NOT** refuse. Shell-heavy grounding makes tool-level exhaust incomplete; absent-blocks would refuse constantly and pass false-complete graphs. |
| Manifest **present**, any `deps[].ref`/`mtime` stale vs reality | **REFUSE** spawn (fail closed) |
| Manifest present, `coverage.mode` in {`partial`,`shell-lossy`,`unknown`} OR `unaudited_shell_calls > 0` | **Visible flag only**, never refusal |
| Malformed schema (missing `schema` / wrong version) | **REFUSE** as malformed (distinct from absent) |

Break-glass: `CURSOR_FRESHNESS_GATE=off`, loud, audited with `from` (same mechanism as `CURSOR_VERIFY_GATE`).

Walker compares against current tree. A3 builds against this matrix only.

---

## 6. Co-sign record

Accepted by CORD cursor-shim: path `.madewell/ground/<key>/deps.json` (not under `.verify/`); verdict enum; schema `ground-manifest/v1`; coverage mandatory; CC-strong / cursor-honest fence. Delta on §5 applied above.

---

## 7. Tower ownership next (after co-sign)

- Doctrine: add Ground Manifest section to `COMMS-ARCH.md` or a sibling `GROUND-MANIFEST.md` under `primitives/mcps/tower/` (canonical; deploy via symlink pattern if executed).
- CC: extend `grounding-hook.mjs` to append exhaust → `deps.json` (implementation ORCH after co-sign).
- Cursor exhaust: coordinate with cursor-shim for preToolUse Shell path logging (their seat or shared).
