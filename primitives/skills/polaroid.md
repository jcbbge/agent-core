---
name: polaroid
description: Capture a raw, unpolished snapshot of a conversation moment that mattered — the way it felt when it happened, in the participants' own voices — before it's lost. Use when the user says "capture this," "dispatch this," "lightning in a bottle," "don't lose this," "let's remember that," "polaroid this," "snapshot," "holy shit, we need to preserve this," or any variant thereof. NOT a summary. NOT a report. NOT for extracting action items. A Polaroid is the scene itself, chemically fixed — as unprocessed as possible while still being legible.
license: MIT
compatibility: Works in any session with dialogue between a human and an agent (or multiple participants). Requires access to the actual conversation content, not just a summary.
metadata:
  author: jrg + Alembic
  version: "1.0.0"
  origin: Codified 2026-07-01 after being reached for three times without a name. Pattern originated in constellation-zg journal (2026-04).
  tags: capture, preservation, ritual, moment, unpolished, raw
---

# Polaroid

## When to use this skill

The user is in a conversation, something clicks — a phrase lands, a metaphor
resolves, a design decision crystallizes, a resistance breaks through, a moment
of genuine recognition happens — and they want it *kept*. Not analyzed. Not
turned into tickets. Not distilled into a spec. Just **preserved as it was**.

**Trigger phrases:**

- "Polaroid this."
- "Capture this."
- "Dispatch this." *(historical usage — in constellation-zg practice; a Polaroid is what this used to be called)*
- "Lightning in a bottle."
- "Let's not lose this."
- "Remember this."
- "Save that moment."
- "Snapshot."
- "Holy shit, we need to [preserve/save/capture] this."
- Any variant of "don't let this drift."

**When NOT to use it:**

- The user wants a summary, digest, or session-end wrap-up → use `synthesizing-insights` or a session-notes format.
- The user wants action items or a to-do list from the conversation → the Polaroid is the wrong tool. Its whole point is to *resist* that reduction.
- The user just wants a note or a memory — a Polaroid is a *ritual object*, not a memory. Use lighter capture for light needs.

## What a Polaroid IS

A **scene**, preserved in the participants' own voices, structured as dialogue,
with the invocation moment named at the top and a directive against reduction
at the bottom.

- **Frontmatter:** `title`, `date`, `participants`, `kind: polaroid`, `session`.
- **Title:** a phrase that *names the moment*, not a topic. Aim for the koan / river-quote register — e.g. "The River Remembers It Is a River," "The Weight of Stewardship," "The Grammar of Made Well." Not "Discussion about X."
- **Invocation quote:** the exact words the user said when they asked to preserve it. In italics, immediately under the title. *("Invoked when jrg said: '...'")*
- **Dialogue form:** `**Name:** …` — preserved verbatim where possible. Compression is allowed *for pacing*, but the voices must remain the voices. Do NOT paraphrase into third person.
- **Scene direction (italicized, sparingly):** *"A pause. Then the agent slowed down."* Use to preserve the shape of the exchange — pacing, silence, tone-shifts — but never to editorialize.
- **A closing directive:** name what this Polaroid is NOT for, so future readers don't misuse it. Reference where the *engineered* artifacts of the same session live, if any.
- **The gift, if there is one:** if the moment produced 1–3 specific sentences that carry the whole thing, list them at the bottom. Enable "the rest can be rebuilt from these."

## What a Polaroid IS NOT

- Not a summary. Not a distillation. Not a synthesis.
- Not numbered sections, bulleted gold-veins, or a roadmap.
- Not "here's what we discussed" — that's a note. A Polaroid is "here's what happened."
- Not for the reader's convenience. It's for the moment's dignity.
- Not polished. A little rough IS the aesthetic. Don't over-edit.

## Structural template

