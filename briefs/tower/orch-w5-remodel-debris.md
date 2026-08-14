# ORCH [w5-remodel-debris] — Rule leftover `.bak-*` files now that W0 has real history

You own ONE unit: inventory every remaining `~/.tower/**/*.bak*` against
`primitives/mcps/tower/attic/`, then either remove deployed copies whose content
is already in git history/attic, or KEEP with an explicit NOTE. Do NOT use emojis.

Your CORD is `CORD [Tower]` (w2Y:p1). Work in a git worktree if you edit docs;
prefer no code changes. Main checkout serves live symlinks — do not branch-switch it.

## Pre-Verified Facts (CORD 2026-08-13)

1. W0 preserved backups into `~/agent-core/primitives/mcps/tower/attic/` with
   DIFF-SUMMARY.md / README. Attic listing includes the historical `.bak-*` set.
2. Live `~/.tower/` still has (re-verify):  
   `cli.mjs.bak-20260812T165125Z`, `lib.mjs.bak-20260812T194500Z`,
   `COMMS-ARCH.md.bak-20260810T221108Z`, `COMMS-ARCH.md.bak-20260812T165025Z`,
   `server.mjs.bak-20260810T221108Z`, `server.mjs.bak-20260812`,
   `server.mjs.bak-20260812T165125Z` (count may differ — inventory live).
3. **Deleting attic/ or herdr-spine cc-hooks/ is OPERATOR-RESERVED.** Never.
4. Removing a deployed `.bak-*` is allowed ONLY when sha256 matches an attic
   (or git) copy — prove match in evidence. If no match: KEEP-WITH-NOTE.
5. Do not touch live `cli.mjs` / `server.mjs` / hooks (non-bak). Do not rewrite
   board.jsonl. Topics: `tower/w5-debris` + `tower/fully-operational`.
6. W3/W4 landed: main `a62e746` (rotate) after `f60cf8e` (plane fixes).

## Tasks

1. **Inventory** — done when: evidence table of every live `.bak*` path, size,
   sha256, matching attic path or NONE.
2. **Act** — done when: each row is REMOVE (deleted from `~/.tower` only after
   sha match proven) or KEEP-WITH-NOTE (NOTE file beside it or in evidence).
3. **Report** — `.done` + board final; list what remains on purpose.

## Constraints

- Never delete attic/. Never delete unmatched bak. Backup list before deletes.
- Visible panes. No push.

## Report back with

Inventory table, actions taken, residual KEEP list, GO/NO-GO for W5.
