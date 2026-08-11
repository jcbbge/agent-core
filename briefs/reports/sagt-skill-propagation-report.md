# Report: SAGT skill-propagation

Spawner: ORCH skill-audit (pane w1A:pZ). Reporter pane: w1A:p15. Status: DONE.

## Fact re-confirmation (before touching anything)

All three paths from the brief were re-confirmed live, with one minor
drift noted: the brief cited inode `19797332` for the `.claude` file;
live `stat` showed inode `19797453` (367 lines, same content otherwise) —
almost certainly a re-save between brief-writing and this session, not a
contradiction of the facts. Everything else matched exactly:

| Path | Type | Size (bytes) | Lines | Inode |
|---|---|---|---|---|
| `~/.claude/skills/herdr/SKILL.md` | real file (source of truth) | 20286 | 367 | 19797453 |
| `~/agent-core/primitives/skills/herdr/SKILL.md` | real file (stale) | 22336 | 413 | 16120929 |
| `~/.pi/agent/skills/herdr/SKILL.md` | symlink → path 2 | — | — | 16774905 (link itself) |

`readlink ~/.pi/agent/skills/herdr/SKILL.md` → `/Users/jrg/agent-core/primitives/skills/herdr/SKILL.md`, confirmed.

## Action taken

`cp ~/.claude/skills/herdr/SKILL.md ~/agent-core/primitives/skills/herdr/SKILL.md`
(plain copy, not a symlink, per the hard constraint).

## Proof: byte-identical

| Path | shasum -a 256 |
|---|---|
| `~/.claude/skills/herdr/SKILL.md` | `8d44aa2dd3ae84ed7b32a93744958a234746854ebe3f3234b0651df9a13763e4` |
| `~/agent-core/primitives/skills/herdr/SKILL.md` (after) | `8d44aa2dd3ae84ed7b32a93744958a234746854ebe3f3234b0651df9a13763e4` |

`diff -q` between the two returns nothing (identical). Both now 367 lines,
20286 bytes.

**Before/after for the file I wrote:**

| | before | after |
|---|---|---|
| size | 22336 | 20286 |
| lines | 413 | 367 |
| mtime | 1786291610 | 1786404726 |
| inode | 16120929 | 16120929 (unchanged — in-place overwrite, not replace) |

## Proof: pi symlink resolves to new content

Read directly through `~/.pi/agent/skills/herdr/SKILL.md` (the symlink path, not the target path):

- `shasum -a 256 ~/.pi/agent/skills/herdr/SKILL.md` → same hash as above.
- Frontmatter `description` now reads "...control-flow.md (operator law,
  2026-08-10) names herdr THE substrate — use, leverage, optimize, and
  extend it in every way possible..." — the new framing, not the old
  "legacy and hosted operations" claim.
- CORD/ORCH/AGNT/SAGT table present at line 58 (`OPERATOR → CONCIERGE →
  CORD (1/project) → ORCH (1/unit of work) → AGNT (focused work)`) plus
  the naming-prefix table at lines 66+.
- Stamping mandate present: `## The stamping mandate (spawn.md)` at line 77.
- Reaping section present: `## Reaping (control-flow.md §Reaping)` at line 93.

All four required markers confirmed live through the symlink, not inferred.

## Stale-copy sweep (full machine sweep, beyond the three known paths)

| Path | Type | Size | mtime | Current? |
|---|---|---|---|---|
| `~/.claude/skills/herdr/SKILL.md` | real file | 20286 | 2026-08-10 18:27 | ✅ yes — source of truth |
| `~/agent-core/primitives/skills/herdr/SKILL.md` | real file | 20286 | 2026-08-10 (this session) | ✅ yes — fixed this session |
| `~/.pi/agent/skills/herdr/SKILL.md` | symlink → above | n/a | 2026-08-02 (link ctime) | ✅ yes — resolves through |
| `~/.prime/agent/skills/herdr/SKILL.md` | **real file, NOT a symlink** | 22407 | 2026-08-08 11:32 | ❌ **STALE** — new discovery, not in original brief |
| `~/source/herdr/skills/herdr/SKILL.md` | real file, upstream herdr project's own bundled skill (github.com/ogulcancelik/herdr, in-repo, not this user's customized lineage) | 10140 | 2026-08-10 (repo-local) | N/A — different content/purpose, not a copy of the customized skill; harmless to leave, flagging for awareness only |

