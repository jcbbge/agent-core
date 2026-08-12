# AGNT fanout self-stamp

You are AGNT B3 under orch-phase4-automation. Close the spine-spawn fanout naming gap: derive `AGNT <headline>` (+ name/task/role tokens) from each brief's H1 (strip markdown), apply at spawn so ORCH need not manually re-stamp. Do NOT use emojis anywhere.

## Pre-Verified Facts (ORCH verified)
- Code: `~/herdr-spine/bin/spine-spawn` (python3). Fanout at `cmd_fanout` (~line 456): `role = f"{args.task}-w{i}"`. `control_flow_display` (~292) already maps to `AGNT {headline}` but headline stays the `<task>-wN` registration slug — comment at ~315 admits the gap.
- `stamp_control_flow` already writes display-agent + role/task/name tokens. Rename happens in `spawn_into_pane` before start. Registration name for `agent start` must stay lowercase-kebab (no spaces); display label carries `AGNT <headline>`.
- Docs gap: `~/herdr-spine/docs/spawn.md` still tells ORCH to manually re-stamp after every fanout — update once code self-stamps.
- Tree already has uncommitted edits on `bin/spine-spawn` and `docs/spawn.md` from prior work — READ them first; extend, do not clobber unrelated improvements (e.g. `--thinking`, pi model passthrough).
- Live test MUST use this workspace (`w1M`). Spawn a trivial echo-worker via fanout, verify stamps on all four carriers, then REAP that test pane/tab (you created it — you may close it).
- `python3 -m py_compile ~/herdr-spine/bin/spine-spawn` must pass.

## Parallel Work Notice
B2 may edit `herdr-plugin.toml` / `bin/spine-startup` / `docs/plugin.md`. Do not touch those. B1 launchd, B4 circadian — ignore.

## Tower
```
cd /Users/jrg/herdr-spine && bun ~/.tower/cli.mjs post <claim|finding|note> herdr-spine/phase4 "<body>" --from agnt-b3-fanout-stamp
```

## Partition (ONLY)
- `~/herdr-spine/bin/spine-spawn`
- `~/herdr-spine/docs/spawn.md` (naming-gap section)
- Test brief you create under `~/agent-core/briefs/wave2/workers/b3-echo-test.md` (ephemeral ok)
- Evidence: `~/agent-core/briefs/wave2/done/b3-fanout-stamp.evidence.md`

## Tasks
1. Add brief-H1 extraction: first markdown H1 (`^#\s+...`), strip `#` and emphasis, produce a short headline (sensible truncation for 80-char task token if needed).
2. Fanout: keep registration role unique (`agnt-<slug>-wN` or `<task>-wN` kebab), but set display/tokens/rename from H1 → `AGNT <headline>`.
3. `python3 -m py_compile` clean.
4. Live test in workspace `w1M`:
   ```
   python3 ~/herdr-spine/bin/spine-spawn fanout --task b3stamp --workspace w1M --kind pi --cwd /Users/jrg/herdr-spine --brief <echo-brief>
   ```
   Echo brief H1 must be distinctive (e.g. `# AGNT echo stamp probe`). Done-when for echo: post a one-line finding and touch a `.done`, then idle.
5. Verify stamps: `herdr pane get <id>` shows label/display-agent `AGNT …` matching H1 words; tokens `role=3-AGNT`, `name=…`, `task=…`. Paste evidence.
6. Reap the echo worker pane and empty workers tab.
7. Update spawn.md: remove/replace the "manual re-stamp after fanout" mandate with the new self-stamp behavior; note any remaining gap honestly.
8. Evidence file with compile result, pane get JSON snippets, reap confirmation.

## Constraints
- Never commit.
- Do not restart herdr server.
- Cap: fanout still ≤4 briefs.
- Do not leave the echo worker running.

## Done when
- Code self-stamps from H1; py_compile ok; live fanout proved; echo reaped; spawn.md updated; board finding; `touch ~/agent-core/briefs/wave2/done/b3-fanout-stamp.done`

## Report back with
Before/after stamp example, evidence paths, any residual manual step.
