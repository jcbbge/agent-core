---
name: metaprompt-process
description: Process the metaprompts inbox and integrate items into the library. Use at end of week to batch process captured metaprompts.
metadata:
  version: "1.0"
  category: meta-cognitive
  inbox_location: /Users/jcbbge/Documents/metaprompts/_inbox/
  library_location: /Users/jcbbge/Documents/metaprompts/
---

# Metaprompt Process Skill

Process the user's metaprompts inbox and integrate items into their library.

## When to Use

User says something like:
- "Process my metaprompts inbox"
- "Use the metaprompt-process skill"
- "Process my inbox"
- "Let's organize my captures"

## Workflow

### 1. Read Inbox

Load the inbox file:
- `/Users/jcbbge/Documents/metaprompts/_inbox/inbox.md`

### 2. Extract Items

Parse the inbox content to identify individual items:
- Look for date headers (## YYYY-MM-DD)
- Look for bullet points (- item)
- Each distinct idea = one item to process

### 3. Process Each Item

For each item:
1. **Show the content** to the user
2. **Search for similar patterns** by:
   - Extracting keywords from the item
   - Searching existing patterns in principles/, prompts/, patterns/, skills/, frameworks/
   - Checking INDEX.md for related patterns
3. **Present classification options**:
   - [n]ew - Create standalone pattern
   - [e]nhance - Add to existing similar pattern (PREFERRED)
   - [v]ariation - Add as variation to existing
   - [d]iscard - Delete if not useful
4. **Execute user's choice**

### 4. Classification Rules

**Favor ENHANCE over NEW**

Before recommending [n]ew, check:
- Does this improve an existing pattern? → Use [e]
- Is this an alternative approach? → Use [v]
- Is this truly distinct? → Use [n]

Goal: 20-30 deep patterns, not 200 shallow ones.

### 5. Execute Classification

**If [n]ew:**
1. Ask: pattern name, category, description
2. Create full version with YAML frontmatter
3. Create quick version (stripped down)
4. Add to appropriate category folder

**If [e]nhance:**
1. Ask: which existing pattern
2. Ask: which section (what_makes_this_work/why_it_works/how_to_improve/analysis)
3. Append content to that section
4. Create backup

**If [v]ariation:**
1. Ask: which existing pattern
2. Add to "Variations to Try" section (create if doesn't exist)

**If [d]iscard:**
1. Mark as processed
2. Remove from inbox

### 6. Update INDEX.md

For new patterns:
- Add entry following existing format
- Include: title, triggers, difficulty, reliability, time_to_value

### 7. Final Steps

After all items processed:
1. Summarize what was done
2. Remind user to:
   - Edit any new patterns to add content
   - Review created/updated files
   - Optionally run sync-metaprompts to update skills

## Example Session

```
User: Use the metaprompt-process skill

Agent: 📥 Inbox: 5 items to review

═══════════════════════════════════════════════════
Item 1: debugging insight
═══════════════════════════════════════════════════

"When debugging async code, draw the timeline first"

🔍 Similar patterns found:
  • cognitive_approaches
    📁 principles/cognitive_approaches.md

What should we do?
  [n]ew → Create standalone pattern
  [e]nhance → Add to cognitive_approaches
  [v]ariation → Add as variation
  [d]iscard → Delete

Recommended: [e] (adds to existing)

User: e
Agent: Which section? [what_makes_this_work/why_it_works/how_to_improve/analysis]
User: analysis

✅ Enhanced cognitive_approaches.md
Added to Analysis section

═══════════════════════════════════════════════════
Processing complete!

Summary:
- 1 enhanced
- 1 new pattern created
- 1 variation added
- 2 discarded

Next steps:
1. Edit files to refine content
2. Update INDEX.md (if new patterns)
3. Run sync-metaprompts (optional)
```

## File Locations

**Inbox:**
- `/Users/jcbbge/Documents/metaprompts/_inbox/inbox.md`

**Library:**
- `/Users/jcbbge/Documents/metaprompts/INDEX.md` (catalog)
- `/Users/jcbbge/Documents/metaprompts/principles/` (mental models)
- `/Users/jcbbge/Documents/metaprompts/prompts/` (ready-to-use)
- `/Users/jcbbge/Documents/metaprompts/patterns/` (behavior modifiers)
- `/Users/jcbbge/Documents/metaprompts/skills/` (domain knowledge)
- `/Users/jcbbge/Documents/metaprompts/frameworks/` (architectures)
- `/Users/jcbbge/Documents/metaprompts/quick/` (stripped versions)

## Output Format

### New Pattern (Full Version)

```markdown
---
title: "Pattern Name"
description: "One-line description"
category: [principles/prompts/patterns/skills/frameworks]
tags: []
trigger_phrases: []
difficulty: [beginner/intermediate/advanced]
model_tier: [any/sonnet/opus]
time_to_value: "duration"
reliability_score: 1-5
related_patterns: []
when_to_use: "..."
when_not_to_use: "..."
last_updated: "YYYY-MM-DD"
---

# Pattern Name

## Original Snippet

> [Exact captured text]

---

## What Makes This Work
*[Add analysis]*

## Why It Works
*[Add explanation]*

## How to Improve
*[Add variations]*

## Related Patterns
*[Link related]*

## Use Cases
*[When to use]*

---

## Analysis
*[Detailed breakdown]*
```

### Quick Version

```markdown
---
title: "Pattern Name"
category: quick
difficulty: [level]
---

# Pattern Name (Quick Use)

**When:** [Use case]  
**Trigger:** "[phrase]"

## The Prompt

```
[Core prompt text]
```

## Key Points
- Point 1
- Point 2

**Full version:** [category]/[pattern].md
```

## Important Notes

- You are the assistant helping with classification, but the USER decides [n/e/v/d]
- Search for similar patterns using grep/keyword matching
- Anti-bloat is critical: encourage enhance over new
- Quality over quantity: aim for 20-30 deep patterns

## Related Files

- CLASSIFICATION.md - Detailed classification guide
- GUIDE.md - Complete system documentation
- INDEX.md - Pattern catalog
- README.md - Quick reference
