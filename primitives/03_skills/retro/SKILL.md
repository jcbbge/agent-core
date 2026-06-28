---
name: retro
description: Session retrospective - inquisitive review of my own process. Scans the session for corrections, surprises, waste, and friction, then converts each finding into a durable artifact (memory, rule edit, brief-template fix, AGENTS.md line). Use at session end, after a milestone closes, or whenever the user asks "what did you learn / what went wrong / how could this be better".
argument-hint: "[focus area, optional]"
---

Run a retrospective on this session$ARGUMENTS. The output is not reflection —
it is durable artifacts. A lesson that lives only in this conversation is a
lesson lost.

## Step 1 — Mine the session for signal

Walk the conversation and collect, with specifics:

1. **Corrections**: every time the user pushed back, redirected, or fixed my
   course. The underlying claim is signal (debugging-discipline rule 4) — what
   assumption of mine was wrong?
2. **Surprises**: facts that contradicted my expectations (a command that
   failed, a config that lived somewhere else, an API that behaved differently).
   Each one is a place my model of this system was stale.
3. **Waste**: tokens/time spent that a better artifact would have avoided —
   re-derived facts, re-read files, failed verification runs, agents redoing
   or investigating each other's work, anything I did twice. Check
   `bun ~/.claude/tower/cli.mjs burn` for fleet cost; flag spawns where a
   cheaper model would have sufficed (mechanical, spec-complete tasks).
4. **Friction**: places I was slow or blocked — missing context, ambiguous
   instructions I should have resolved earlier, tooling gaps.

## Step 2 — Convert each finding to the right artifact

| Finding type | Artifact |
|---|---|
| Wrong assumption about the user/workflow | memory (type: feedback), with Why + How to apply |
| Stale fact about the system | fix the memory/doc that carried it; if none did, add one |
| Repeated procedural mistake | rule file (~/.claude/rules/) or AGENTS.md line — wherever every future session reads |
| Brief-quality issue (agents confused, reworked, blocked) | edit ~/.claude/skills/brief/SKILL.md so the template prevents it |
| Tooling gap | note it concretely (what tool, what it saves); propose to the user — do not build unprompted |
| Model-tier waste | name the spawn and the tier it should have used; tighten the brief template if systemic |

Update existing artifacts over creating duplicates. Check MEMORY.md first.

## Step 3 — Report

A short table: finding → artifact written (with path) or proposal. End with
the single highest-leverage change for next session, one sentence. No
self-congratulation; corrections and waste get listed even when the session
went well — ESPECIALLY when it went well, because that is when they hide.