**New finding not in the original brief:** `~/.prime/agent/skills/herdr/SKILL.md`
is a fourth real file — under a "prime" harness root parallel to `.pi`, with
no symlink involved (it's a standalone copy, not wired to
`~/agent-core/primitives/...` at all). I diffed it against `git show
HEAD:primitives/skills/herdr/SKILL.md` (the pre-session stale content) and
got a **byte-identical shasum match**
(`1197887...4547` on both) — confirming it is a direct fork of the same
stale lineage, now also out of date relative to the fix landed this
session. **I did not touch it** — it is outside my one-path write
partition. `~/.prime/agent/rules/` was also checked; it has no herdr
references, so no companion rules-drift there.

I also swept every other plausible top-level harness `skills/` root on the
machine for a `herdr/` subdirectory: `~/skills`, `~/.cursor/skills`,
`~/.gemini/skills`, `~/.gemini/config/skills`, `~/.strudel/skills`,
`~/.strudel/agent/skills`, `~/.bb/skills`, `~/.agents/skills`,
`~/.codex/skills`, `~/.factory/skills`, `~/config/opencode/skills`,
`~/constellation-zg/skills`. None contain a `herdr` skill. No `strudel`
pantry root (`~/strudel`, `~/strudel-lab`, `~/scrumble-lab/strudel`,
`~/evals/strudel-configs`) contains any `herdr`-named file.
Checked `~/.pi/agent/rules/` and `~/agent-core/primitives/rules/` for
herdr references per the brief: `~/.pi/agent/rules/` has none;
`~/agent-core/primitives/rules/control-flow.md` and
`tower-orchestration.md` reference herdr (as expected — control-flow.md is
the rule this skill's frontmatter points to). `control-flow.md` itself
exists only under `~/agent-core/primitives/rules/` — no copies found
elsewhere, so no parity gap there.

## git status --porcelain delta

Before and after snapshots are **identical** at the porcelain-line level:
`primitives/skills/herdr/SKILL.md` was already flagged ` M` before this
session's edit (pre-existing unrelated modification per the brief), so my
overwrite of that same file does not add a new porcelain line — it stays
one ` M` line, same as before. Nothing else in the porcelain output
changed (byte-for-byte identical `git status --porcelain` text before vs.
after, confirmed with `diff`). `git diff --cached --stat` is empty — nothing
staged, nothing committed.

To positively prove the *content* delta is scoped to exactly the intended
file: `git diff --stat -- primitives/skills/herdr/SKILL.md` shows one file
changed (295 insertions, 341 deletions — consistent with 413→367 lines).
No other tracked file shows any diff attributable to this session's
actions.

## Recommendation on consolidation

Do not consolidate to one canonical file with per-harness symlinks without
an explicit operator decision, but the case for it is strong: the same
class of drift that hit `.pi` (a real, editable copy sitting *next to* a
symlink target) has now independently occurred at `.prime`, and manual
copy-parity has already silently failed at least once this session before
being caught. A single source-of-truth file with symlinks fanned out to
every harness root (`.claude`, `.pi`, `.prime`, and any future root) would
make this class of staleness structurally impossible instead of dependent
on someone re-running a sweep; the trade-off is that it changes harness
config surface (some harnesses may not tolerate a symlinked skill file,
and a broken symlink fails silently/invisibly in a way a stale real file
at least still loads *something*), which is why ORCH correctly reserved it
as an operator call rather than something a propagation task should do
unilaterally.

## Done-when checklist
- [x] The two real files are byte-identical (shasum evidence above).
- [x] The pi symlink path resolves to the new content, confirmed by reading through the symlink.
- [x] The stale-copy sweep is complete (including a new discovery: `~/.prime/...`), every copy reported with path/size/mtime/current-status.
- [x] `git status --porcelain` shows no new porcelain lines versus the before-snapshot; nothing staged or committed.
