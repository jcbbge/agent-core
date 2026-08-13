# Unit 3 — shim-pwd-stamp

Repo: `/Users/jrg/cursor-shim` (git, bash 3.2, `set -euo pipefail`). Do NOT use emojis anywhere.
Board topic: `cursor-shim/spawn-finishing`. Workers never commit. No mocks; tests are static/dry-run only.

Mission: `cursor-fleet up` creates a project workspace but never stamps its `$pwd`
metadata, so the herdr sidebar L2 row cannot show where the workspace lives. Add the
stamp at workspace creation, matching spine-spawn `stamp_workspace_pwd` semantics
(absolutize cwd, `--ttl-ms 86400000`, NON-FATAL warn+continue).

## Pre-Verified Facts (ORCH verified personally this session, main @ 822cd83)

- Insertion point: `~/cursor-shim/cursor-fleet`, `up` verb. `DIR` bound at :107
  (`--dir` or `$PWD`). Workspace create :117-120. `WS_ID` at :118, `CORD_PANE` at
  :119. Die guard at :120 (`[[ -n "$WS_ID" && -n "$CORD_PANE" ]] || die ...`).
  Stamp AFTER that die guard (both ids known-valid); BEFORE CORD launch at :123-127.
- Carrier syntax (live `herdr workspace report-metadata --help` this session;
  spine-spawn prior art `~/herdr-spine/bin/spine-spawn` :482-504 puts workspace id
  immediately after the subcommand, then flags — MATCH THAT ORDER):
  `herdr workspace report-metadata <WS_ID> --source cursor-fleet --token "pwd=<abs>" --ttl-ms 86400000`
  Via existing helper: `hj workspace report-metadata "$WS_ID" --source cursor-fleet --token "pwd=$ABS_DIR" --ttl-ms 86400000`
- spine-spawn `stamp_workspace_pwd`: `os.path.abspath(cwd)`, `--source spine-spawn`,
  `--ttl-ms 86400000`, NON-FATAL (failure logs warning, never kills spawn). Match
  non-fatal exactly: on failure `log "WARN: ..."` and continue. Existing warn
  pattern: cursor-fleet :200 (`|| log "WARN: ..."`). Use `--source cursor-fleet`
  (not spine-spawn).
- `DIR` may be relative when passed as `--dir`; absolutize before stamping.
  Established pattern in this repo: python3 realpath one-liner (cursor-fleet :243
  style):
  `ABS_DIR="$(/usr/bin/python3 -c 'import os,sys; print(os.path.realpath(sys.argv[1]))' "$DIR")"`
- `hj()` (:64) is `"$HERDR" "$@" 2>/dev/null` — stderr discarded; exit code still
  propagates. With `set -e`, use `hj ... || log "WARN: ..."` (the `||` arm keeps
  the script alive). Do NOT introduce a second herdr wrapper.
- qa-verify suite: `docs/qa-verify.sh`, `ck()` at :12. NO pipefail (:5-7). Static
  greps ONLY for this unit — `up` has no dry-run; a live `up` creates a real
  workspace (FORBIDDEN in tests, cf. 78fa55c/6c85350). Scope greps to the up
  block: `sed -n '/^up)/,/^orch)/p' cursor-fleet`. Required signals: report-metadata
  call present, `--source cursor-fleet`, `pwd=` token, `--ttl-ms 86400000`,
  non-fatal guard (`||` / WARN). Baseline this session: 124 passed, 0 failed.
  C8 gate `PASS >= 99` near Hygiene still grows automatically.
- Live evidence that a FRESH `cursor-fleet up` workspace carries `$pwd` is CORD's
  land-time check — NOT yours, NOT the suite's. Do not live-spawn workspaces.

## Acceptance criteria

- AC1: `cursor-fleet up` stamps `pwd=<abs DIR>` on the new workspace via
  `hj workspace report-metadata "$WS_ID" --source cursor-fleet --token "pwd=..."
  --ttl-ms 86400000` (after die guard :120, before CORD launch).
- AC2: stamp failure is non-fatal (warn + continue; workspace create + CORD launch
  still succeed).
- AC3: `bash docs/qa-verify.sh` green with new static cases (0 fail).

## Partition (DISJOINT — both workers must honor)

