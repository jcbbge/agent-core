# worker tower-server-drift — reconcile ~/.tower/server.mjs

> From: CONCIERGE (operator ruling 2026-08-12: fix, don't flag). Binding.
> Target: `~/.tower/server.mjs` (NOT a git repo — live state dir; profile
> discipline, no worktree). Board topic: `tower/server-drift`.

## Symptom (pre-verified, tonight's herdr-spine install.sh output)

`~/.tower/server.mjs` sha 5657cf0f matches neither canonical nor pre-fold
base 63ec724d — install.sh refuses to overwrite and warns: "Merge relay_inbox
manually." The drift blocks install idempotence.

## Mission

1. Read `~/herdr-spine/install.sh` to find the CANONICAL server.mjs path and
   how the sha comparison works.
2. Three-way the situation: canonical vs base (63ec724d) vs live (5657cf0f).
   The live file carries the `relay_inbox` work (and possibly the defensive
   parsing + inboxState fixes landed tonight — check `git log`/`ls -la`
   timestamps and the file itself; tonight's Tower CLI fixes touched
   `~/.tower/cli.mjs`, `lib.mjs`, `cli.test.mjs` — server.mjs drift may
   predate them or include them).
3. Merge so that: live keeps every behavioral fix, canonical gains
   `relay_inbox`, and the shas reconcile (or install.sh's expectation is
   updated — whichever is TRUE; do not force a match by destroying work).
4. Back up the live file BEFORE editing (`server.mjs.bak-20260812`).
5. Verify: `bun ~/.tower/cli.test.mjs` green (26 tests tonight); the MCP
   server path (`~/.tower/server.mjs` stdio) still starts — a smoke invoke,
   not a restart of anything the operator is using.

## Done-when

- Drift resolved: install.sh no longer warns (re-run it to prove).
- Tests green; backup on disk; findings to `tower/server-drift`.
- Report-back: what the drift actually was (who added what, when).
