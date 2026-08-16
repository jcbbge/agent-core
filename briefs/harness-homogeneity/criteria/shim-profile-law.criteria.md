# Acceptance criteria — AGNT-3 shim profile law

Authored by `CORD [harness-homogeneity]` 2026-08-16, **before** implementation
and by a party that is not the implementer (`gates/` in `~/tup/contracts/shape.md:127`:
"the party writing acceptance criteria is never the party writing the
implementation").

Target brief: `~/agent-core/briefs/harness-homogeneity/AGNT-3-shim-profile-law.md`
Unit key: `ade92e367187091e`

## What is being accepted

Two shim profiles that silently omit mandatory law must carry it verbatim,
without losing any law they already carry.

## Criteria

### C1 — the block is present in both files

`grep -c 'Stigmergic' ~/cursor-shim/profiles/test-maker.md` ≥ 1
`grep -c 'Stigmergic' ~/cursor-shim/profiles/tester.md` ≥ 1

### C2 — the block is verbatim, not paraphrased

For each of `test-maker.md` and `tester.md`, the extracted
`## Stigmergic coordination` section must be byte-identical to the one in
`~/agent-core/primitives/profiles/coder.md`.

**Anti-false-pass guard (this is the criterion that matters):** the extraction
must be shown to have captured **23 lines on both sides** before the diff is
believed. An anchor matching nothing also diffs clean. A report that shows an
empty diff without stating both line counts **fails C2.**

### C3 — nothing was destroyed

`git -C ~/cursor-shim diff --stat` on the two files shows insertions with
**zero deletions**, or names every deleted line and why it was reflowed.

Specifically, these must survive:
- `test-maker.md` — its independence-from-the-implementer law.
- `tester.md` — "first agent allowed to see both the code and the tests", and
  the rule that a human box is NEVER auto-ticked.

### C4 — blast radius

`git -C ~/cursor-shim status --porcelain` shows changes to **exactly two
files**: `profiles/test-maker.md` and `profiles/tester.md`.
`coder.md` and `arbiter.md` must be byte-unchanged — prove with
`git -C ~/cursor-shim diff --stat HEAD -- profiles/coder.md profiles/arbiter.md`
producing no output.

### C5 — branch discipline

Committed on the existing branch `doctrine/coder-profile-parity`. Not merged,
not pushed to `main`, no new branch created.
`git -C ~/cursor-shim branch --show-current` returns
`doctrine/coder-profile-parity`.

### C6 — the exemption is respected

`arbiter.md` must NOT gain the block. DOCTRINE-SWEEP §T1 exempts it with stated
reasoning (spawned fresh, pushed not pulled, never idle mid-task, so heartbeat
and TTL-evaporation have no referent). Adding law there would be
over-application, and fails this criterion.

## How a reviewer runs this

```
cd ~/cursor-shim
git branch --show-current
git status --porcelain
git diff --stat HEAD -- profiles/coder.md profiles/arbiter.md
for f in test-maker tester; do
  echo "== $f"
  awk '/^## Stigmergic coordination/{f=1} /^## /{if(f && !/^## Stigmergic/) f=0} f' \
    ~/agent-core/primitives/profiles/coder.md | wc -l
  awk '/^## Stigmergic coordination/{f=1} /^## /{if(f && !/^## Stigmergic/) f=0} f' \
    profiles/$f.md | wc -l
done
```

Both counts must read 23 on every line printed, and the two diffs must be
empty. Anything else is a fail.