| Role | Touches ONLY |
|---|---|
| **coder** (implementer) | `cursor-fleet` ONLY (the `up` block; header usage line only if it must change — this unit adds no new flags, so leave the header alone unless a one-line comment already documents up behavior and needs a pwd note; prefer zero header churn) |
| **test-maker** | `docs/qa-verify.sh` ONLY (new `### shim-pwd-stamp` section) |

Ignore uncommitted changes outside your partition. Do not investigate, revert, or fix them.

## Parallel Work Notice

Coder and test-maker run in parallel via `cursor-fleet make` bifurcation (separate
worktrees). Post CLAIM first, findings during, `.done` last to Tower board topic
`cursor-shim/spawn-finishing` (mcp__tower__board_post / board_read). Read the board
before claiming files.

## Tower

- CLAIM your partition on `cursor-shim/spawn-finishing` before editing.
- Post findings with specific numbers at meaningful checkpoints (not heartbeats).
- On Herdr: `spine-report task "..."` at start, `spine-report verdict "..."` when done.
- `.done` marker last. Do NOT commit. Do NOT send operator mail.

## Implementation shape (coder — build from this plan, not from tests)

In the `up)` block of `cursor-fleet`, immediately AFTER the die guard at :120 and
BEFORE the CORD `SPINE_ARGS` / `"$SPINE"` launch:

1. Absolutize `DIR`:
   `ABS_DIR="$(/usr/bin/python3 -c 'import os,sys; print(os.path.realpath(sys.argv[1]))' "$DIR")"`
2. Stamp (non-fatal):
   `hj workspace report-metadata "$WS_ID" --source cursor-fleet --token "pwd=$ABS_DIR" --ttl-ms 86400000 \`
   `  || log "WARN: failed to stamp pwd on workspace $WS_ID"`
3. Keep existing create log / CORD launch / STATEM / JSON printf unchanged.
4. Match surrounding style (hj, die/log). Comment only if it states a constraint
   (e.g. non-fatal), not narration.
5. `bash -n cursor-fleet` must exit 0. No commit.

## Test shape (test-maker — derive ONLY from this plan, never from coder checkout)

Add `### shim-pwd-stamp` to `docs/qa-verify.sh` (before Hygiene), static greps only.
Suggested cases (names may vary; coverage must map to AC1-AC2):

- up block contains `report-metadata` (`sed -n '/^up)/,/^orch)/p' cursor-fleet`)
- up block contains `--source cursor-fleet`
- up block contains `pwd=` (token form)
- up block contains `--ttl-ms 86400000`
- up block has non-fatal stamp guard (e.g. `||` near report-metadata / WARN)
- optional: up block absolutizes via python3 realpath (or equivalent abs path) before stamp

Do NOT call `cursor-fleet up`. Do NOT create workspaces. C8 still passes.

## Tasks (by role)

### coder — done when:
1. `up` stamps `pwd=<abs>` via report-metadata with `--source cursor-fleet` and
   `--ttl-ms 86400000`, after die guard, before CORD launch.
2. Stamp failure is non-fatal (`|| log "WARN: ..."`).
3. `bash -n cursor-fleet` exits 0.
4. CLAIM posted, report posted, `.done` written. No commit.

### test-maker — done when:
1. New `### shim-pwd-stamp` section with static `ck` cases covering AC1-AC2 signals
   listed above (no live `up`).
2. Assertions are plan-derived and will be green once coder lands.
3. Do NOT read coder's worktree or implementation.
4. CLAIM posted, report posted, `.done` written. No commit.

## Constraints

- Touch ONLY your partition. No commits.
- Testing: NO MOCKS; static greps only — never live `cursor-fleet up`.
- Match existing style (hj, die/log). Comments state constraints, not narration.
- bash 3.2 compatible; `set -euo pipefail` safe.
- Workers do not merge worktrees; ORCH/CORD collect and land.

## Report back with

- Per-file diff summary (paths you touched).
- For coder: exact stamp lines inserted (placement relative to die guard / CORD launch);
  how ABS_DIR is computed; exact WARN text.
- For test-maker: the new `ck` case name list.
- Board CLAIM/DONE ids (or board row timestamps).
- Deviations + reasons.
- Confirmation: no commit performed.
