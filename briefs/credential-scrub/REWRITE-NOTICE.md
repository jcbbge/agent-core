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

## SHAs

| | SHA |
|---|---|
| old `main` (pre-rewrite) | `8e470a7` |
| **new `main` (recover to this)** | **`1c4bb0d`** |

Commit count unchanged at 342 through the rewrite; the pushed tip adds two
commits on top (the re-applied skills fix and the regenerated golden).

`concierge/2026-08-12` and `archive/pre-reboot-main-2026-04-07` were NOT
rewritten and did not need to be — both diverged before the credential landed,
and both were verified to contain zero occurrences.

## Recovering a stale clone

```
git fetch origin
git reset --hard origin/main
```

Uncommitted tracked work should be stashed first; untracked files are unaffected
by a rewrite. If you have local commits on the old history, re-apply them as
patches (`git format-patch` / `git am`) rather than merging — merging reintroduces
the old objects.

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

## Severity, honestly

Low. The credential was basic auth to `localhost` on an ephemeral port that no
longer exists. It granted nothing to anyone who cloned the repo. It was removed
because publishing a credential is wrong regardless of what it unlocks.
