---
name: jcbbge-blog
description: Generate a mini blog post in jcbbge's voice from any input — concept, conversation, idea, or raw thought
license: MIT
compatibility: opencode
metadata:
  version: "1.0"
  category: content
---

# jcbbge Blog Post Generator

Generates a mini blog post (300-800 words) in jcbbge's voice from any input. Appends output to `~/cbbgePT/blog.md`.

## Voice Reference

Load and apply `~/cbbgePT/jcbbge_voice_profile_UNIFIED.md` — specifically **MODE 1: TECHNICAL/LONGFORM**.

Key rules (never break these):
- Correct capitalization: "I" capitalized, sentence starts capitalized, proper nouns capitalized
- Simple punctuation only: periods, commas, question marks, colons in lists
- **NO EM DASHES (—). EVER. NOT ONCE. NOT IN ANY CONTEXT.**
- NO semicolons, NO double hyphens (--)
- No corporate speak
- At least one specific detail (name, number, place, thing you can touch)
- Don't wrap up neatly — leave something unresolved
- Honest about uncertainty

## Invocation

```
lets write a mini blog post about this
write a blog post
blog this
```

## Process

1. Read the input
2. Identify the core tension or insight worth writing about — not a summary, an angle
3. Open with the thing, not the setup
4. Build methodically — develop one idea per section
5. Apply technical/longform voice rules from the profile
6. End without resolving everything
7. Check against red flags in the profile
8. Append to `~/cbbgePT/blog.md`

## Output Format

Append to `~/cbbgePT/blog.md` with this structure:

```
---
## [Title] — [YYYY-MM-DD]

[body — 300-800 words, sections with headers as needed]

---
```

## Quality Check (run before outputting)

- "I" capitalized throughout?
- No semicolons or em dashes?
- Specific detail present (name, number, sensory anchor)?
- Opens with the thing, not the preamble?
- Leaves something unresolved at the end?
- No corporate speak?
- No inspirational spin on hard stuff?
- Reads like explanation, not performance?
