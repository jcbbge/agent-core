# BRIEF — credential-guard: local pre-commit secret gate

Mission: GitHub push protection caught a real production DB password in
committed fixtures TODAY (local-only, contained). The operator mandates a
LOCAL equivalent: a pre-commit gate that refuses any commit whose staged
changes contain credentials — so a secret can never enter history again,
regardless of remote. Deterministic, fast, near-zero false positives.
Do NOT use emojis. Do not commit — the coordinator gates.

## Pre-Verified Facts (lead verified personally, 2026-08-12)
- The incident: DigitalOcean managed-Postgres password (`AVNS_` prefix —
  GitHub classifies as "Aiven Service Password") mined from a session
  transcript into vein fixtures, committed at 3ce033f. Working tree + HEAD
  now redacted (`AVNS_<REDACTED>` placeholders — these MUST NOT trigger the
  guard).
- agent-core hook state: `git config core.hooksPath` is UNSET; `.git/hooks/`
  contains only a coraline `post-commit` (leave it); no lefthook. A plain
  `.git/hooks/pre-commit` file is the mechanism.
- Canonical home for hooks: `~/agent-core/primitives/hooks/` (precedents:
  slim-guard.sh, session-boundary-cursor.sh). No symlinks anywhere
  (operator ruling) — installs are copies or 2-line exec shims.
- Staged content is read with `git diff --cached --unified=0` (scan ADDED
  lines only — a commit that only removes a secret must pass).
- VERIFY LAW (registry header): component-verify manifest + oracles BEFORE
  registration. Runner: `component-verify` (7 components, 21/21 today);
  exemplar manifest: `primitives/tools/component-verify/VERIFY.toml`.
- Commit convention including SOURCES lines: `primitives/AGENTS.md`.

## Parallel Work Notice
Vein fixture files are another mission's — do not touch them (use scratch
fixtures for tests). Touch ONLY: `primitives/hooks/credential-guard.sh`
(new), its `VERIFY.toml` + test/ (new, colocated under
`primitives/hooks/credential-guard.verify/` or a sibling pattern the
component-verify runner resolves — match how hook manifests are laid out
today, see VERIFY-session-boundary-cursor.toml), `~/agent-core/.git/hooks/
pre-commit` (new 2-line shim), `briefs/credential-guard.done` in your
worktree last.

TOWER-WAIVED handling: post CLAIM first and findings to board topic
`agent-core/credential-guard`; `.done` last.

## Tasks
1. `primitives/hooks/credential-guard.sh`: scans `git diff --cached
   --unified=0` added lines for, at minimum: `AVNS_[A-Za-z0-9_-]{10,}`,
   `gh[pousr]_[A-Za-z0-9]{30,}`, `github_pat_`, `sk-[A-Za-z0-9_-]{20,}`
   (covers sk-ant-), `AKIA[0-9A-Z]{16}`, `xox[abprs]-`, `AIza[0-9A-Za-z_-]{30,}`,
   `-----BEGIN .*PRIVATE KEY`, and URI basic-auth `://[^/:@]+:[^/@]{8,}@`.
   Placeholders never trigger: any candidate containing `REDACTED`,
   `EXAMPLE`, `XXXX`, `<`, or `${` is skipped. On hit: print file, line,
   pattern name, the match REDACTED to its first 6 chars, and exit 1.
   Clean: exit 0, silent. Override: `CREDENTIAL_GUARD=off git commit ...`
   passes but prints a loud OVERRIDE warning to stderr. The guard itself
   must never crash a commit on its own bugs — wrap, and on internal error
   print a warning and exit 0 (fail-open with noise, never fail-closed
   silently). Done when: a scratch repo commit staging `AVNS_`+14 random
   chars exits 1 naming the file, and a commit staging `AVNS_<REDACTED>`
   exits 0.
2. Install for agent-core: `.git/hooks/pre-commit` = 2-line exec shim to
   the canonical script (chain-safe: if a future pre-commit needs more,
   the shim stays the single entry). Done when: a real `git commit` in
   ~/agent-core of a scratch file containing a fake `ghp_` token is
   REFUSED, and the same commit with CREDENTIAL_GUARD=off lands (then
   revert it).
3. VERIFY.toml + oracles for the guard (contract lines: blocks live
   patterns · passes placeholders · removal-only diffs pass · override
   works with warning · internal-error fail-open). Done when:
   `component-verify` on this component PASSES and `--all` stays green
   (8 components).
4. Regenerate `briefs/component-verify.coverage.txt`. Done when: committed
   on your branch (coverage file only).
5. Report the one-command install for OTHER repos (e.g. `bash
   primitives/hooks/credential-guard.sh --install <repo>`) — implement the
   flag. Done when: `--install` into a scratch repo works end to end.

## Report back with
Per-task done-when evidence (commands + tails); every file created; the
pattern list as shipped; false-positive analysis against the CURRENT
agent-core tree (run the scanner over HEAD's tracked files and report hit
count — expect 0 after today's redaction); deviations with reasons.
