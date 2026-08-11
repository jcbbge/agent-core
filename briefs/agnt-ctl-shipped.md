# Brief: AGNT ctl-shipped — SHIPPED block in both CTRL planes
Date: 2026-08-10
Status: ready
Spawned by: ORCH ctl-shipped (pane w1A:p16)

## What This Is
The CTRL fleet panes must carry eng-manager-grade git change signal. Spec is
already codified in `~/agent-core/primitives/rules/control-flow.md`, section
"CTRL SHIPPED section (operator, 2026-08-10)" — read it first; it is binding.
You implement. You own two files and nobody else is touching them.

## Your partition (exclusive; no parallel work on these)
- `~/herdr-spine/bin/ctl-fleet`   (implementation)
- `~/herdr-spine/docs/ctl-fleet.md` (docs)
Touch nothing else. Do not commit — report back and the orchestrator handles
the reap.

## Pre-Verified Facts (verified by ORCH this session, 2026-08-10)
- `bin/ctl-fleet` is **464 lines**, `docs/ctl-fleet.md` is **229 lines**.
  Line budget: ctl-fleet may grow to **560 lines max**. Zero new deps, zero
  services, zero new state files.
- Existing structure you will extend (line numbers as of 464-line version):
  - `refreshSlow()` :274 — the 5s tick; today the ONLY place disk I/O happens.
  - `workByProject` :272 / `projectWorkSnapshot` :273 — the machine-plane vs
    project-plane split you must mirror for git.
  - `renderWorkMachine()` :368, `renderWorkProject()` :384 — model your
    `renderShippedMachine()` / `renderShippedProject()` on these.
  - `render()` :414 calls one or the other at :429-430. SHIPPED goes
    **after** the WORK block and **before** the per-project pane rows.
  - `projectOf(p)` :186 — the project grouping key. `truncate()` :353,
    `DIM`/`RESET` :362-363 already exist; reuse them.
  - `resolveRoot()` :207 is `.madewell`-gated — **do not reuse it for git**.
    agent-core and circadian have no `.madewell`. See repo resolution below.
- `PROJECT_ROOT` / `PROJECT_NAME` (:22, set at :458) are the project plane's
  scope. For the project plane, git's repo root is PROJECT_ROOT directly —
  no resolution needed.
- Git ground truth in the last 24h (verify these yourself; your render must
  match them exactly):

  | repo | commits | +ins | −del | unique files | tracked dirty |
  |---|---|---|---|---|---|
  | herdr-spine | 9 | 1419 | 272 | 4 | 2 |
  | agent-core  | 3 | 353  | 3   | 4 | 19 |
  | future      | 1 | 6962 | 104 | 12 | 0 |
  | circadian   | 0 | 0    | 0   | 0 | 2 |

  Reproduce with:
  ```
  git -C <root> log --since=24.hours --numstat --format='' \
    | awk 'NF==3{a+=$1;d+=$2;f[$3]=1} END{printf "+%d -%d files=%d\n",a,d,length(f)}'
  git -C <root> status --porcelain | grep -vc '^??'
  ```
- herdr-spine has exactly 2 modified TRACKED files right now
  (`bin/handlers/40-tower-bridge`, `docs/spawn.md`) — that is your
  `pending:` proof case. **Your own edits will change this count** — the two
  files you edit are tracked, so herdr-spine's pending will read 4 while you
  work. That is correct behavior, not a bug; state the observed number in
  your report.
- Live CTRL panes to respawn at the end: `w1A:pY` = "CTRL fleet" (machine
  plane, workspace w1A), `w1E:p3` = "CTRL circadian" (project plane,
  workspace w1E, `--project /Users/jrg/circadian`).

## Implementation requirements (binding)

### 1. Data acquisition — ONE git call per repo, async, 60s cache
- Use a single call per repo:
  `git log --since=24.hours --numstat --format=$'\x00%h\x1f%s'`
  NUL starts a commit record, US separates sha from subject; `numstat` lines
  are `adds\tdels\tpath` (binary files give `-`/`-` — treat as 0/0 but still
  count the file).
- **Must be async** (`Bun.spawn` + awaited streams, like `herdrCmd()` :136).
  `spawnSync` in the render path is forbidden — the 250ms render loop at :462
  must never block on git.
- **Refresh every 60s**, not per event and not on the 5s tick. Its own
  `setInterval(refreshGit, 60_000)` plus one immediate call at startup. Set
  `dirty = true` when the data changes so the next 250ms tick repaints.
- Also per repo: `git status --porcelain` → count lines NOT starting with
  `??` → `pending`. Same 60s cycle, same async rule.
