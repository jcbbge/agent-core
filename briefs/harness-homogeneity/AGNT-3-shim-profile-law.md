# AGNT-3 — close the two remaining shadowed profiles

You are a **coder (AGNT)**. You implement one focused unit from this binding
brief. Do NOT use emojis anywhere.

Your ORCH/CORD is `CORD [harness-homogeneity]`. Board topic:
`agent-core/harness-homogeneity`.

## Context in one paragraph

`~/cursor-shim/profiles/*.md` take whole-file precedence over
`~/agent-core/primitives/profiles/*.md` (`cursor-spine:503-505`). That
mechanism let the shim's `coder.md` silently drop the mandatory stigmergic
field law. That file has been fixed. An audit
(`~/agent-core/briefs/harness-homogeneity/DOCTRINE-SWEEP.md` §T1) found the
same gap in two more shim profiles and **recommended** closing it without
doing so. Your CORD ruled: close it. You are doing exactly that, and nothing
else.

## Pre-Verified Facts (your CORD verified every one personally, 2026-08-16)

- `~/cursor-shim/profiles/` contains exactly four files: `arbiter.md`,
  `coder.md`, `test-maker.md`, `tester.md`.
- **`coder.md` is DONE — do not touch it.** Its `## Stigmergic coordination`
  section is already byte-identical to agent-core's; verified by
  `awk '/^## Stigmergic coordination/{f=1} /^## Done looks like/{f=0} f'` over
  both files diffing clean (23 lines each).
- **`test-maker.md` (40 lines) and `tester.md` (28 lines) carry no field law.**
  Verified: `grep -rn 'Stigmergic\|pheromone\|work-available' ~/cursor-shim/profiles/test-maker.md ~/cursor-shim/profiles/tester.md`
  returns nothing.
- **`arbiter.md` (32 lines) is a deliberate exemption — leave it alone.**
  DOCTRINE-SWEEP §T1 reasons it is spawned fresh, pushed by the finisher on a
  red test, never pulls from the field and never goes idle mid-task, so
  heartbeat/TTL-evaporation have no referent. Your CORD accepts that reasoning.
- The canonical block to copy is
  `~/agent-core/primitives/profiles/coder.md`, from the line beginning
  `## Stigmergic coordination` through the line beginning
  `and \`… field\`.` — **23 lines.** Copy it verbatim. Do not paraphrase, do
  not reflow, do not reword.
- `~/cursor-shim` is on branch `doctrine/coder-profile-parity` @ `97073c5`,
  which is itself off `feat/a5-batch-record` — **not `main`.**

## Your file partition — binding

**You own, exclusively:**

- `~/cursor-shim/profiles/test-maker.md`
- `~/cursor-shim/profiles/tester.md`

**You must NOT touch anything else** — not `coder.md`, not `arbiter.md`, not
`cursor-spine`, not `cursor-fleet`, not `cursor-finish`, not any file under
`~/agent-core/` or `~/herdr-spine/`. The resolution mechanism at
`cursor-spine:503-505` is explicitly out of scope; you are fixing file
*content*, not how files are resolved.

## Tasks

### T1 — `test-maker.md`

Insert the 23-line `## Stigmergic coordination (COMMS-ARCH plane 5 — ranks
1-4)` block verbatim from agent-core's `coder.md`. DOCTRINE-SWEEP recommends
inserting after line 22, before `## Hard rules` — verify that is still the
right seam by reading the file first, and place it where it reads correctly.

Also add, in the file's header area, a one-line note in the same spirit as the
one now in the shim's `coder.md`: that this section is a verbatim copy kept in
sync by hand until PLAN Phase 5 replaces whole-file precedence with
composition.

### T2 — `tester.md`

Same block, same rules. DOCTRINE-SWEEP suggests after line 17
(`A human box is NEVER auto-ticked.`), before `## What you record` — again,
read first and place it where it reads correctly.

### T3 — Do not damage what is there

Both files carry real role law (the test-maker's independence from the
implementer; the tester's "first agent allowed to see both the code and the
tests", and the human-box rule). **Every existing line must survive.**

## Done when

1. `grep -c 'Stigmergic' ~/cursor-shim/profiles/test-maker.md` and the same for
   `tester.md` both return ≥ 1.
2. For **each** of the two files, this diff is **empty**:
   ```
   diff <(awk '/^## Stigmergic coordination/{f=1} /^## /{if(f && !/^## Stigmergic/) f=0} f' ~/agent-core/primitives/profiles/coder.md) \
        <(awk '/^## Stigmergic coordination/{f=1} /^## /{if(f && !/^## Stigmergic/) f=0} f' ~/cursor-shim/profiles/<file>)
   ```
   Verify the extraction actually captured 23 lines on both sides before you
   trust the diff — an anchor that matches nothing also diffs clean, and that
   is a false pass. State the line count you observed.
3. `wc -l` on both files shows they GREW by the inserted block and its note,
   and no original line was removed — prove it with
   `git -C ~/cursor-shim diff --stat` showing insertions only, zero deletions
   other than any line you deliberately reflowed (name it if so).
4. Committed on the **existing** branch `doctrine/coder-profile-parity` in the
   house format (`~/.claude/CLAUDE.md` §Work tracking: `<type>(<scope>):
   <summary>` + `PHASE:`/`DONE:`/`TODO:`/`BLOCKED:` + `Co-Authored-By:`),
   staged explicitly — never `git add -A`. **Do NOT merge, do NOT push to
   `main`, do NOT create a new branch.**

## Constraints

- **Do not bypass** `credential-guard`, the grounding hook, the write-gate, or
  the spawn-door. A refusal is information.
- **One write per file per thought.** The grounding guard blocks a second
  consecutive write to a file with no evidence read between. Read the file,
  compose the whole edit, write once. If you need a second write, Read it
  first, by contract.
- Do not spawn anything. This is a two-file edit.
- Reap nothing you did not create.

## Tower

- Board: `bun ~/.tower/cli.mjs post finding agent-core/harness-homogeneity "<body>" --from "AGNT-3 shim-profile-law"`
- Self-report: `~/herdr-spine/bin/spine-report task "<what>"` /
  `spine-report verdict "<result>"`
- Claim: `~/herdr-spine/bin/spine-claim claim "cursor-shim-profiles" --ttl 30`,
  heartbeat every 10-20s, `release` when done.

**Stigmergic field (you are rank 3 — and this brief is about that law, so
follow it):** deposit, never deliver. Emit `work-available` with **mandatory
evidence**; read the field before going idle; `work-claimed` `ref`-ing the
exact id; `work-done` `ref`-ing the claim; `need-help` rather than silence.
`bun ~/.tower/cli.mjs emit <scent> <topic> <payload_ref> [--ref id] [--evidence path] [--ttl N]` · `... field`

**Two legal stopping conditions only:** every done-when met, or a posted
`need-help` naming what is needed and who owns it, after doing everything that
does not depend on it.

**Final action:** write `.done-agnt-3-shim-profile-law` in
`~/agent-core/briefs/harness-homogeneity/` naming the commit SHA.

## Report back with

- The observed line count of the extracted block on both sides of each diff.
- `git -C ~/cursor-shim diff --stat` output and the commit SHA.
- Confirmation that `arbiter.md` and `coder.md` are untouched.
- Any Pre-Verified Fact above that turned out wrong.
