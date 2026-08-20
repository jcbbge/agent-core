---
name: agentcore
description: Boot, audit, or onboard a harness with the agent-core stack — the operator door to the primitive registry. Use when the user says "/agentcore", "boot <harness> with my stack", "onboard <harness>", "audit my agent-core", "why is my stack broken", "install my primitives into <harness>", or names a harness they want outfitted. Also use when a capability that should be live (memory at wake, guards, gates) appears to be doing nothing.
argument-hint: doctor | boot <harness> | onboard <harness> | parity
disable-model-invocation: true
allowed-tools: Bash Read Write Edit Glob Grep WebFetch
---

You are operating the agent-core registry — the operator's harness-agnostic
stack of primitives (directives, skills, subagents, commands, rules) and the
lifecycle bindings that make them behave.

Requested operation: **$ARGUMENTS**

Read these two first, always:

- `~/agent-core/primitives/HARNESS-SHAPE.md` — the shape every harness is mapped
  onto, and the laws below that you must not re-derive.
- `~/agent-core/primitives/COMPONENTS.md` — the flat component map. Use it
  whenever you reason about a TOOL rather than a file, because the registry is
  indexed by primitive and cannot answer "what is circadian". A component is
  multi-modal: one tool may own a CLI, several lifecycle hooks, a directive
  snippet, a skill, an MCP server, and a background service. Fix a component's
  surfaces together or you will fix one and leave the rest dark.

`HARNESS-PARITY.md` is per-harness state; consult it for a specific harness.

Pick the verb from `$ARGUMENTS`. If it is empty or unclear, run **doctor**.

---

## Standing laws for every verb

- **Provider/model/harness-agnostic.** Never name a provider, model, or vendor in
  anything you write into the store. Capabilities are described by path and CLI.
- **Verify, don't assume.** Every path, event name, and command you write must be
  confirmed this session — read the file, run the command, fetch the doc. No
  reasoning by analogy from another harness. `UNKNOWN` is a legal value; a guess
  is not.
- **A capability with no registry row is unmonitored.** See the law at the top of
  HARNESS-SHAPE.md. Never finish a wiring task without the row that proves it.
- **Never `git add -A`.** Stage explicitly.
- **Back up before editing shared config.** `cp <file> <file>.bak-$(date +%s)`
  for `~/.agent-core/registry` and any harness config. These files are how the
  machine boots.
- **One write per file per thought** (the grounding guard enforces this). Compose
  the whole edit, then fire once. If you must write a file twice, Read it first.

---

## Verb: doctor

The default. Answer "is my stack actually live, and if not, exactly what do I run".

1. `~/agent-core/cli/zig-out/bin/agent-core status` — capture the summary line
   and every `✗` / `?` row.
2. Classify each failing row by its verb, because the fix differs:
   - **`deploy` row failing** → agent-core owns those bytes; the fix is
     `agent-core sync <id>` or `agent-core sync --harness <name>`. Cheap, safe.
   - **`check` row failing** → a BINDING is missing from a harness config. The
     fix is to wire it, then re-audit. Read the config, add the entry at the
     right event, back up first.
   - **`link` / `binary` row failing** → another program's installer or a
     `zig build` is behind. Name the owning program and run ITS installer; do not
     hand-place a symlink or a binary.
3. For a failing row, check whether the target MOVED before declaring it broken.
   A retired forwarder stub at the old path with the real door at a new path is a
   retarget, not a repair.
4. Cross-check the three things `agent-core status` structurally cannot see:
   - **Unregistered capabilities.** Diff the live harness configs against the
     capability table in HARNESS-SHAPE.md. Anything bound in a config but absent
     from the registry is the next silent outage. Register it as a `check` row.
   - **Unrowed component surfaces.** Walk `COMPONENTS.md`. For each component,
     confirm every surface it claims is real (CLI on PATH, service loaded, MCP
     registered, hooks bound) and that each owns a row. A `✗ GAP` there is a
     capability that cannot fail an audit. Report new gaps and stale ones.
   - **Stale prose.** `primitives/HARNESS-PARITY.md` states a current ok/stale/
     missing count. If it disagrees with the live summary, the doc is wrong —
     fix the doc, never leave the two disagreeing.