- Failures (not a repo, git missing, non-zero exit) → that project simply has
  no SHIPPED entry. Never crash, never render an error row.

### 2. Repo root resolution
- Project plane: `PROJECT_ROOT`.
- Machine plane: for each project name in the current grouping, pick the
  first agent pane with a `cwd` and resolve
  `git -C <cwd> rev-parse --show-toplevel`. Cache root per project (roots do
  not change within a run). Dedupe by resolved root.

### 3. Display rules (binding — from the codified spec)
- Minus sign is **U+2212 `−`**, matching the spec text, not ASCII hyphen.
- **Machine plane**, after WORK:
  ```

  SHIPPED
    herdr-spine   9 commits · +1419 −272 · 4 files · pending: 2 files
      3a049be · feat(spine): CTRL two-plane WORK — machine-wide Made Well…
      402c1b1 · docs(spawn): fleet-mail topics are project-namespaced
      … (cap 5 commits)
      +4 more
  ```
  Project name column padded like `renderWorkMachine()` does (:370).
  Omit ` · pending: N files` entirely when N is 0.
- **Project plane**:
  ```
  SHIPPED  9 commits · +1419 −272 · 4 files · pending: 2 files
    3a049be · feat(spine): CTRL two-plane WORK — machine-wide Made Well…
        bin/ctl-fleet +156 −30
        docs/ctl-fleet.md +87 −14
  ```
  Cap 5 commits (`+N more`), cap 6 file lines per commit
  (`+N more files`).
- **NEVER** raw diffs, diff hunks, or code content. Paths and counts only.
- **Silence over noise:** a repo with **no commits in the 24h window renders
  nothing at all** — no header row, no pending line. On the machine plane, if
  no project has commits, omit the whole `SHIPPED` header too. (circadian has
  0 commits and 2 dirty files: it must render nothing. This is the literal
  reading of the binding rule — pending is a suffix on a commit rollup, never
  a standalone row.)
- Every emitted line goes through `truncate(line, cols)`. Secondary text
  (file lines, `+N more`) uses `DIM`…`RESET`.

### 4. Docs
Add a `## SHIPPED (git change signal)` section to `docs/ctl-fleet.md`,
placed after `## WORK (Made Well)` (:77) and before `## Row format` (:125).
It must state: the data source and the exact git command, the **60s cache
interval and why** (git polling per event would be wasteful; the window is
24h so 60s staleness is invisible), both plane formats, the silence rule, the
`pending` semantics (tracked changes only, `??` excluded), and the failure
behavior. Match the existing docs' voice — declarative, evidence-first.

## How We'll Know It's Done (verify with your own eyes, not by reasoning)
- [ ] `bun ~/herdr-spine/bin/ctl-fleet` runs clean; final `wc -l` ≤ 560.
- [ ] Machine-plane live capture showing SHIPPED for herdr-spine AND
      agent-core, numbers matching the ground-truth table above.
      Capture via: respawn `w1A:pY` then `herdr pane read w1A:pY` (or the new
      pane id) — a real pane, not a redirected run.
- [ ] Project-plane live capture WITH per-commit file summaries. circadian
      has 0 commits, so **spawn a herdr-spine project plane for the capture**:
      `bun ~/herdr-spine/bin/ctl-fleet --spawn <ws> --project /Users/jrg/herdr-spine`
      Read it, capture it, then close that scratch pane.
- [ ] `pending:` proven live against herdr-spine (a dirty repo) — the number
      in the pane must equal `git -C ~/herdr-spine status --porcelain | grep -vc '^??'`
      at capture time.
- [ ] circadian project plane (`w1E:p3`) shows no SHIPPED block — silence
      rule proven.
- [ ] Both live CTRL panes respawned **through their own spawn path**
      (`bun ~/herdr-spine/bin/ctl-fleet --spawn <workspace> [--project <root>]`),
      not by hand-running the script. Close the old pane first
      (`herdr pane close <id>`), then spawn, then verify the new pane renders.
      w1A → machine plane (no --project). w1E → `--project /Users/jrg/circadian`.

## Report back with (exact completion contract)
Reply in your pane with:
1. `git diff --stat` for your two files, and final `wc -l bin/ctl-fleet`.
2. The machine-plane capture (paste the SHIPPED block verbatim).
3. The project-plane capture (paste the SHIPPED block verbatim).
4. Ground-truth check: the git numbers you computed vs what the pane shows,
   stated as match/mismatch per repo.
5. The new pane ids for w1A and w1E after respawn.
6. Deviations from this brief, or the literal word "none".

Do not commit. Do not touch any file outside your partition.
