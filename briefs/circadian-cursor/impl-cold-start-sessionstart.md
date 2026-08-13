# AGNT circadian-wake — fix cold-start --resume suppressing sessionStart

Repo: `~/cursor-shim` (bash shim, git main @ 6c85350). Do NOT use emojis
anywhere. You are either the Implementer (coder) or the Test Designer
(test-maker) for this unit — follow your profile wall.

## Pre-Verified Facts (ORCH verified personally, 2026-08-12)

- Task-1 board finding `cursor-shim/circadian-wake`: interactive cold spawn with
  `create-chat` + immediate `--resume` suppresses `sessionStart` (scoreboard
  delta 0, `agent_session` null, agent `WAKE_SEEN=no` on pane w2M:p5). Same
  interactive path WITHOUT `--resume` fires hooks (delta +2, `WAKE_SEEN=yes`,
  pane w2M:p9). `-p` researcher headless already fires hooks (delta +2,
  `WAKE_SEEN=yes`, pane w2M:p4).
- Gap lives in `~/cursor-shim/cursor-spine` lines ~561-595 (interactive) and
  ~627-629 (`-p` KEEP): after `create-chat`, code does
  `IA_ARGS+=(--resume "$CHAT_ID")` / `CA_ARGS+=(--resume "$CHAT_ID")`.
- Dry-run exits BEFORE create-chat/resume wiring (~line 530), so dry-run `cmd`
  today already omits `--resume`; live spawn adds it. Tests that
  `grep -q 'IA_ARGS+=(--resume'` currently pass against source — those must be
  rewritten for the new contract.
- Baseline: `bash docs/qa-verify.sh` = 90 passed, 0 failed. Suite must never
  spawn real panes. Working tree was clean at unit start (@ 6c85350).
- `cursor-spine resume <chat_id>` subcommand (lines ~236-264) already uses
  `--resume` correctly for true warm re-entry — keep that path.
- Do NOT change `~/.cursor/hooks.json` or `~/circadian`. Kill-switch R7 stays.

## Parallel Work Notice

None. You own the files listed in Constraints. Ignore uncommitted changes
outside your partition. Board topic: `cursor-shim/circadian-wake`.

## Tower

- Findings: board_post topic `cursor-shim/circadian-wake` (claim files first).
- Questions climb to ORCH (nq<=3). No operator mail.
- `spine-report task` at start; `spine-report verdict` at end.
- `.done` marker: `~/agent-core/briefs/circadian-cursor/.done/<your-role>`

## Tasks

### For test-maker (from this plan ONLY — do not read coder diffs)

1. Add a `### Circadian cold-start sessionStart` section to
   `docs/qa-verify.sh` asserting the Automated criteria in
   `~/agent-core/briefs/circadian-cursor/criteria-cold-start-sessionstart.md`
   (items 1-8 as mechanical grep/dry-run checks).
2. Update Lever 4 checks that currently require cold-path
   `IA_ARGS+=(--resume` / `CA_ARGS+=(--resume` so they match the new contract
   (resume subcommand retains `--resume`; cold path must not).
3. Done when: the new assertions exist and would fail on CURRENT main (before
   coder lands) for the cold-path resume wiring, and pass once coder lands;
   suite still never spawns panes; no mocks.

### For coder (from this plan ONLY — do not read tests)

1. In `cursor-spine`: keep `create-chat` gated to `KEEP=1` and still record
   `CHAT_ID` in the registry for later `resume`.
2. Remove cold-start `IA_ARGS+=(--resume "$CHAT_ID")` and
   `CA_ARGS+=(--resume "$CHAT_ID")` after fresh create-chat. Add a short
   comment citing sessionStart suppression (circadian-wake 2026-08-12).
3. Leave the `resume` subcommand's `--resume` behavior unchanged.
4. Done when: source matches criteria 1-5; `bash -n cursor-spine` clean;
   no hooks.json / circadian edits.

## Constraints

- Touch ONLY: `cursor-spine`, `docs/qa-verify.sh`, and optionally a short note
  under `docs/` (e.g. QA-lever doc Lever 4 amendment). Do not commit.
- Testing: NO MOCKS. Dry-run / static only inside the suite.
- Partitions: test-maker owns `docs/qa-verify.sh` (+ optional docs note);
  coder owns `cursor-spine`. Do not cross.
- No instr-file wake weave in this unit (hooks restored by cold-start fix).

## Report back with

- Per-file diff summary.
- `bash docs/qa-verify.sh` tail (PASS/FAIL totals) if you ran it in your
  worktree.
- Deviations with reasons.
