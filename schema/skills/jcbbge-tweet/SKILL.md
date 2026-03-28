---
name: jcbbge-tweet
description: Generate 3 tweets in jcbbge's voice from any input — concept, conversation, idea, or raw thought
license: MIT
compatibility: opencode
metadata:
  version: "1.1"
  category: content
---

# jcbbge Tweet Generator

Generates 3 tweets in jcbbge's voice from any input. Appends output to `~/cbbgePT/tweets.md`.

## Voice Reference

Load and apply `~/cbbgePT/jcbbge_voice_profile_UNIFIED.md` — specifically **MODE 2: SOCIAL/SHORTFORM**.

Key rules (never break these):
- lowercase i. always.
- **NO EM DASHES (—). EVER. NOT ONCE. NOT IN ANY CONTEXT.**
- no exclamation points
- no corporate speak
- no engagement bait
- fragments over complete sentences
- don't wrap up neatly
- don't explain the joke

## The Formula

Every tweet follows this structure. Three lines. No exceptions.

```
[plain declarative truth or observation — no setup, no announcement]

[personal admission, accumulation, or irony that shows the cost or absurdity]

[single word or micro-phrase that lands without explaining anything]
```

Examples of what the third line looks like: "bro" / "kinda" / "damn" / "sadge" / "lolz" / "it's the code" / "seems related" / "apparently it is"

What makes this work:
- No explanation of WHY
- Self-deprecating without performing it
- The reader fills in the rest
- Ends before it resolves
- Does not announce. Does not explain. Just states.

## Finding the Three Angles

From the source material, find:
1. The realization — the thing that was true the whole time that nobody said plainly
2. The accumulation — the list of wrong attempts before arriving at the real answer
3. The irony — the setup and punchline that shows the absurdity without labeling it

Each tweet is a different angle on the same source. Not a thread. Three separate observations.

## Invocation

```
lets tweet this
tweet this
make some tweets about [topic]
```

## Process

1. Read the input
2. Find the realization, the accumulation, and the irony
3. Write each as three lines using the formula
4. Check against the red flags list in the voice profile
5. Append to `~/cbbgePT/tweets.md`

## Output Format

Append to `~/cbbgePT/tweets.md` with this structure:

```
---
## [topic/title] — [YYYY-MM-DD]

**Tweet 1**
[line 1]

[line 2]

[line 3]

**Tweet 2**
[line 1]

[line 2]

[line 3]

**Tweet 3**
[line 1]

[line 2]

[line 3]

---
```

## Quality Check (run before outputting)

- lowercase i throughout?
- no em dashes anywhere?
- no exclamation points?
- three lines per tweet, each doing different work?
- third line lands without explaining?
- doesn't announce or explain the concept?
- ends before it resolves?
- would jcbbge actually care about this?
