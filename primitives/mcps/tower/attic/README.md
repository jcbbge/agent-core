# attic/

Point-in-time backups of Tower's code that predate version control. Tower's
canonical code was untracked in `~/.tower/` until W0 (2026-08-13) moved it to
this git-tracked directory. Along the way, `~/.tower/` accumulated ad-hoc
`.bak-*` and `.spine-backup-*` snapshots — manual and tool-made safety copies
taken before risky edits, with no git history behind any of them.

This directory preserves those 9 snapshots byte-for-byte so their content
exists in history, without leaving them scattered loose in the runtime
directory forever.

**What this is NOT:**
- Not live code. Nothing in `~/.tower/`, `primitives/mcps/tower/`, or
  anywhere else imports, requires, or executes anything under `attic/`.
- Not a substitute for the originals. The 9 backup files still sit in
  `~/.tower/` (8 at top level, 1 in `~/.tower/hooks/`) exactly where they
  were before this copy.
- Not a deletion. Whether to remove the originals from `~/.tower/` now that
  they're preserved here is a separate, later decision (W5) — the CORD's
  call, not this worker's.

See `DIFF-SUMMARY.md` for what each backup file actually contains relative
to the live file it backs up.

## Contents

| File | Backs up |
|---|---|
| `cli.mjs.bak-20260812T165125Z` | `~/.tower/cli.mjs` |
| `lib.mjs.bak-20260812T194500Z` | `~/.tower/lib.mjs` |
| `COMMS-ARCH.md.bak-20260810T221108Z` | `~/.tower/COMMS-ARCH.md` |
| `COMMS-ARCH.md.bak-20260812T165025Z` | `~/.tower/COMMS-ARCH.md` |
| `server.mjs.bak-20260810T221108Z` | `~/.tower/server.mjs` |
| `server.mjs.bak-20260812` | `~/.tower/server.mjs` |
| `server.mjs.bak-20260812T165125Z` | `~/.tower/server.mjs` |
| `server.mjs.spine-backup-20260730T211657Z` | `~/.tower/server.mjs` |
| `hooks/stop-verdict.mjs.spine-backup-20260812T221423Z` | `~/.tower/hooks/stop-verdict.mjs` |