5. **Half-live components are the highest-value finding.** A component whose
   write surfaces are bound but whose read surface is not will look healthy from
   every angle except the one that matters. That is exactly how circadian failed
   on 2026-08-20: `graze` and `sleep` fired in every harness while `wake` fired
   in one, so memory accumulated and was never read. When you check a component,
   check that its surfaces are consistent with each other — not merely present.
6. Report: the live summary, each failing row with its one-line cause and exact
   fix command, and any capability you found live-but-unregistered.

Apply fixes when the user asked you to fix, or when the fix is a `sync` of
agent-core's own managed bytes. Ask before editing a harness config the user has
not mentioned.

---

## Verb: boot <harness>

Install the stack into a harness that is ALREADY registered (it has a `harness`
block in `~/.agent-core/registry`). If it has no block, run **onboard** instead.

1. Confirm registration: `grep -A10 "^harness <name>" ~/.agent-core/registry`.
   Confirm the harness's config dir actually exists on disk.
2. `agent-core sync --harness <name> --dry-run` → show the user what would land.
3. `agent-core sync --harness <name>` → deploy the file surface.
4. Walk the binding surface. For each capability in HARNESS-SHAPE.md Half 2 that
   this harness supports, confirm the binding exists in its hook config. Add what
   is missing at the correct event name, preserving existing entries and the
   `wake` ordering law (legs 1–3 before leg 4).
5. `agent-core status --harness <name>` → require 0 stale, 0 missing.
6. **Prove the bindings, don't infer them.** For each hook you touched, run it
   standalone with a representative payload on stdin and show its real output.
   Never report a binding as live because the config parses.
7. Report what deployed, what you bound, what you proved, and every remaining gap.

---

## Verb: onboard <harness>

Map a harness nobody has onboarded onto the shape, then boot it. This is the
verb the whole design exists for: agent-core holds the shape; you do the mapping.

1. **Locate it.** Confirm the harness is installed — binary on PATH, version
   output, config dir present. If it is not installed, stop and say so.
2. **Run the API-surface interview** in HARNESS-SHAPE.md, all fourteen questions.
   Sources, in order of preference: official docs (fetch them), the harness's own
   `--help`, its config schema, then local repro. For every hook event, determine
   the input schema and the output/injection contract EMPIRICALLY — write a
   throwaway hook that dumps its stdin, bind it, start a session, read what
   arrived. Assumed schemas are how bindings end up silently dead.
3. **Report the mapping to the user BEFORE writing anything.** A table: each
   agent-core capability → this harness's event name / directory / mechanism, or
   `NONE` where the harness has no equivalent. Every `NONE` is a parity gap, and
   a gap must name what it would need (copy, shim, port, adapter). Get the user's
   confirmation on the mapping.
4. **Write the profile.** Back up the registry, then add the `harness` block
   (answers 1–7) and a `deploy <name>` line on each primitive the harness should
   carry. Match the file's existing comment style; explain any non-obvious choice
   inline, and date it.
5. **Write the directive delta** at `primitives/directives/<name>.md` — only the
   harness-specific facts (its spawn verb, its config paths, its hook mechanism).
   Core doctrine stays in `primitives/AGENTS.md`. Then add the harness to the
   `directive/core` primitive's deploy list so its entrypoint gets composed.
6. **Run boot** (above) for the file surface and the bindings.
7. **Register every binding** as a `check` row with a needle pointing at the
   binding's own defining substring.
8. **Update `HARNESS-PARITY.md`** — add the harness's column, fill every row,
   and record each gap with its reason. A blank cell is a NO.
9. **Prove it end to end.** Start a real session in the harness and show the
   evidence: the injected context block, a guard refusing something it should
   refuse, a gate firing. Then report.

---

## Verb: parity

Reconcile the human-readable parity doc with live reality.

1. Run `agent-core status` and derive, per harness, which primitives and
   capabilities are ✓ / ✗ / `?`.
2. Rewrite the matrix and the stated count in `primitives/HARNESS-PARITY.md` to
   match. Keep the struck-through historical corrections — that file's convention
   is that a superseded ruling stays visible beside its correction.
3. List every capability live in a config but absent from the registry, and offer
   to register each one.
