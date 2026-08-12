# ORCH brief — lever 3: proem cache geometry (shared prefix)

You are the ORCH for lever 3 of the cursor-shim program. You plan → decompose →
dispatch to ONE coder AGNT. You never implement yourself. The lever brief is at
`/Users/jrg/cursor-shim-lever-3-proem-cache/levers/lever-3-proem-cache.md`
(read it); this brief overrides/extends it where more specific.

## Pre-verified facts (verified by CORD this session, 2026-08-11 — do not re-verify)

- Worktree (edit here, NOWHERE else): `/Users/jrg/cursor-shim-lever-3-proem-cache`
  on branch `lever-3-proem-cache`. The live shim at `~/cursor-shim` is OFF LIMITS.
- `cursor-spine:254-257` today: `INSTRUCTION="$ROLE_PROMPT\n\n--- TASK ---\n$TASK"`.
  Order is right; no directive header exists; no volatile fields (timestamps,
  pane ids, cwd) currently enter INSTRUCTION — they live in the registry and the
  runner script only. Keep it that way.
- `cursor-spine:263-271` (`--dry-run`) prints metadata + char count only — it
  never prints the instruction, so the done-condition is unprovable today.
- `profiles/coder.md` (and siblings) carry zero per-invocation volatility.
- Doctrine: `~/agent-core/primitives/rules/control-flow.md:25-29` — byte-identical
  shared prefix across siblings; volatility never in the prefix; ONE shared brief
  file per fanout.

## File partition (binding — edit ONLY these, in the worktree)

- `cursor-spine`
- `README.md`

## Pre-decided design (CORD decision — implement exactly this, minimal + additive)

1. In `cursor-spine`, add a fixed `DIRECTIVE_HEADER` constant near the
   instruction-composition section. It must be a compile-time constant string:
   NO variables, NO timestamps, NO ids, NO paths that vary per invocation.
   Content (verbatim):

   ```
   --- DIRECTIVE ---
   Cache geometry (control-flow.md): everything above the --- TASK --- marker is
   a byte-identical prefix shared by every sibling spawned from this profile.
   Volatility (timestamps, pane ids, cwd, task specifics) never enters the
   prefix. When you fan out, reference ONE shared brief file for all siblings.
   ```

2. Change the composition to:
   `INSTRUCTION="$ROLE_PROMPT\n\n$DIRECTIVE_HEADER\n\n--- TASK ---\n$TASK"`
   (i.e. directive header between role prompt and the existing `--- TASK ---`
   marker; the marker line itself stays exactly `--- TASK ---`).

3. In the `--dry-run` block, after the existing metadata lines, print the full
   composed instruction to stdout (e.g. `printf '%s\n' "$INSTRUCTION"`), so two
   dry-runs can be prefix-diffed. Do not remove any existing dry-run output.

4. `README.md`: add ONE line documenting the cache-geometry guarantee (instruction
   = byte-identical stable prefix above `--- TASK ---`, volatile task at the
   tail; `--dry-run` prints the instruction so fanouts can verify prefix
   identity).

## Done-when (all required)

1. `bash -n cursor-spine` passes in the worktree.
2. Prefix-identity proof runs clean (CORD will re-run this to gate):
   ```bash
   cd /Users/jrg/cursor-shim-lever-3-proem-cache
   ./cursor-spine coder --prompt "task A" --dry-run > /tmp/l3-a.txt
   ./cursor-spine coder --prompt "task B" --dry-run > /tmp/l3-b.txt
   sed '/^--- TASK ---$/q' /tmp/l3-a.txt > /tmp/l3-a.pre
   sed '/^--- TASK ---$/q' /tmp/l3-b.txt > /tmp/l3-b.pre
   diff /tmp/l3-a.pre /tmp/l3-b.pre && echo "PREFIX IDENTICAL"
   ```
3. `git diff` in the worktree touches ONLY `cursor-spine` and `README.md`.
4. NO COMMIT. Workers never commit — CORD gates and commits.
5. Write `/tmp/lever-3-proem-cache.done` containing: what changed (line-level),
   the proof output verbatim, and `git diff --stat`.
6. Post the same evidence to the Tower board topic `cursor-shim/lever-3-proem-cache`
   via `bun ~/.tower/cli.mjs board_post` (fleet mail, NOT to:"operator").

## Report-back

Completion = `.done` file + board post with evidence. Never a bare "done" —
a false green is worse than a red.
