# UNIT shim-nonrepo-wall — cursor-spine/cursor-fleet: worktree isolation must not fire on non-git dirs

> From: CONCIERGE (operator directive 2026-08-12, verbatim law below). Through `cursor-fleet make` — full Verify beat (test-maker ∥ coder, separate worktrees of ~/cursor-shim).

## Operator law (verbatim, binding)

"any dot file is a config and not a specific repo" — dot-directories (`~/.tower`, `~/.fleet-tasks`, …) are config/state, NEVER project repositories. Worktree isolation is meaningless there and must not be attempted.

## Bug (observed twice today, live)

```
~/.tower cursor-agent --force --trust --model composer-2.5 --worktree wt-agnt-coder-w29-p17 ...
Error: Unable to resolve git repository from "/Users/jrg/.tower": fatal: not a git repository
```

- `cursor-spine` (~line 383) forces `--worktree` for EVERY `coder` spawn unless break-glass.
- `cursor-fleet make` forks implementer/test-maker worktrees unconditionally.
- Any coder spawn with `--dir` pointing at a non-git dir dies at launch (`herdr agent start failed`, `cursor-agent rc=1`). Hit today on w29:p14 and w29:p17 (~/.tower).

## Fix

1. In `cursor-spine`: gate the forced `--worktree` on `git -C "$DIR" rev-parse --git-dir` succeeding. Non-repo → do NOT pass `--worktree`; log loudly: `isolation: <dir> is not a git repo — worktree N/A, profile-discipline fallback` (the rules doc already names this fallback).
2. In `cursor-fleet make` (wherever the fork is executed): same guard — non-repo dir → skip worktree forking, spawn both roles in-place, log the fallback.
3. The CRITERIA GATE IS UNCHANGED: non-repo coder spawns still require authored test criteria; `CURSOR_VERIFY_GATE=off` remains the one documented break-glass. Only the filesystem isolation becomes conditional.

## Acceptance criteria

- AC1: `cursor-spine coder --brief <b> --dir <non-repo-dir>` (criteria authored) launches WITHOUT `--worktree` and logs the fallback line. (Today: dies at launch.)
- AC2: `cursor-spine coder --brief <b> --dir <git-repo>` still forces `--worktree` exactly as today.
- AC3: `cursor-fleet make <slug> --brief <b> --dir <non-repo-dir>` completes both spawns without the worktree error.
- AC4: `bash docs/qa-verify.sh` fully green (currently 76) + new cases covering AC1–AC3, demonstrated red-on-old / green-on-new.

## Constraints

- Repo: `~/cursor-shim` (git repo — normal bifurcation applies). Commits per convention; CORD gates.
- Do not weaken the verify gate or the break-glass audit. Do not touch herdr-spine (other missions own partitions there).
- Board topic: `cursor-shim/nonrepo-wall`. `.done`: `~/agent-core/briefs/shim-nonrepo-wall/.done/`.
