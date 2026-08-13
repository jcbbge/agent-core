# URGENT — cli.mjs `post` writes to the wrong location post-swap

## The bug
`cli.mjs` line 159: `appendFileSync(new URL('./board.jsonl', import.meta.url).pathname, ...)`.
Per fact 4 (bun resolves symlinks to realpath before resolving relative specifiers),
now that `~/.tower/cli.mjs` is a symlink, `import.meta.url` reports the CANONICAL
path, so this line resolves to
`/Users/jrg/agent-core/primitives/mcps/tower/board.jsonl` — NOT `~/.tower/board.jsonl`.
This is distinct from the `status`/`board` (read) commands, which correctly use
`homedir()` (cli.mjs:52) and are unaffected.

Confirmed experimentally:
```
before: real(~/.tower/board.jsonl)=6051 lines   canon(repo)/board.jsonl=4 lines
$ bun ~/.tower/cli.mjs post note tower/w0-version-control "..." --from agnt-w0-swap
posted cli-41ac2be0-... (note) @ tower/w0-version-control      <- looks like success
after:  real=6051 (UNCHANGED)                    canon=5 (grew)
```
The command reports success and gives no indication anything is wrong.

## Real-world impact already observed
The canonical repo's stray `board.jsonl` (4 lines, before my test post) contains a
REAL live message from `orch-w0-canonical-source`, posted ~05:07–05:09Z via this
same broken path, addressed to `orch-w0-version-control` (my ORCH):

> HOLD REQUEST on AGNT w0-swap (w2W:p9) T3b ... install.sh:248-257 deploys
> stop-verdict.mjs + ask-bridge.mjs with NO sha guard ... cp follows symlinks ...
> the next divergent run writes THROUGH your new symlinks into the git working
> tree. Both files are in the swap's 19-path partition. Ask: hold the 2 hook
> symlinks (stop-verdict, ask-bridge) until I land T2, or accept a known-reverting
> swap.

This message never reached the real bus and I never saw it before completing T3b
(all 19 swapped, including both contested hooks).

## What I verified in response
- `hooks/ask-bridge.mjs` and `hooks/stop-verdict.mjs` in the canonical checkout are
  BYTE-IDENTICAL to my pre-swap snapshot (sha256 match), mtimes unchanged since
  Jul 30 / Aug 12 respectively, `git status --porcelain` on both is clean. No
  clobber has happened yet.
- The risk orch-w0-canonical-source raised (a future `install.sh` run doing an
  unguarded `cp` that follows the symlink and overwrites the canonical git file)
  is real but NOT triggered by anything I did, and not something I can fix from my
  file partition (I can only place/replace symlinks in `~/.tower/`, not edit
  `install.sh` or hook content).

## Fleet-wide implication
Any OTHER live pane currently using `bun ~/.tower/cli.mjs post` for real
coordination (the brief itself names `orch-docs-control-flow` as doing exactly
this) is now silently failing — their messages land in the git-tracked canonical
directory instead of the real board, with no error. This is a live, ongoing risk,
not just a historical one, until `cli.mjs`'s `post` handler is changed to resolve
via `homedir()` like `status`/`board` already do.

## Not touched
I did not modify `cli.mjs`, `install.sh`, or attempt any fix — out of my file
partition and a content/design decision for whoever owns that fix. I did not
delete the stray canonical `board.jsonl`/`ledger.jsonl` (they hold real evidence);
leaving them for CORD/ORCH to dispose of.
