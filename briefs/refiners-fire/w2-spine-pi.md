# W2 — spine-spawn + herdr wrapper: pi becomes the blessed kind (refiners-fire fix, Phase 1)

## Mission
The cursor CLI was uninstalled 2026-08-11 (binary + wrappers confirmed gone) but its subscription gateway lives on, reached from INSIDE pi. Make `--kind pi` the first-class fleet path in spine-spawn, replace the dead `herdr cursor` operator entry with `herdr pi`, and make every dead cursor path fail loud instead of silent. Audit source: `~/agent-core/AUDIT-2026-08-11-refiners-fire.md` P0-4, P1-8.

## Pre-Verified Facts (verified today by the coordinating audit)
- `cursor-agent`, `~/bin/cursor-agent`, `~/bin/agent`, `~/.cursor/cli-config.json`: all GONE. herdr `--kind cursor` maps to the dead `cursor-agent` exec.
- `~/bin/herdr:37-39`: `herdr cursor [profile]` subcommand → `$REAL agent start ... --kind cursor ... --model $(profile-model get ...)` — dead. Line 42 passes everything else to `~/.local/bin/herdr` ($REAL).
- `~/bin/hc:4`: `exec herdr cursor "$@"` — dead chain.
- `~/herdr-spine/bin/spine-spawn`: cursor special-casing at :207-212 (CURSOR_AGENT_FLAGS), :224-229 (flags+model appended when kind==cursor), :241-242, :356-358 (warns "model passthrough is Cursor-oriented" for --profile + non-cursor kind but still passes the slug), :518-519 (--kind required, no default). `--kind pi` execs `/opt/homebrew/bin/pi` (0.84.1) via herdr.
- pi model flags: `pi --model '<pattern>'` (supports `provider/id` + `:thinking` suffix) and `--thinking <off|minimal|low|medium|high|xhigh|max>`. Bare pi uses `~/.pi/agent/settings.json` defaults (provider cursor, model claude-opus-4-8@1m:fast) — this works today.
- A PARALLEL worker (W3) is rewriting `~/agent-core/primitives/profiles/models.json` to pi-grammar IDs (`cursor/<id>[@ctx][:thinking]`). Do NOT touch the profiles dir. Assume `profile-model get <profile[:option]>` returns a pi-valid `--model` value once W3 lands; your code just passes it through.
- Herdr pane control needs `HERDR_ENV=1` (you have it) and the socket (`herdr api snapshot` to confirm).

## File partition — touch ONLY these
- `~/herdr-spine/bin/spine-spawn`
- `~/bin/herdr`
- `~/bin/hc`
Nothing else — NOT the profiles dir, NOT herdr SKILL.md, NOT AGENTS.md (doctrine is a later wave). Never commit. No git commands.

## Tasks
1. **spine-spawn — bless pi**: when `--profile` is given with `--kind pi`, pass `--model "$(profile-model get ...)"` through WITHOUT the :356-358 warning; also pass `--thinking` if a new optional `--thinking` CLI arg is provided by the caller (add it, default None = omit). Keep profile prompt prepending unchanged (it is kind-agnostic). Done when: `python3 -m py_compile ~/herdr-spine/bin/spine-spawn` exits 0 and the diff shows pi treated as first-class (no warning path for pi).
2. **spine-spawn — cursor fails loud**: replace the kind==cursor spawn path with an immediate hard error before any herdr call: `error: --kind cursor retired 2026-08-11 (cursor CLI uninstalled; gateway models are reached via --kind pi + --profile)`. Done when: `python3 ~/herdr-spine/bin/spine-spawn worker --label test-dead --kind cursor --task x --prompt x 2>&1` (or the minimal valid arg set that reaches kind dispatch) exits nonzero printing that message, with NO pane created (`herdr pane list --workspace $HERDR_WORKSPACE_ID` count unchanged).
3. **~/bin/herdr — `pi` subcommand**: replace the `cursor` branch with `pi [profile[:option]]`: `exec $REAL agent start "$NAME" --kind pi --pane $HERDR_PANE_ID${profile:+ -- --model "$(profile-model get "$profile")"}` (mirror the old branch's name-generation). Keep a `cursor` stub that prints `herdr cursor retired 2026-08-11 — use: herdr pi [profile]` and exits 1. Done when: `bash -n ~/bin/herdr` exits 0; `~/bin/herdr cursor` exits 1 with the retirement message; live smoke: create a scratch split pane (`herdr pane split --current --direction down --no-focus`, record the returned id), run `~/bin/herdr` inside it is NOT possible from outside — instead validate the constructed command by `herdr agent start w2-smoke-pi --kind pi --pane <scratch-id>` directly, confirm `herdr pane get <scratch-id>` shows agent pi, then reap: `herdr agent stop` if needed and `herdr pane close <scratch-id>` (you created it; close only that id; never close the focused pane).
4. **~/bin/hc**: repoint to `exec ~/bin/herdr pi "$@"`. Done when: `bash -n ~/bin/hc` exits 0 and its content shows the new exec line.

## Tower
Post to board topic `agent-core/refiners-fire`: a `claim` when you start ("W2 owns spine-spawn, ~/bin/herdr, ~/bin/hc"), one `finding` per task, final `finding` starting `DONE W2:`. MCP tower tools if available in your harness, else append to `~/.tower/board.jsonl` (documented fallback format, from a real repo cwd).

## Report back with
Final message AND the DONE post carry: per-file diffstat, the exact new error messages, smoke-test evidence (scratch pane id created → agent pi confirmed → reaped), all done-when exit codes. LAST action after the board post: `touch ~/agent-core/briefs/refiners-fire/w2.done` — only after every done-when is verified.
