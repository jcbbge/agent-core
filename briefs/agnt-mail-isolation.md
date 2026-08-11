# Brief: AGNT mail-isolation — namespaced fleet-mail topics, scoped reads, no scratch posts
Date: 2026-08-10
Spawner: ORCH ctl-planes (pane w1A:pR). Do NOT use emojis anywhere.

You are implementing operator mandate (B): `~/.tower/COMMS-ARCH.md`
§Project isolation. The four rules are already written down. Your job is the
layer BENEATH them — the enforcement, the templates agents actually read, and
the verification that the readers behave. You are not rewriting the doctrine.

Three things must become true:
1. Fleet-mail topics are namespaced `<project-slug>/<topic>` in every document
   that tells an agent how to post.
2. Posting from a scratch/temp dir is refused where a refusal is possible, and
   the hole where it is not possible is written down rather than glossed.
3. The scoped readers are named as the only sanctioned path, and TOWR is
   verified against the namespaced form.

## Pre-Verified Facts (ORCH verified every one of these personally, 2026-08-10)

The audit that motivates this (run over `~/.tower/board.jsonl`, 2748 rows):
- 50 distinct topics. **14 of them span more than one cwd. ZERO use the
  namespaced form today.**
- Worst case: topic `circadian health` spans 47 distinct cwds, including
  `/tmp/circ-quota`, `/tmp/circ-verify`, `/tmp/circ-verify2`, `/tmp/circ-verify3`,
  and two `/private/tmp/claude-501/.../scratchpad/...` sandboxes, alongside the
  real `/Users/jrg/circadian`. Topic `popmem` spans the repo plus three
  worktree paths (those collapse correctly via normCwd — worktrees are fine).
- 27 board rows and 30 ledger rows were posted from scratch dirs.
Quote these numbers in your doc edits where they earn their place; they are
the evidence, not decoration.

The readers — do NOT add a second implementation of scoping:
- `~/.tower/lib.mjs`: `normCwd(p)` :38 (realpath + `git rev-parse
  --git-common-dir` so every worktree of a repo collapses onto the repo),
  `inboxState(cwd)` :95, `boardFor(cwd, {topic, limit})` :123.
- `~/agent-core/primitives/tools/statem/twr.ts` :38-41 already routes through
  `boardFor`, with a `--board` override path that filters with the same
  exported `normCwd`. `~/.tower/cli.mjs` :68 uses `boardFor`.
- `~/.tower/server.mjs`: `CWD = normCwd(process.cwd())` at :32; the
  `board_post` tool is declared around :101-113 and its handler appends the
  row and returns `Posted to board topic "..." as <id>` around :211. Read the
  handler before you touch it.

Repos and version control:
- `~/.tower` is **NOT a git repo** (verified) and neither is `~/.claude`.
  Changes there cannot be committed — back up before editing:
  `cp ~/.tower/server.mjs ~/.tower/server.mjs.bak-$(date -u +%Y%m%dT%H%M%SZ)`
  (precedent already on disk: `server.mjs.spine-backup-20260730T211657Z`).
  Report exact line deltas for those files instead of a sha.
- `~/agent-core` git is very dirty from other sessions (many `D`/`M` rows).
  `~/herdr-spine` git is dirty too (`bin/handlers/40-tower-bridge` modified,
  untracked `research/*`). Ignore all of it. Stage only your own paths, by
  name. **Never `git add -A`.**

Templates — there are TWO drifted copies of the brief skill, different md5:
- `/Users/jrg/.claude/skills/brief/SKILL.md` (7.7K) — the copy Claude Code
  actually loads. Line 44 is the template line
  `Tower board (mcp__tower__board_post, topic '<topic>'); read it before` and
  line 54 documents the direct-append fallback row shape
  `{"id","ts","cwd","type":"finding|alert","from","topic","body"}`.
- `/Users/jrg/agent-core/primitives/skills/brief/SKILL.md` (6.7K) — the
  canonical store copy.
Edit BOTH so no harness hands out the old convention. Do NOT try to reconcile
the wider drift between them — out of scope; report it as a finding.

Do not change:
- `statem.ts` — it posts topic `statem` from the project root (:87-98).
  Un-namespaced is CORRECT for it: COMMS-ARCH reserves bare topics for
  machine-plane infra (statem, comms, fleet). Leave it alone.
- `~/.tower/COMMS-ARCH.md` §Project isolation's existing four bullets. You
  append beneath them; you do not restate or reword them.

## Tasks

1. **`~/herdr-spine/docs/spawn.md`** (143 lines) — add one short section after
   §Naming: "Fleet-mail topics are project-namespaced". Cover: the
   `<project-slug>/<topic>` form with a concrete example; slug = basename of
   the repo root the work belongs to, worktrees collapsing to the main repo
   (`spine-spawn` already computes exactly this — see its `project_slug()`
   docstring, which cites normCwd, and the `project=<slug>` token it stamps on
   every pane); the bare-topic exception for machine-plane infra; post from
   your real repo cwd and never a scratch dir; and that `board_post` now
   refuses scratch cwds outright. Keep it tight — this doc is read at spawn
   time, not studied.

