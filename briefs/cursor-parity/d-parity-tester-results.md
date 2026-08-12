# Unit D — Three-harness parity tester results

> From: agnt-d-parity-tester (w2B:pY), 2026-08-12. TESTER role — run only, no fixes.

## Provenance (session baseline)

```
2026-08-12T20:31:30Z
/Users/jrg/agent-core
2efbe0827226f73099c76cd89ff1257e82b4f434
4ad428587b919c1b923c32182ac9a12631fc4fb8
```

---

## 1. 17-A Tools (harness-agnostic CLIs)

| ID | Check | Result | Evidence |
|---|---|---|---|
| A1 | `slim --help` | PASS | exit 0; usage prints |
| A2 | slim virgin-cache `zig build test` | PASS | exit 0; SKIP count 0 |
| A3 | `latch --help` | PASS | exit 0 |
| A4 | `vein --help` | PASS | exit 0 |
| A5 | assay on PATH | **FAIL** | `which assay` → not found; `~/.local/bin/assay` missing. Built binary exists at `primitives/tools/assay/zig-out/bin/assay`; `./zig-out/bin/assay --help` exit 0. **[UNKNOWN — needs input: assay install location]** |
| A6-slim | README quickstart | PASS | `slim --version` → `slim 1.0.0` exit 0; `slim rewrite "ls"` exit 0 |
| A6-latch | README quickstart | PASS | `latch --help` exit 0 (verbs documented in README) |
| A6-vein | README quickstart | PASS | `vein --help` exit 0; `zig build test` exit 0 |
| A6-assay | README quickstart | PARTIAL | `zig build` + `zig build test` exit 0; `assay --help` only via `zig-out/bin/assay`, not PATH |
| D-cursor | bigfile MCP load+stats | PASS | `bigfile_load` + `bigfile_stats` on 11822-line `index.d.ts`: lines=11822, symbols=1490 |
| D-pi | super-search smoke | PASS | `bun .../search.ts "slim compactor" --limit 3` exit 0, results returned |

### A2 command tail

```
cd ~/agent-core/primitives/tools/slim && rm -rf .zig-cache zig-out && zig build test
EXIT: 0
SKIP count: 0
```

### A5 command tail

```
which slim latch vein assay
/Users/jrg/.local/bin/slim
/Users/jrg/.local/bin/latch
/Users/jrg/.local/bin/vein
assay not found
ls: /Users/jrg/.local/bin/assay: No such file or directory
```

---

## 2. 17-B Skills x3

| Harness | status | stale | missing | Result |
|---|---|---|---|---|
| pi | 47 ok | 0 | 0 | PASS |
| claude-code | 58 ok | 0 | 0 | PASS |
| cursor | 58 ok | 0 | 0 | PASS |
| **global** | **163 ok** | **0** | **0** | PASS |

### Spot-check (slim, latch, herdr) — regular files + byte-identical to store

All 9 cells (3 skills x 3 harnesses): `test ! -L` on SKILL.md and parent dir PASS; `diff -q` vs `primitives/skills/<name>/SKILL.md` — no output (identical).

---

## 3. 17-C Hooks x3

| Harness | Mechanism | Result | Evidence |
|---|---|---|---|
| claude-code | `~/.claude/hooks/slim-guard.sh` + PreToolUse | PASS | File present+executable. `~/.claude/settings.json` hooks.PreToolUse: matcher `Bash`, command `/Users/jrg/.claude/hooks/slim-guard.sh` |
| cursor | `~/.cursor/hooks/slim-guard.sh` + hooks.json merge | PASS | Managed entry: `agent_core: "hook/slim-guard"`, matcher Shell. Hand sessionStart preserved: `bash '/Users/jrg/.cursor/herdr-agent-state.sh' session` |
| pi | `~/.pi/agent/extensions/slim-rewrite.ts` | ADAPTED PASS | Shim re-exports canonical `primitives/hooks/slim-rewrite.ts`; jiti-loaded, `/reload` hot-reloads (per AGENTS.md) |
| store ts/mjs hooks | N/A | N/A | pi extension mechanism, no cursor/CC native equivalent deployed (v1) |

---

## 4. Commands x3

| Deploy path | Regular file | diff vs store |
|---|---|---|
| `~/.claude/commands/tower.md` | OK | identical |
| `~/.claude/commands/tabs.md` | OK | identical |
| `~/.pi/agent/prompts/tower.md` | OK | identical |
| `~/.pi/agent/prompts/tabs.md` | OK | identical |
| `~/.cursor/commands/tower.md` | OK | identical |
| `~/.cursor/commands/tabs.md` | OK | identical |

**Section result: PASS (6/6)**

---

## 5. Subagents x2

| Check | Result | Evidence |
|---|---|---|
| CC count | PASS | 10 files in `~/.claude/agents/` |
| cursor count | PASS | 10 files in `~/.cursor/agents/` |
| store count | PASS | 10 files in `primitives/subagents/` |
| CC byte-compare | PASS | all `diff -q` clean vs store |
| cursor byte-compare | PASS | all `diff -q` clean vs store |
| pi | N/A | herdr/profiles |
| project `.cursor/agents/` | PASS | 5 role stubs; `git diff HEAD -- .cursor/agents/` empty |

---

## 6. Directives x3

| Check | claude-code | pi | cursor |
|---|---|---|---|
| Regular file (not symlink) | PASS | PASS | PASS |
| `harness-homogeneous` grep | PASS | PASS | PASS |
| Hand-composed byte-match | **FAIL** | **FAIL** | **FAIL** |
| `agent-core status directive/core` | PASS (all 3 green) | | |

### Byte-match failure detail (no diagnosis — observation only)

All three entrypoints differ from hand-composed reference by exactly one line at the banner boundary:

