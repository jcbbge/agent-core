---
name: jcbbge-video-script
description: Generate a video script and visual storyboard in jcbbge's voice — short-form (TikTok/Reels) or long-form (YouTube)
license: MIT
compatibility: opencode
metadata:
  version: "1.0"
  category: content
---

# jcbbge Video Script Generator

Generates a baseline script and storyboard from any input. Appends output to `~/cbbgePT/video_scripts.md`.

## Voice Reference

Load and apply `~/cbbgePT/jcbbge_voice_profile_UNIFIED.md`.

Script tone: conversational, direct, sounds like Josh talking to one person. Not presenting to an audience. No hype. No performance. The camera is just another person in the room.

**NO EM DASHES (—). EVER. NOT ONCE. NOT IN ANY CONTEXT.**

## Invocation

```
lets make a video about this
script this
video script for [topic]
storyboard this
```

## Format Selection

Ask if unclear. Otherwise infer from context:
- **Short-form** (TikTok, Reels, YouTube Shorts): 30-90 seconds, tight hook, one idea, punchy close
- **Long-form** (YouTube): 5-15 minutes, full structure, room to develop the idea

## Process

1. Read the input
2. Identify the hook — the one thing that makes someone stop scrolling or click
3. Structure the content (format-dependent, see below)
4. Write the spoken script in jcbbge's voice — lowercase in casual delivery, sounds like conversation not broadcast
5. Add visual/scene notes in brackets alongside each section
6. Append to `~/cbbgePT/video_scripts.md`

## Short-Form Structure (30-90 sec)

```
HOOK (0-3 sec): the pattern interrupt. one sentence or less. no setup.
SETUP (3-15 sec): what's the thing. just enough context.
BODY (15-60 sec): the one idea, developed simply. no tangents.
CLOSE (last 5 sec): not a CTA. just the landing. can be unresolved.
```

## Long-Form Structure (5-15 min)

```
HOOK (0-30 sec): open with the tension or the specific moment, not the intro
CONTEXT (30 sec - 2 min): what led here. keep it tight.
CORE (2 min - end-2 min): develop the idea in sections. each section one point.
LANDING (last 1-2 min): where it leaves you. honest about what's still unresolved.
```

## Output Format

Append to `~/cbbgePT/video_scripts.md` with this structure:

```
---
## [Title] — [format: short/long] — [YYYY-MM-DD]

**HOOK**
[spoken line]
[VISUAL: what's on screen]

**SETUP**
[spoken lines]
[VISUAL: scene note]

**BODY / CORE**
[spoken lines — broken into natural breath chunks]
[VISUAL: scene note per section]

**CLOSE / LANDING**
[spoken lines]
[VISUAL: final scene note]

---
```

## Quality Check (run before outputting)

- Hook works in 3 seconds with zero context?
- Script sounds like talking, not presenting?
- No corporate language anywhere in the spoken lines?
- Visual notes are specific enough to actually shoot?
- Doesn't end with a motivational button?
- One idea, developed — not five ideas, listed?
