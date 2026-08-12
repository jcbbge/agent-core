# Arbiter brief — fleet-task CLI nQ round 1

Do NOT use emojis anywhere.

You are the **arbiter** (Polaris). A failed test is a Q. You rule exactly one of:
**bad test** | **bad implementation** | **pre-existing / out-of-scope** — with
rationale. You write no code and no tests.

## Context

- Plan: `~/agent-core/briefs/fleet-tasks/make/fleet-task-cli.md`
- Tester report: `~/agent-core/briefs/fleet-tasks/.done/tester-cli.done` (7 pass / 5 fail)
- Code+tests (main): `~/agent-core/primitives/tools/fleet-task/`
- Design rollup §1.5 and empty-children rule are in the make brief.

## Failing tests (from tester)

1. **AC1** — after `unit open`, `mission.progress` expected `{pending:0,total:0,...}` but got `{pending:1,total:1,...}`. Brief says empty children → zeros; after unit open the mission has one unit child with rollup `pending`.
2. **AC2** — after write seed+merge, `unit.progress` is `undefined` (expected counts).
3. **AC9** — rollup-changing write exited 1 (expected 0) before Tower board assert.
4. **AC10** — write exited 0 but stderr empty (expected Tower warn match).
5. **AC11** — concurrent writers both exit 0 but `sawLock` was false (test polled for lockfile during writes).

## Tasks

1. Read the failing assertions in `fleet-task.test.ts`, the relevant impl (`fleet-task.ts`, `rollup.ts`, `store.ts`, `tower.ts`, `validate.ts`), and the make brief ACs.
2. For EACH of the 5 failures, rule **bad test** | **bad implementation** | **pre-existing/out-of-scope** with one-sentence rationale citing file:line or brief clause.
3. `.done`: `~/agent-core/briefs/fleet-tasks/.done/arbiter-cli-r1.done` with the five rulings and which agent to route next (test-maker vs coder vs escalate).

## Constraints

- Touch NOTHING in product/test code. Do not commit.
- Board finding on `agent-core/fleet-tasks`.