2. **Both brief SKILL.md copies** — the template's topic becomes
   `<project-slug>/<topic>` with a one-line why, and the direct-append
   fallback line gains that `cwd` must be the agent's real repo cwd and the
   topic must be namespaced. Same edit in both files.

3. **`~/.tower/COMMS-ARCH.md` §Project isolation** — append a short "Reading
   scoped" block: `boardFor` / `inboxState` / `twr.ts` are the only sanctioned
   project-scoped readers; a raw `readAll(BOARD)` or a direct file read is a
   machine-plane privilege and must be declared as such where it is used; and
   record the new guard together with its known hole — an agent appending
   straight to `board.jsonl` (the documented pi path) bypasses the MCP server
   entirely, so for that path the docs are the only control. Write the hole
   down; do not pretend the guard closes it.

4. **`~/.tower/server.mjs`** — guard `board_post`, and only `board_post`.
   If `CWD` is a scratch path — `/tmp/` or `/private/tmp/` prefix, or any path
   containing `/scratchpad/` — do not append; return an error string that
   names the offending path and tells the caller to post from its real repo
   cwd. Return, do not throw. Eight lines maximum. Verification: exercise the
   real code path by starting `server.mjs` as a subprocess with cwd set to a
   scratch dir and speaking MCP stdio to it (initialize, then
   `tools/call board_post`), and show the refusal. Do NOT restart the live
   fleet's MCP servers, and do NOT test the accept case — that would write to
   the operator's live board; ORCH ctl-planes covers the accept case with the
   cross-talk proof.

5. **`~/agent-core/primitives/tools/statem/twr.ts`** (91 lines) — verify, and
   change only if verification demands it. Build a fixture board in your
   scratch dir with four rows: two for `cwd` `/Users/jrg/future`
   (topics `future/isolation-test` and `statem`) and two for `cwd`
   `/Users/jrg/circadian` (topics `circadian/isolation-test` and `statem`),
   the statem rows with `from` `statem@<project>` so the TRANSITIONS filter is
   exercised too. Then:
   `timeout 3 bun twr.ts /Users/jrg/future --board <fixture> | sed -E 's/\x1b\[[0-9;?]*[a-zA-Z]//g'`
   must show only the future rows, and the `/Users/jrg/circadian` run only the
   circadian rows. Namespaced topics must not break the TRANSITIONS /
   FINDINGS / OPEN QUESTIONS split. ONE optional line of change is
   sanctioned: render the topic in FINDINGS rows (`from · topic · body`) so
   namespacing is visible in the live pane — take it only if it stays one line
   and the sections still fit the width clip.

Total new lines across everything: keep under 60. This is a joins-and-docs
task, not a new system. Zero dependencies, zero services.

## How We'll Know It's Done (paste real output, not a summary)

- [ ] `git -C ~/herdr-spine add docs/spawn.md` + commit — sha and `wc -l`
      before/after. `index.lock` contention is expected (a sibling worker
      commits in this same repo): sleep 2s and retry.
- [ ] Both brief SKILL.md copies show the namespaced template — paste the
      changed lines from each with `grep -n`, and their new md5s.
- [ ] COMMS-ARCH.md §Project isolation: paste the appended block and the
      before/after line count.
- [ ] server.mjs: paste the guard, the backup filename, and the transcript of
      the stdio subprocess run from a scratch cwd showing the refusal.
- [ ] twr.ts: paste both fixture runs, and the commit (or an explicit "no
      change needed, unchanged at 91 lines").
- [ ] A one-line statement of whether any live component had to be restarted.
      The answer should be "none".

## Parallel Work Notice

`AGNT ctl-work-planes` is in flight right now, in `~/herdr-spine`. It owns
`~/herdr-spine/bin/ctl-fleet` and `~/herdr-spine/docs/ctl-fleet.md`. You own
`~/herdr-spine/docs/spawn.md` and nothing else in that repo. You share the
herdr-spine git index with it — stage only `docs/spawn.md`, by name.
Ignore uncommitted changes to anything you do not own in either repo: do not
investigate them, do not revert them, do not fix them.

## Tower

Post CLAIM first and findings as you go: `mcp__tower__board_post`, topic
`agent-core/ctl-planes`, from `agnt-mail-isolation`. Your own topic is
namespaced on purpose — you are the first live use of the convention you are
documenting, and your cwd is `~/agent-core`, so `agent-core` is your slug even
though your edits reach further. That cross-repo mismatch is itself worth a
finding if you think the convention needs a rule for it. Post from your real
cwd, never a scratch dir. Self-report:
`/Users/jrg/herdr-spine/bin/spine-report task "<what I am doing>"` at each
unit of work, `spine-report verdict "<result>"` when done.

## Report back with (exact completion contract)

A final board post on topic `agent-core/ctl-planes` AND your final pane
message, both carrying: every commit sha; per-file line deltas for the two
non-git files; the six pieces of evidence above verbatim; the drift finding on
the two brief skill copies; and deviations or "none". If something in this
brief turned out to be wrong, say so plainly — that is a finding, not a
failure.