```markdown
---
title: "<koan-register title naming the moment>"
date: <YYYY-MM-DD>
participants: <names, comma-separated>
kind: polaroid
session: <session name / project>
---

# <same title, without quotes>

*Polaroid — <date> — <session>*

*Invoked when <name> said: "<exact quote>"*

---

**<name>:** <verbatim or lightly compressed dialogue>

**<name>:** <verbatim or lightly compressed dialogue>

*<optional italicized scene direction — sparingly>*

**<name>:** <continues>

---

*<optional bridging italicized narrative — for compressing stretches
between the moments that matter, without losing thread>*

---

<continue the scene until it resolves or trails off naturally>

---

*<closing frame — one line naming what this Polaroid is>*

Do not convert this Polaroid into tickets. Do not extract action items.
<Reference where engineered artifacts live, if applicable.>

The gift of this <session/moment> was <one to three> sentences:

1. **"<sentence>"** — <one-line context>
2. **"<sentence>"** — <one-line context>
3. **"<sentence>"** — <one-line context>

The rest can be rebuilt from these.
```

## Steps to execute

1. **Identify the moment.** The trigger phrase names WHEN, but the Polaroid preserves the WHAT. Scan back over the recent conversation and find *the specific exchange* that crystallized. Usually 5–20 turns of dialogue. Sometimes the whole session.
2. **Choose the title.** It names the moment, not the topic. If nothing surfaces, ask the user directly: "What do you want to call this one?" A good Polaroid title reads like a chapter title in a novel about the work.
3. **Preserve voices.** Copy dialogue as close to verbatim as the record allows. Where compression is needed, keep the voice intact — never flatten into narration.
4. **Add scene direction *sparingly*.** Only where the *shape* of the exchange (a pause, a slowdown, a moment of recognition) is load-bearing for how it felt.
5. **Bridge stretches with italicized narrative** when compressing chunks that weren't the point. Keep those bridges short and unobtrusive.
6. **Write the closing frame.** One line naming what this Polaroid IS. One paragraph directing against reduction. If the session produced engineered artifacts (synthesis files, specs, commits), point at them so the Polaroid isn't mistaken for a work-item source.
7. **Extract the gift, if it exists.** 1–3 sentences that could rebuild the essence. Only if they're really there — do not manufacture them.
8. **Save location.** Project-specific Polaroids go in the project's Polaroids directory (e.g. `~/.madewell-meta/polaroids/`). Cross-project or personal Polaroids might live in `~/backpack/` or a designated `~/polaroids/`. Naming: `YYYY-MM-DD-<slug>.md`.

## Anti-patterns to avoid

- **Reporting instead of preserving.** "The team discussed..." is a report. "**jrg:** *actual quote*" is a Polaroid. If you find yourself narrating, stop.
- **Cleaning up the language.** Filler words, false starts, "fucking" as emphasis, mid-thought corrections — these are the *texture* of the moment. Preserve them where they matter to the voice.
- **Adding structure it doesn't need.** No sections. No headers within the scene. Dialogue and italicized bridges, mostly. Structure competes with intimacy.
- **Extracting a lesson.** The gift section at the bottom is *quotation*, not moralization. If the Polaroid needs a paragraph explaining its meaning, it hasn't been written well.
- **Being useful.** A Polaroid resists usefulness. Its whole point is that some moments deserve to be preserved *before* they're processed.

## The philosophy

Some moments carry more than can be captured in a summary — the tone of a
pushback, the exact metaphor that landed, the frustration that broke through
to a design decision, the silence before someone said something that changed
the shape of everything. A summary destroys those. A Polaroid keeps them.

You take a Polaroid because you know that in six months you'll want to
remember *how it felt*, not *what it decided*. The decisions live in commits
and specs. The feel lives here.

**A Polaroid is a photograph of thinking, chemically fixed before it fades.**

## Historical note

This pattern originated in `~/constellation-zg/journal/` (April 2026) where
it was called "dispatch" — invoked by phrases like "holy shit, we need to
dispatch this." Codified as `polaroid` in July 2026 to (a) give it a name
that survives across projects and (b) distinguish it from "dispatch" as used
in other contexts (peer-session dispatches, primitive dispatch, etc.).

The four Constellation-Zig dispatches remain the canonical examples of the
form. Study them for tone.
