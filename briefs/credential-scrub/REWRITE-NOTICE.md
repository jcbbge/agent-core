# History rewrite — agent-core, 2026-08-16

`origin/main` was rewritten to remove a credential. Every clone taken before
this date is stale and cannot fast-forward.

## What changed

A localhost proxy credential (`http://srt:<32-hex>@localhost:54989`, basic auth
against an ephemeral port that no longer exists) was published in three files:

- `briefs/session-mining/fixtures-p3/commands.csv`
- `primitives/tools/vein/test/acceptance/pass12-commands.csv`
- `primitives/tools/vein/test/acceptance/pass3-commands.csv`

In each it was a captured `PX=` proxy env var inside mined session transcripts.
It was replaced with `***REMOVED***` across all history via `git filter-repo`.
The files themselves were kept — they are live `vein` acceptance fixtures.

## Recover to `origin/main` — not to a SHA

**The recovery target is `origin/main`. Do not pin a SHA from this document.**

A notice that names a fixed tip is wrong the moment one more commit lands, and
that already happened once here: an earlier draft named `1c4bb0d` as the
recovery target, but the act of committing the notice itself produced
`4d3058a`, making the document name its own parent. Anyone who had followed it
would have recovered one commit short — and without the notice.

| | SHA | Status |
|---|---|---|
| old `main`, pre-rewrite | `8e470a7` | historical. The last tip that still carried the credential. |
| tip when this was written | `4d3058a` | **informational only, already stale.** Not a recovery target. |

`main` was 193 commits at the time of writing and carries zero occurrences of
the credential, verified against `origin/main` after a fresh fetch. Treat the
count the same way as the SHA above — informational, and stale as soon as
anything lands. The zero is the durable claim; re-verify it yourself with the
command below rather than trusting this number.

`concierge/2026-08-12` and `archive/pre-reboot-main-2026-04-07` were NOT
rewritten and did not need to be — both diverged before the credential landed,
and both were verified to contain zero occurrences. They need no recovery
action at all.

## Recovering a stale clone

```
git fetch origin
git reset --hard origin/main
```

Uncommitted tracked work should be stashed first; untracked files are unaffected
by a rewrite. If you have local commits on the old history, re-apply them as
patches (`git format-patch` / `git am`) rather than merging — merging reintroduces
the old objects.

To confirm you are clean afterwards, this must print nothing:

```
git fetch origin && git grep -l 'REMOVED' origin/main -- primitives/tools/vein/test/acceptance/pass3-commands.csv >/dev/null && git log origin/main --oneline -1
```

(That prints the current tip if the scrubbed fixture is present — if the command
fails, you are not on the rewritten history.)

## Unpushed local branches still carry the credential

The rewrite fixed `main`. It did **not** fix branches that live only in local
clones. In the working repository at the time of writing, **19 local branches
still reach commits containing the credential**:

- `feat/parity-verify-beat-roles`
- `rescue/parity-verify-beat-roles`
- 17 `wt-agnt-*` worktree branches

Measured: those 19 branches reach 163 commits between them, of which **108
contain the credential** and are not reachable from `origin/main`.

**None of them exist on origin.** Pushing any one of them would restore the
credential to GitHub and undo this entire exercise. In particular, never run
`git push --all` or `git push --mirror` from a repository that still has them.

They are **not** being deleted here — that is not this unit's call. If you own
one, either rewrite it onto the new history or delete it deliberately.

## One non-obvious consequence, recorded so it is not rediscovered

`pass3-commands.csv` could not simply be substituted. `vein` records
`result_bytes` and `result_sha256` of each command's RAW OUTPUT. One mined
session ran an `env | grep` whose output carried the credential 13 times, so
scrubbing the transcript shortened that output (1621 -> 1374 bytes) and changed
its SHA-256. No placeholder choice can hold a hash constant. That file is a
DERIVED artifact and was regenerated from the scrubbed corpus, not patched:
6001 rows unchanged, 3 lines differ, 0 credential occurrences.

The transcript was scrubbed in place at its real path, because the CSV's
`source_path` column records absolute paths — scrubbing a copy would have
changed `source_path` and broken the oracle for a reason unrelated to the
credential.

The same reasoning applies to `command_sha256` and `command_norm_sha256`:
`filter-repo` rewrites the visible command text but cannot recompute a hash
column. `pass12-commands.csv` and `fixtures-p3/commands.csv` were left as
`filter-repo` produced them and therefore hold scrubbed text beside pre-scrub
hashes. That is cosmetic and not a leak, but do not treat those hash columns as
verifiable.

## Severity, honestly

Low. The credential was basic auth to `localhost` on an ephemeral port that no
longer exists. It granted nothing to anyone who cloned the repo. It was removed
because publishing a credential is wrong regardless of what it unlocks.