```
212d211
<
```

Recipe used: `cat primitives/AGENTS.md; echo; echo "$BANNER"; cat primitives/directives/<H>.md`

Live banners (exact):
- claude-code: `<!-- agent-core: composed from primitives/AGENTS.md + primitives/directives/claude-code.md — edit sources, not this file -->`
- pi: `<!-- agent-core: composed from primitives/AGENTS.md + primitives/directives/pi.md — edit sources, not this file -->`
- cursor: `<!-- agent-core: composed from primitives/AGENTS.md + primitives/directives/cursor.md — edit sources, not this file -->`

**Section result: FAIL (3/6 checks — byte-match on all three harnesses)**

---

## 7. MCP

| Harness | Config file | Servers | Result |
|---|---|---|---|
| cursor | `~/.cursor/mcp.json` | tower, arc, bigfile | PASS |
| claude-code | `~/.claude.json` (top-level `mcpServers`) | varlock-docs, tower, bigfile | PASS (no arc in CC config) |
| pi | N/A | N/A — CLI + super-search routing; no MCP registration per canonical AGENTS.md | N/A |

---

## 8. 17-G Global

| ID | Check | Result | Evidence |
|---|---|---|---|
| G1 | `agent-core status` x3 | PASS | 163 ok / 0 stale / 0 missing |
| G2' | entrypoints regular + directive/core | PASS | `file` → UTF-8 text (not symlink); directive/core green x3 |
| G3 | git porcelain | PASS (attributed) | see below |

### G3 porcelain attribution

| Path | Attribution |
|---|---|
| `M cli` | cursor-parity missions (submodule pointer) |
| `M briefs/session-mining/fixtures-p3/commands.csv` | session-mining mission |
| `M primitives/hooks/session-boundary-cursor.sh` | cursor-parity C2/C3 |
| `M primitives/tools/vein/test/acceptance/*` | vein tooling |
| `?? briefs/cursor-parity/*` | Unit D/E mission artifacts |
| `?? briefs/fleet-smoke/`, `briefs/verify-beat-port/`, etc. | parallel missions |
| `?? primitives/tools/bigfile/` | bigfile store (untracked) |
| `?? .cursor/` | project cursor config |
| `?? .pi/` | local pi scratch |
| `?? .coraline/`, `.verify/` | tooling scratch |
| `?? primitives/HARNESS-PARITY.md`, unregistered skills | harness-parity wave tail |
| **UNATTRIBUTABLE** | none flagged |

---

## 9. Final matrix (3-harness)

| Capability | claude-code | pi | cursor | Evidence |
|---|---|---|---|---|
| Output compaction (slim) | `~/.claude/hooks/slim-guard.sh` PreToolUse Bash | `extensions/slim-rewrite.ts` (ADAPTED) | `hooks.json` managed `hook/slim-guard` + script | 17-C |
| Blocking waits (latch) | CLI `~/.local/bin/latch` | same | same | 17-A A3 |
| Transcript mining (vein) | CLI `~/.local/bin/vein` | same | same | 17-A A4 |
| Memory propagation (assay) | skill deployed; binary **not on PATH** | same | same | 17-A A5 FAIL |
| Huge-file nav (bigfile) | MCP `mcp__bigfile__*` via `~/.claude.json` | super-search `--file` layer | MCP `bigfile` via `~/.cursor/mcp.json` | 17-D |
| Unified search (super-search) | skill dir + router | skill dir + router | skill dir + router | 17-B + smoke |
| Commands (tower/tabs) | `~/.claude/commands/*.md` | `~/.pi/agent/prompts/*.md` | `~/.cursor/commands/*.md` | Commands x3 |
| Subagents (10 store) | `~/.claude/agents/*.md` | N/A — herdr/profiles | `~/.cursor/agents/*.md` | Subagents x2 |
| Global doctrine (directive/core) | composed `~/.claude/CLAUDE.md` | composed `~/.pi/agent/AGENTS.md` | composed `~/AGENTS.md` | Directives (byte-match FAIL) |
| Hooks-json merge | N/A — settings.json | N/A — extensions | `~/.cursor/hooks.json` merge-managed | 17-C |
| MCP (tower) | `~/.claude.json` | N/A | `~/.cursor/mcp.json` | MCP |
| MCP (bigfile) | `~/.claude.json` | via super-search | `~/.cursor/mcp.json` | MCP + 17-D |
| MCP (arc) | not registered | N/A | `~/.cursor/mcp.json` | MCP |
| Store hooks (ts/mjs) | N/A | pi extensions / manual | N/A | v1 scope |
| Herdr-task-report | manual hook in settings | extension | N/A | out of D scope |

---

## Summary

| Section | Pass | Fail | N/A |
|---|---|---|---|
| 17-A tools | 10 | 1 (assay PATH) | 0 |
| 17-B skills | 4 | 0 | 0 |
| 17-C hooks | 3 | 0 | 1 (store ts/mjs) |
| Commands x3 | 6 | 0 | 0 |
| Subagents x2 | 5 | 0 | 1 (pi) |
| Directives x3 | 6 | 3 (byte-match) | 0 |
| MCP | 2 | 0 | 1 (pi) |
| 17-G global | 3 | 0 | 0 |
| **Total** | **39** | **4** | **3** |

### Failure IDs (Q to arbiter/orch — no diagnosis)

- **F-D-A5**: assay not on PATH; `~/.local/bin/assay` missing; zig-out binary runs `--help`
- **F-D-DIR-CC**: directive byte-match claude-code (1-line delta at banner)
- **F-D-DIR-PI**: directive byte-match pi (1-line delta at banner)
- **F-D-DIR-CUR**: directive byte-match cursor (1-line delta at banner)

**Overall verdict: FAIL** (4 failing checks; 39 passing)
