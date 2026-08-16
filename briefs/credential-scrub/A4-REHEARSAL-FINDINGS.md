# A4 — rehearsal findings (throwaway clone)

Recorded by `orch-rewrite-executor` on 2026-08-16.

The credential literal is deliberately NOT written in this file. It is the
32-hex password from the parent brief; the rules file lives outside the repo at
`/Users/jrg/backups/credential-scrub-replace-rules-20260816.txt`.

## Rehearsal setup — why it is faithful

An ordinary `git clone ~/agent-core` does NOT reproduce the real repo's ref
topology: a clone creates `refs/remotes/origin/<each LOCAL branch of the
source>`, so the real `refs/remotes/origin/concierge/2026-08-12` and
`refs/remotes/origin/archive/pre-reboot-main-2026-04-07` would not have existed
in the rehearsal, and item 3 could not have been answered.

So the clone's auto-created remote-tracking refs were deleted and the real
repo's exact ref graph was replayed with `git update-ref`. Verified identical
before rewriting:

```
diff -q refs-before-sorted.txt refs-rehearsal.txt   # identical
git rev-list --all --count                          # 342
git status --porcelain                              # clean
```

Rehearsal path: `<scratchpad>/rehearsal`. Command run there:

```
git filter-repo --replace-text /Users/jrg/backups/credential-scrub-replace-rules-20260816.txt --force
```

Result: `Parsed 342 commits`, finished in 2.60s.

## 1. Is the token gone from every ref

Yes.

```
git grep -l '<token>' $(git rev-list --all)
# no output, exit 1 (no matches)
```

## 2. Do the three CSVs survive, changed ONLY at the token

Yes, all three. Each file still exists, line count unchanged, and every single
differing line is a token to `***REMOVED***` substitution.

| File | Lines before | Lines after | Changed lines | Non-token diff lines |
|---|---|---|---|---|
| `briefs/session-mining/fixtures-p3/commands.csv` | 5632 | 5632 | 2 | 0 |
| `primitives/tools/vein/test/acceptance/pass12-commands.csv` | 10113 | 10113 | 2 | 0 |
| `primitives/tools/vein/test/acceptance/pass3-commands.csv` | 6001 | 6001 | 2 | 0 |

The substitution is confined to the `PX="http://srt:<token>@localhost:54989"`
field; the rest of each affected row is byte-identical.

## 3. What happened to the refs — READ THIS BEFORE PUSHING

`filter-repo` did **not** drop the two non-main remote refs. It **converted
every remote-tracking ref into a local branch** and removed the `origin` remote
entirely.

- `refs/remotes/origin/concierge/2026-08-12` -> `refs/heads/concierge/2026-08-12`
  at `27615bb802127c68853cc6126f7207b6624b9881` — **SHA UNCHANGED**
- `refs/remotes/origin/archive/pre-reboot-main-2026-04-07` -> `refs/heads/archive/pre-reboot-main-2026-04-07`
  at `47c75d9c6e5df07d34039a62c6dfbc48d84d35a6` — **SHA UNCHANGED**
- `refs/remotes/origin/HEAD` and `refs/remotes/origin/main`: gone.
  `refs/remotes/*` count after rewrite is **0**.
- Local branch count goes **20 -> 22** (the two converted refs are new local
  branches that did not exist as local branches before).

**Correction to the parent brief:** it predicted these two refs "will still
change SHA because filter-repo rewrites every ref." They do not. Their SHAs are
byte-identical before and after, because neither branch has an ancestor whose
tree contained the token — the credential landed on `main` after those branches
diverged. Nothing needs to be force-pushed for them; they already match GitHub.

**Hazard for the coordinator (this is the real finding):** after the rewrite the
repo has 22 local branches and no remote. `git push --force --all` would create
**19 new remote branches on GitHub** — the 18 `wt-agnt-*` worktree branches plus
`feat/parity-verify-beat-roles` / `rescue/parity-verify-beat-roles` — which do
not exist on origin today. Origin currently has only `main`, `concierge/2026-08-12`,
and `archive/pre-reboot-main-2026-04-07`. Push `main` explicitly. Do not push
`--all`.

No `need-help` is warranted: the refs are preserved, so Phase B proceeds.

## 4. Predicted new `main` SHA

```
old  8e470a7d88a291395316415ba8eae94dcbe77ec1
new  2a054223d80771d354cac1bb53d05959966d2613
```

This prediction holds only if the real repo's ref graph at rewrite time is
still identical to `refs-before.txt`. Other agents land work here; B1
re-enumerates and the true new SHA is recorded then. If `main` has moved past
`8e470a7`, expect a different new SHA — that is not a failure.

## 5. Line counts

In the table under item 2. All three unchanged.

## Side effects observed

- `filter-repo` printed `NOTICE: Removing 'origin' remote`. B2 re-adds it.
- `filter-repo` ends with a hard reset / checkout of the rewritten `HEAD` —
  confirming the dirty-tree blocker is real and the B0 gate is required.
