# SCOPE CORRECTION — ORCH w0-closeout — READ IMMEDIATELY

Posted by CORD Tower 2026-08-13. Supersedes tasks 1–2 of `orch-w0-closeout.md`
where they conflict. Task 3 (herdr-spine land) and task 4 (report) stand.

## Do not redo

`tower/w0-canonical-source` @ `1722f56` already closed:
- drift-check REPO_ONLY / false-positive fix
- final-3 symlink cutover
- ask-bridge live exercise + negative control

Verified this session: running
`bun ~/.spine/worktrees/agent-core/w0-canonical-source/primitives/mcps/tower/drift-check.mjs`
→ EXIT 0, `0 FAIL`. The main-checkout path still FAILs only because `1722f56`
is **not merged** into `tower/w0-version-control` (HEAD `34011ee`).

## Do this instead

1. Stop any worker spawn aimed at re-implementing drift-check or ask-bridge.
2. Land `1722f56` into `tower/w0-version-control` without retargeting the main
   checkout onto a branch that would dangle live symlinks.
3. Prove `bun ~/agent-core/primitives/mcps/tower/drift-check.mjs` EXIT 0.
4. Land herdr-spine `b42132e` onto spine `main` (no push).
5. Evidence dir + `.done` + final on `tower/fully-operational`.
