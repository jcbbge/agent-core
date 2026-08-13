# W5 Debris Inventory — live ~/.tower/**/*.bak* vs attic

Captured: 2026-08-13 (agnt-w5-debris). Attic path: `/Users/jrg/agent-core/primitives/mcps/tower/attic/`.

## Attic file counts

| When | Count (recursive `find attic -type f`) |
|------|----------------------------------------|
| Before deletes | 11 |
| After deletes | 11 |

## Inventory table

| live_path | size | sha256 | attic_path_or_NONE | verdict |
|-----------|------|--------|--------------------|---------|
| `/Users/jrg/.tower/cli.mjs.bak-20260812T165125Z` | 8518 | `b8c75410162b9295dfc3821583176bef6a0b680b49b4e5c524ff4c92e6df6c1b` | `/Users/jrg/agent-core/primitives/mcps/tower/attic/cli.mjs.bak-20260812T165125Z` | REMOVE |
| `/Users/jrg/.tower/COMMS-ARCH.md.bak-20260810T221108Z` | 6667 | `f196768b5d9701597714135e3742d98a9fa80d30c27c755dba0cacbc4d25f083` | `/Users/jrg/agent-core/primitives/mcps/tower/attic/COMMS-ARCH.md.bak-20260810T221108Z` | REMOVE |
| `/Users/jrg/.tower/COMMS-ARCH.md.bak-20260812T165025Z` | 10149 | `0fad1d9e5e8823d0df1904df66d246bf92f9412076ba2db894c4e879b709cd13` | `/Users/jrg/agent-core/primitives/mcps/tower/attic/COMMS-ARCH.md.bak-20260812T165025Z` | REMOVE |
| `/Users/jrg/.tower/lib.mjs.bak-20260812T194500Z` | 531 | `8f465ca2b0372890792fe4533353799298cdf082d135e11ecffe4381dcb3063d` | `/Users/jrg/agent-core/primitives/mcps/tower/attic/lib.mjs.bak-20260812T194500Z` | REMOVE |
| `/Users/jrg/.tower/server.mjs.bak-20260810T221108Z` | 13915 | `e82b43d539c19e2f837ec8be0e8ae24cc293bbd08a39cd7b73135c41343cb96b` | `/Users/jrg/agent-core/primitives/mcps/tower/attic/server.mjs.bak-20260810T221108Z` | REMOVE |
| `/Users/jrg/.tower/server.mjs.bak-20260812` | 16798 | `5657cf0f6a199baf9f195cfc697e8a3198dac7bdb3f4f958a4224661acf4ecd4` | `/Users/jrg/agent-core/primitives/mcps/tower/attic/server.mjs.bak-20260812` | REMOVE |
| `/Users/jrg/.tower/server.mjs.bak-20260812T165125Z` | 14169 | `9b12b00642f7567fc3339d843560391bc6e88d3a4fd60afcb92a3a0741edb59c` | `/Users/jrg/agent-core/primitives/mcps/tower/attic/server.mjs.bak-20260812T165125Z` | REMOVE |

## Summary (pre-act)

- REMOVE: 7
- KEEP-WITH-NOTE: 0

## Actions taken

All 7 REMOVE rows: live sha256 re-compared against attic in same shell breath immediately before `rm`. All deleted successfully. No KEEP-WITH-NOTE files written (zero unmatched).

## Post-check (2026-08-13)

- Residual live `.bak*`: 0 (`99-bak-list-after.txt` empty)
- Live non-bak intact: `cli.mjs`, `server.mjs`, `lib.mjs` present
- Attic file count unchanged: 11 before / 11 after
- Deleted live copies: 7
