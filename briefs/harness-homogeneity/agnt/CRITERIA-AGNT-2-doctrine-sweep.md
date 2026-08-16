# Test criteria — AGNT-2 doctrine-sweep

Authored by `ORCH [doctrine-parity]` BEFORE implementation, 2026-08-16.
The unit produces an audit document plus one canonical directive edit, so the
oracle is completeness-and-citation checking, not a runtime suite. Every
criterion is checkable by a third party against the artifact.

Let `S` = the produced `briefs/harness-homogeneity/DOCTRINE-SWEEP.md`.
Let `D` = `primitives/directives/cursor.md`.

## C1 — every shim profile is accounted for

`S` names all four of `arbiter.md`, `coder.md`, `test-maker.md`, `tester.md`.
Zero omissions. For each of the three non-coder profiles `S` answers, with a
line-number citation:

- does it carry the stigmergic-field law? (expected: no)
- does it carry the two-legal-stopping-states rule? (expected: no)
- verdict: gap-to-close (as a recommendation, with the exact proposed text) or
  deliberate exemption — **with reasoning tied to the role**, not to
  convenience.

A verdict with no reasoning is a FAIL.

## C2 — the divergence table is complete and cited

`S` contains a table with columns: shim file · agent-core counterpart (or
none) · what diverges · verdict ∈ {shadowing defect, legitimate addition,
harmless}.

- Every row cites a file and at least one line number.
- No row reads "unknown" without the evidence that made it unknowable.
- The table covers `profiles/`, `rules/`, `docs/`, `levers/`, `briefs/`,
  `README.md`, the `bolt-on` file, and states once, with evidence, why the
  state dirs (`.instr/`, `.make/`, `.orch/`, `.verify/`) are excluded.
- `README.md:20` and `levers/lever-7-fanout.md:6,11` each get an explicit
  verdict against ORCH-1's change.

## C3 — the headline count is stated

`S` states, as a number: how many shim files shadow an agent-core counterpart,
and how many diverge in law rather than in role. The numbers must follow from
the table.

## C4 — the not-done ruling is recorded

`S` closes with a section stating the original `spine-claim` sweep
instruction, why it was not carried out, the evidence
(`spine-claim:157,213`; `primitives/skills/brief/SKILL.md` line ranges
**re-verified by the AGNT, not copied**), and that the ~35 historical briefs
were left untouched deliberately as the project record.

## C5 — the gate was respected

Exactly one `latch wait --file .../PROOF-cursor-spawn.md --timeout 2h`
invocation. No `sleep`. No polling loop. The exit code is reported.

- Gate closed (exit 3 or 4): `D` is **unmodified** —
  `git -C <worktree> status --porcelain primitives/directives/cursor.md`
  is empty — and a `need-help` pheromone/board post exists naming the gate and
  its owner. This is a PASS, not a failure.
- Gate open (exit 0): C6 applies.

## C6 — the directive tells the truth (only if the gate opened)

- The report quotes the literal `agent_status` -> `working` line from
  `PROOF-cursor-spawn.md` that the edit relies on. No quote, no edit.
- `D:10-11` names the real spawn path; the false parenthetical is gone.
- All 16 lines of `D` were read and no remaining line contradicts the new
  text; the daily-entry, `cursor-fleet make` Verify-beat, and repo-rule lines
  are each explicitly confirmed or corrected.
- Any required re-sync command is **named in the report and NOT run**.

## C7 — partition respected

```
git -C <worktree> status --porcelain
```
shows only `briefs/harness-homogeneity/DOCTRINE-SWEEP.md`,
possibly `primitives/directives/cursor.md`, and the `.done` marker.
Nothing under `primitives/HARNESS-PARITY.md`,
`primitives/rules/worktree-lifecycle.md`, `briefs/credential-scrub/`, or
`briefs/tower-bus-integrity/` is touched. `~/cursor-shim` is unmodified by
this agent (`git -C ~/cursor-shim status --porcelain` shows nothing this agent
caused).

## C8 — no commit

`git -C <worktree> log --oneline -1` is unchanged from the branch point. The
AGNT does not commit; the ORCH integrates.

## C9 — no emojis, no provider or model names

```
grep -niE 'claude|cursor-agent|gpt|opus|sonnet' S
```
Any hit justified in the report. `D` may name the harness — that is the file's
purpose — but not a provider or model.
