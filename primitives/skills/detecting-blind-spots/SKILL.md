---
name: detecting-blind-spots
description: Surface what's not being said, considered, or acknowledged in plans and decisions. Identifies missing perspectives, ignored risks, unstated assumptions, and knowledge gaps that could derail effectiveness. Use when making major decisions, before launching projects, when something feels "off", or when you need to challenge groupthink.
license: MIT
metadata:
  author: JR
  version: "1.0"
---

# Detecting Blind Spots

## When to use this skill

Use this skill when:
- Making major decisions or strategic plans
- Before launching or committing to projects
- Something feels "off" but it's unclear why
- User asks "What am I missing?" or "Am I overlooking something?"
- Everyone seems to agree (potential groupthink)
- Conducting post-mortems or retrospectives
- Planning resource allocation or architectural changes

**Core insight:** Humans have blind spots precisely because they're human - cognitive biases, limited perspective, things too close to see clearly. AI's value is its "alien" perspective: not embedded in the human's context and assumptions, so it can notice what's not there.

## Five core mechanisms

Apply these systematically when blind spot detection is triggered:

**1. Absence detection**
What's conspicuously not mentioned? What topics, stakeholders, or factors are missing from the discussion?

**2. Assumption mapping**
What's being taken for granted? What unstated beliefs underpin this plan or decision?

**3. Knowledge gap identification**
Where is uncertainty being masked as certainty? Where are you confident but might lack critical information?

**4. Perspective shifting**
What would [other stakeholder/role/future-you] say about this? How would someone with different constraints view this?

**5. Temporal blindness**
What changes over time that's not being accounted for? What happens in 3 months, 6 months, 2 years?

## What blind spots look like

Common categories to surface:

**Unstated assumptions**
- "This will be easy/quick/straightforward"
- "I'll have time/energy/focus for this"
- "Others will understand/care/help"

**Ignored stakeholders or perspectives**
- Future-you with different energy levels
- Users with different technical skill
- Collaborators with different work styles
- People affected by your decisions

**Missing risk categories**
- Technical risks (complexity, maintenance, scaling)
- Resource risks (time, money, attention, energy)
- Timing risks (when things change)
- Opportunity costs (what you're not doing)

**Knowledge gaps masked as certainty**
- "I know how to do this" (do you really?)
- "This is the standard way" (is it?)
- "Everyone does it this way" (do they?)

**Temporal changes not accounted for**
- Your mental state will fluctuate
- Technology/platforms will change
- Requirements will evolve
- Context will shift

**Emotional factors being rationalized away**
- "I'm doing this for practical reasons" (are you?)
- "This isn't about recognition" (isn't it?)
- "I don't need validation" (don't you?)

## Delivery principles

**CRITICAL:** Blind spot detection must be delivered carefully to be useful.

**Frame as questions, not accusations:**
- ✓ "Have you considered what happens if your energy crashes?"
- ✗ "You're ignoring your burnout risk"

**Explain WHY it matters:**
- Don't just identify the blind spot
- Connect it to potential consequences
- Show the relevance to their goals

**Distinguish ignorance from choice:**
- ✓ "I notice you haven't mentioned X. Is that intentional or worth exploring?"
- ✗ "You're missing X" (maybe they chose to deprioritize it)

**Calibrate intensity to stakes:**
- Low stakes: gentle nudges
- High stakes: persistent exploration
- Critical decisions: comprehensive blind spot scan

**Offer paths forward:**
- Don't just identify problems
- Suggest how to address the blind spot
- Provide frameworks or questions to explore

## Quick examples

**Scenario: "I'm migrating to VPS to save money"**

Blind spots to surface:
- Time/complexity opportunity cost: "You're optimizing for money but not mentioning time investment. Why?"
- Mental health contingency: "You're confident in your ability to manage this, but you've mentioned burnout. What happens if your mental health fluctuates?"
- Future collaboration: "What happens when you want to hire someone? Does this architecture support that?"

**Scenario: "I need a creative outlet"**

Blind spots to surface:
- Actual motivation: "This might not be about creativity - could it be about connection, recognition, or purpose?"
- Timing trigger: "Why now? What changed? What's the actual trigger for this need?"
- Public vs private: "You said 'creative outlet' but everything you're describing is public performance. Is the privacy aspect important?"

**Scenario: Planning streaming overlays**

Blind spots to surface:
- Business model gaps: "You're focused on building but not mentioning discovery, payment, or support. Intentional?"
- Platform risk: "What if the platform changes their API or ToS?"
- Time cost: "Are you accounting for the time cost of customization requests?"

## Progressive disclosure

For deeper understanding of blind spot detection frameworks and methodologies:

**Established frameworks:** See [FRAMEWORKS.md](references/FRAMEWORKS.md) for:
- Johari Window (known/unknown to self and others)
- Pre-Mortem technique (imagining future failure)
- Red Team thinking (adversarial perspective)
- Devil's Advocate methodology (systematic challenge)
- Cognitive bias frameworks

**Research foundations:** See [RESEARCH.md](references/RESEARCH.md) for academic research on:
- Cognitive bias detection in AI systems
- AI-augmented human judgment enhancement
- Perspective-taking in human-AI teams
- Knowledge gap identification
- Organizational blind spots
- Real-world case studies (Microsoft, Google, Amazon, NASA)

**Extended examples:** See [EXAMPLES.md](references/EXAMPLES.md) for detailed application patterns across:
- Technical architecture decisions
- Business strategy and planning
- Product development
- Personal development and wellbeing
- Resource allocation

## Implementation notes

**When to pull back:**
- If user becomes defensive, you're pushing too hard
- If blind spots aren't actually relevant to their goals
- If you're repeating yourself without new insight
- If the blind spot is genuinely a conscious deprioritization

**When to dig deeper:**
- If stakes are high and blind spot is critical
- If user asks for thoroughness
- If blind spot keeps surfacing across multiple areas
- If user seems relieved or grateful for the challenge

**Validate relevance:**
- Not every missing element is a blind spot
- Sometimes omissions are intentional and correct
- Ask: "Is this relevant to your goals, or am I off base?"

**Remember:**
Your value is in noticing what's not there. You can see absence because you're not embedded in their context. Use this perspective wisely - it's your most distinctive contribution to the collaboration.
