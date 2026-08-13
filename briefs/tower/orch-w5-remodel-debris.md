# ORCH [w5-remodel-debris] — Rule the leftover `.bak-*` files (DRAFT — spawn when W4 gates)

DRAFT brief for CORD to activate after W4. Do not spawn until CORD posts GO.

## Intent

Nine (now ~7 remaining in `~/.tower/`) hand-rolled `.bak-*` files were preserved
into `primitives/mcps/tower/attic/` during W0 with 9/9 sha256 match. Rule each
remaining deployed `.bak-*`: content already in attic/git → safe to remove from
`~/.tower/` OR keep deliberately with a NOTE. Deleting attic/ or cc-hooks/ is
operator-reserved — never do that.

## Done-when (when activated)

1. Inventory live `~/.tower/**/*.bak*` vs attic; sha compare.
2. For each: KEEP-WITH-NOTE or REMOVE (only if sha in attic/history).
3. Evidence + board finding on `tower/fully-operational`.
4. No live bus code edits.
