# Brief: SAGT skill-propagation — make the upgraded herdr skill reach EVERY harness
Spawner: ORCH skill-audit (pane w1A:pZ). Date: 2026-08-10. Status: binding.

## Why you exist
The operator's verbatim question behind this whole unit of work was: "how do
future herdr sessions know about all of these upgrades? how do they know to
use them?" Two agents rewrote and then adversarially verified
`~/.claude/skills/herdr/SKILL.md`. But that fixes ONE harness. ORCH verified
live that the upgrade currently does NOT reach pi sessions. You close that
hole and prove it closed.

## Pre-Verified Facts (ORCH, verified live this session — do not re-derive, DO re-confirm before acting)
Three herdr SKILL.md paths exist and they are NOT one file:
1. `~/.claude/skills/herdr/SKILL.md` — real file, inode `19797332`, **367
   lines** after the verifier's pass. THIS IS THE GOOD ONE (source of truth).
2. `~/agent-core/primitives/skills/herdr/SKILL.md` — a SEPARATE real file,
   inode `16120929`, 413 lines, mtime 2026-08-09. STALE. Untouched by this
   session's work. It is git-tracked in the `~/agent-core` repo (it shows as
   ` M` in `git status`, from pre-session churn — confirm this before you
   assume your change is the only one).
3. `~/.pi/agent/skills/herdr/SKILL.md` — a SYMLINK to (2), created
   2026-08-02. So pi sessions load the stale skill.
The stale copy still contains the pre-CORD/ORCH topology, no stamping
mandate, no reaping, no comms law, and the frontmatter claiming herdr is
"not the ambient substrate ... a tool available for legacy and hosted
operations" — the exact claim `~/agent-core/primitives/rules/control-flow.md`
§Substrate contradicts.

Per the user's global CLAUDE.md, `~/agent-core/primitives/` is the CANONICAL
store, and the herdr skill's own `metadata.gateway` reads "strudel pantry
(roots ~/.pi/agent + ~/agent-core/primitives)".

## Your task
1. **Re-confirm the facts above** before touching anything: `stat` all three
   paths, `readlink` the pi one, `wc -l` both real files, and diff them.
   If reality differs from the Pre-Verified Facts, STOP and report — do not
   improvise a different fix.
2. **Propagate**: make `~/agent-core/primitives/skills/herdr/SKILL.md` carry
   the exact verified content of `~/.claude/skills/herdr/SKILL.md`.
   Use a COPY, not a symlink — see the constraint below.
3. **Prove it landed**: the two real files must be byte-identical
   (`diff` returns empty, `shasum` matches), and
   `~/.pi/agent/skills/herdr/SKILL.md` must resolve THROUGH its symlink to
   the new content (read it via the symlink path and confirm the new
   frontmatter description, the CORD/ORCH/AGNT/SAGT table, the stamping
   mandate, and the reaping section are all present).
4. **Sweep for other stale copies.** ORCH found three paths with
   `find ~/.claude ~/.pi ~/agent-core -name SKILL.md -path "*herdr*"`. Widen
   it: search other plausible harness/skill roots on this machine for any
   OTHER herdr skill copy or any file that duplicates this skill's content
   (also check `~/.pi/agent/rules/`, `~/agent-core/primitives/rules/`, and
   any `strudel`/pantry root you can find evidence for). Report every copy
   you find with its path, size, mtime, and whether it is now current.
   Do NOT modify anything you find outside your partition — report it.

## HARD constraints
- **You may write to exactly one path:**
  `~/agent-core/primitives/skills/herdr/SKILL.md`.
- **Do NOT convert anything to a symlink and do NOT re-wire
  `~/.claude/skills`.** ORCH deliberately reserved the
  one-file-with-symlinks consolidation as an OPERATOR decision, because it
  changes harness config. Your job is parity, not architecture. If you think
  consolidation is right, say so in your report — do not do it.
- **Do NOT commit and do NOT `git add`.** `~/agent-core` is a git repo with
  unrelated pre-existing modifications and deletions in its working tree;
  leave every one of them exactly as you found it. Verify with
  `git status --porcelain` before and after that the ONLY delta you caused
  is to your one file.
- Never edit `~/.claude/skills/herdr/SKILL.md` — it is the source of truth,
  read-only to you.

## Done when
- [ ] The two real files are byte-identical (shasum evidence in your report).
- [ ] The pi symlink path resolves to the new content, confirmed by reading
      through the symlink, not by inference.
- [ ] The stale-copy sweep is complete, with every copy found reported.
- [ ] `git status --porcelain` in `~/agent-core` shows exactly one new delta
      versus your before-snapshot, and nothing is staged or committed.

## Comms (binding)
- FIRST action: post a CLAIM to the Tower board, topic `herdr/skill-audit`,
  from cwd `/Users/jrg/agent-core`, including your pane id. Use the tower MCP
  `board_post` if available; otherwise append one JSON line to
  `~/.tower/board.jsonl`.
- Route every question to your spawner (ORCH skill-audit, pane `w1A:pZ`) —
  never to the operator.
- LAST actions, in order: (1) write your report to
  `~/agent-core/briefs/reports/sagt-skill-propagation-report.md`; (2) post a
  DONE finding to topic `herdr/skill-audit`; (3) create the marker
  `~/agent-core/briefs/.done-sagt-skill-propagation`.

## Report back with
The before/after `stat` + `shasum` evidence for both real files; the content
proof read THROUGH the pi symlink; the full stale-copy sweep table (path,
size, mtime, current y/n); the before/after `git status --porcelain` delta;
and your recommendation on whether the operator should consolidate to one
file with symlinks — with the trade-off stated in one short paragraph.
