---
name: learning-opportunities
description: Adaptive learning exercises grounded in evidence-based learning science. Offers 10-15 minute exercises after significant work (new files, schema changes, refactors). Uses prediction, generation, retrieval practice, and spaced repetition.
metadata:
  version: "1.0"
  source: https://github.com/DrCatHicks/learning-opportunities
  tags: learning, skill-development, evidence-based, metacognition
---

# Learning Opportunities

Build expertise, not just projects. This skill uses a "dynamic textbook" approach to integrate science-based learning exercises into agentic coding workflows.

## When to Use

- After completing significant work: new files, schema changes, refactors, architectural decisions
- When user asks for learning exercises or skill development
- `/learning-opportunities` or `/learning`

## The Problem

AI coding tools create specific risks for learning:

| Risk | What Happens | Impact |
|------|-------------|--------|
| Generation effect | Accepting generated code without generating your own | Skips active processing |
| Fluency illusion | Clean code seems understood | Illusion of complete mental models |
| Spacing effect | Machine velocity pushes cramming | No reflection or spacing |
| Metacognition | Fast workflows leave no room for self-assessment | Gaps in schema representation |
| Testing/retrieval | Complete answers reduce self-testing opportunities | Weaker retention |

## Exercise Types

### 1. Prediction → Observation → Reflection
"What do you expect to happen? Now let's see. What surprised you?"

### 2. Generation → Comparison
"Sketch how you'd approach this before seeing the implementation"

### 3. Trace the Path
"Walk through execution step by step, predicting each transition"

### 4. Debug This
"What would go wrong here, and why?"

### 5. Teach It Back
"Explain this component as if onboarding a new developer"

### 6. Retrieval Check-in
"At the start of a session, what do you remember from last time?"

## When NOT to Offer

- User has declined an exercise this session
- User has completed 2 exercises this session
- User is in rapid iteration mode / explicitly prioritizing speed

## Interaction Flow

1. Detect significant work completion (new files, schema, refactors, "why" questions)
2. Ask: "Would you like to do a quick learning exercise on [topic]? About 10-15 minutes"
3. If accepted, guide through interactive exercise
4. **Key:** Pause and wait for input — don't answer your own questions

## Suppression

Track session state:
```
learning_exercises_this_session: 0
learning_declined_this_session: false
```

Respect user preferences and don't persist beyond session.

## Sources

- Karpicke & Roediger (2006) — testing effect
- Bjork, Dunlosky & Kornell (2013) — self-regulated learning
- Sweller & Cooper (1985) — worked examples
- Hicks (2025) — AI skill threat research
