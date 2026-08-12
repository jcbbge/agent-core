# cursor-spine — interactive spawn path broken (two bugs, both pre-verified)

Repo: `~/cursor-shim/` (self-contained shim; `cursor-spine` is the atomic
spawn primitive). You are repairing fleet infrastructure, not project code.

## Bug 1 — herdr rejects multi-line instructions (HARD BLOCKER)

Pre-verified this session against the RUNNING herdr server (0.8.0):

- `herdr agent start <name> --kind cursor --pane <p> -- --force --trust
  --model composer-2.5 'line one\nline two'` →
  `{"error":{"code":"invalid_agent_argument","message":"agent arguments
  cannot be encoded safely for the target shell"}}`
- Cause (read the source, verify yourself): herdr
  (`~/source/herdr/src/app/agents.rs`, `start_agent`) rejects any arg
  containing a Unicode control char — `\n` included. cursor-spine passes the
  WHOLE composed instruction (role prompt + directive + brief, multi-KB,
  multi-line) as one positional argv element on the interactive path
  (`IA_ARGS … "$INSTRUCTION"`, ~line 558). Every interactive spawn with a
  real brief now fails; `hj()` swallows stderr (`2>/dev/null`, line 66) so it
  surfaces only as "herdr agent start failed".
- A short single-line prompt spawns fine (verified live).

**Fix direction (preferred, matches fleet law "briefs on disk"):** on the
interactive path, write the composed instruction to a job file (e.g.
`mktemp` / a job dir that the spawner's cleanup already manages, or a
stable path under the shim's state dir) and pass a SHORT single-line
instruction that names the file, e.g. `Your instruction file is <path>.
Read it in full and follow it exactly.` Keep the file alive for the agent's
lifetime needs (agents read it at start; a temp file that outlives the spawn
is enough — do not delete immediately). If you find the shim already has a
job-dir convention on the -p path, reuse it. Do NOT try to make herdr accept
control chars — the rejection is a safety property of the terminal
substrate; encode around it, don't fight it.

## Bug 2 — bare `--worktree` eats the instruction

Pre-verified: `cursor-agent --help` (2026.08.11-e8db854):
`-w, --worktree [name]` takes an OPTIONAL value; the parser greedily consumes
the next token. cursor-spine appends a BARE `--worktree` to both `CA_ARGS`
(~line 464) and `IA_ARGS` (~line 467), and the instruction is appended AFTER
it as the final positional — so cursor-agent tries to use the instruction as
the worktree name and dies:
`Error: Invalid --worktree name "Reply with…". Use only letters, numbers,
".", "_", or "-".` (observed live in a probe pane). herdr then reports
`timeout: timed out waiting for agent startup`.

**Fix:** always pass an explicit UNIQUE legal name (letters, numbers, `.`,
`_`, `-`), e.g. derived from label + pane id once known
(`wt-agnt-coder-w29-p5`). Note args are built (~lines 462-467) BEFORE the
pane id exists (~line 506) — defer or move the worktree arg for BOTH paths.
With bug 1 fixed the instruction no longer trails the flags on the
interactive path, but fix the flag properly anyway (the -p path still
appends the instruction as argv).

## Constraints

- Do not change gate semantics: forced `--worktree` for coder (~line 374),
  verify-mark/verify-status, and the break-glass audit stay exactly as-is.
- `hj()` swallowing stderr made this undebuggable — a narrow improvement
  (surface stderr on the failure paths) is in scope; broad refactors are not.
- herdr itself (`~/source/herdr`) is OUT of scope — shim-side only.

## Done when

1. `cursor-spine coder --brief <any.md> --dry-run` shows a short single-line
   instruction + `--worktree <legal-name>`.
2. Live proof: an interactive spawn with a real multi-line brief succeeds —
   herdr detects the cursor agent (no `invalid_agent_argument`, no startup
   timeout), the pane shows the TUI reading the instruction file. Reap the
   probe pane after.
3. Regression: a `cursor-spine researcher --headless --prompt "…"` one-shot
   still completes.
4. `bash ~/cursor-shim/docs/qa-verify.sh` passes (baseline was 71/71 —
   report the new count; if you added behavior, add the probe to the suite).
5. Report the full `git -C ~/cursor-shim diff` (or a precise file:line list)
   in your findings.

## Report back

Board topic `agent-core/assay-recall`, type=finding: what changed
(file:lines), live-spawn evidence, qa-verify count, any deviations.
