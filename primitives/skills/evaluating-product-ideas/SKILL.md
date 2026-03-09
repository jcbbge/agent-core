---
name: evaluating-product-ideas
description: Evaluate product ideas through user value, product-market fit, user experience, and go-to-market strategy. Use when assessing new ideas, validating features, or diagnosing why products aren't gaining traction. Focused on lightweight, practical analysis for solo indie developers.
metadata:
  author: JR
  version: "1.0"
---

# Evaluating Product Ideas

## When to use this skill

Use this skill when you need to:
- Assess a new product idea before building
- Validate whether a feature is worth developing
- Diagnose why a product isn't gaining traction
- Make go/no-go decisions on product directions
- Evaluate competitive positioning and differentiation

This skill provides a lightweight, research-backed evaluation framework designed for solo indie developers who need quick, actionable insights without heavy process overhead.

## Quick Start

The fastest way to evaluate an idea:

1. **Describe the idea** in 2-3 sentences
2. **Answer the JTBD question**: "When [situation], I want to [motivation], so I can [outcome]"
3. **Check retention signal**: Would users come back daily? Weekly? Monthly? Never?
4. **Identify the growth loop**: How does using the product bring in more users?

If you can't answer these clearly, you need more customer discovery work before building.

## Core Evaluation Framework

Evaluate ideas across four dimensions with suggested weights for solo devs:

### 1. User Value (30%)

**Key Question**: What job is the user hiring this product to do?

Jobs-to-be-Done analysis reveals true value by focusing on circumstances and progress-making:

**Three dimensions of every job:**
- **Functional**: What task needs doing? (e.g., "file my taxes")
- **Social**: How does this affect how others see me? (e.g., "look financially responsible")
- **Emotional**: How does this make me feel? (e.g., "feel secure and in control")

**Critical insight**: Competition isn't just direct competitors - it's ANY alternative solution users employ, including doing nothing. A morning milkshake competes with bananas, bagels, and boredom on a commute.

**Quick evaluation:**
- Can you articulate the "struggling moment" when users need this?
- What are users currently doing instead? (These are your real competitors)
- Does solving this create functional, social, AND emotional value?

For deep JTBD analysis, see [FRAMEWORKS.md](references/FRAMEWORKS.md)

### 2. Product-Market Fit (25%)

**Key Question**: Is this a trajectory toward retention and growth, or a dead end?

PMF is not a milestone - it's a continuous trajectory measured through behavior and sentiment.

**Critical metrics for indie devs:**

1. **Retention (most important single metric)**
   - Day-7 retention: >40% is strong signal
   - Day-30 retention: >20% indicates real value
   - Cohort comparison: Are newer cohorts improving?

2. **Sean Ellis Test**
   - Survey: "How disappointed would you be if this product disappeared?"
   - 40%+ saying "very disappointed" = PMF achieved
   - Below 40% = still searching for fit

3. **Growth loop potential**
   - Can you identify a compounding loop? (not just linear acquisition)
   - Does product usage naturally bring in more users?

**Red flag**: If you can't imagine sustainable retention or a growth loop, reconsider building.

See [FRAMEWORKS.md](references/FRAMEWORKS.md) for PMF measurement details.

### 3. User Experience (25%)

**Key Question**: Is this simple enough for users to adopt without excessive cognitive load?

For solo devs, UX evaluation focuses on fundamentals:

**Nielsen's critical heuristics for MVP:**
- **Visibility**: Can users see system status at a glance?
- **Match real world**: Does it work like users expect?
- **User control**: Can users undo mistakes easily?
- **Consistency**: Are patterns predictable?
- **Error prevention**: Are dangerous actions hard to trigger accidentally?

**Cognitive load check:**
- Can a new user accomplish the core job in < 5 minutes?
- Is the value proposition clear without explanation?
- Does the interface reduce friction rather than add it?

**Flow state potential:**
- Is there a clear goal users work toward?
- Do users get immediate feedback on their actions?
- Does challenge match user skill level?

Low cognitive load + clear value = higher adoption.

### 4. Go-to-Market Strategy (20%)

**Key Question**: How will you reach users, and does that channel match your product?

**Channel-fit evaluation:**
- Where does your target user already spend time?
- Can you reach them without massive ad spend?
- Does your product naturally encourage sharing/virality?

**Growth loop analysis:**

Identify which loop type fits your product:
- **User-generated content**: Pinterest, YouTube (content brings users)
- **Viral/referral**: Dropbox, Figma (usage creates invites)
- **Product-led**: Notion, Calendly (free users upgrade or bring teams)
- **Content/SEO**: HubSpot, Moz (content ranks, attracts users)

**Critical for solo devs**: Pick ONE primary loop. Focus beats fragmentation.

**Sustainability check:**
- Is CAC (customer acquisition cost) < LTV (lifetime value)?
- Can you acquire users without you personally doing sales calls?
- Does the loop compound (new users bring more users)?

See [CASE-STUDIES.md](references/CASE-STUDIES.md) for real-world growth loop examples.

## Practical Evaluation Process

### Step 1: Gather evidence

Before evaluating, collect:
- **User conversations** (5-10 target users minimum)
- **Competitive analysis** (what alternatives exist?)
- **Your assumptions** (write them down explicitly)
- **Success metrics** (what would "good" look like?)

### Step 2: Apply the framework

Use the [quick-eval-template.md](assets/quick-eval-template.md) to score your idea:

1. Score each dimension (1-10)
2. Apply weights (User Value 30%, PMF 25%, UX 25%, GTM 20%)
3. Calculate weighted total
4. Identify red flags and gaps

**Scoring guidance:**
- 8-10: Strong evidence, high confidence
- 5-7: Some evidence, needs validation
- 1-4: Weak evidence, significant concerns

**Interpretation:**
- 7.5+ weighted total: Strong idea, proceed with MVP
- 5-7.5: Promising but needs iteration/validation
- Below 5: Major issues, consider pivot or abandon

### Step 3: Identify the biggest risk

Which dimension scored lowest? That's where you need the most work:

- **Low User Value**: Do more customer discovery (JTBD interviews)
- **Low PMF**: Build smaller MVP, test retention earlier
- **Low UX**: Simplify ruthlessly, remove features
- **Low GTM**: Find a different channel or add viral mechanics

### Step 4: Make a decision

Based on your evaluation:

**GO**: Build an MVP focused on the highest-value job
- Start with ONE core job (not multiple)
- Measure retention from day one
- Plan your growth loop integration

**ITERATE**: Validate assumptions before building
- Run fake door tests
- Build landing page, measure interest
- Interview 10+ target users

**NO-GO**: Pivot or abandon
- Fundamental value proposition unclear
- No viable growth loop identified
- Market timing wrong

## Common Pitfalls

Avoid these evaluation mistakes:

**1. Falling in love with the solution**
- Focus on the problem and job-to-be-done
- Solutions are hypotheses to test, not babies to protect

**2. Ignoring retention signals**
- Vanity metrics (signups, page views) lie
- Retention and engagement reveal truth

**3. Building for everyone**
- Start with a specific struggling moment
- Expand later, once core job is nailed

**4. Copying features without understanding the job**
- Competitors may have features that don't drive value
- Understand WHY features exist before copying

**5. Neglecting the growth loop**
- Linear funnels cap out quickly
- Compounding loops create sustainable growth

For detailed red flags and fixes, see [RED-FLAGS.md](references/RED-FLAGS.md)

## Workflow Example

Here's a real evaluation workflow:

```
Idea: Meal planning app for busy parents

1. JTBD Analysis:
   "When I'm exhausted after work, I want to feed my family healthy food 
    quickly, so I can feel like a good parent without spending 2 hours cooking"
   
   Real competitors: takeout, frozen meals, meal kits, asking partner to cook

2. PMF Signals:
   - Would they use it daily? YES (dinner is daily)
   - Retention hypothesis: 60% day-7 (must solve dinner problem consistently)
   - Ellis test: Survey 20 parents, target >40% "very disappointed"

3. UX Simplicity:
   - Core job: Generate tonight's dinner plan in <1 minute
   - Cognitive load: Low (no complex preferences or dietary restrictions in MVP)
   - Flow: Clear goal (feed family), immediate feedback (recipe appears)

4. Growth Loop:
   - Product-led: Free version for 1 week planning, paid for full month
   - Viral: Share recipes with other parents creates network effect
   - Content/SEO: Recipe content ranks for "quick healthy dinners"

Evaluation: 8/10 - Strong user value, clear retention loop, viable PLG motion
Decision: BUILD MVP - Focus on 7-day free meal plans for busy parents
```

## Next Steps After Evaluation

### If scoring 7.5+:
1. Build the smallest possible MVP (one core job only)
2. Set up retention tracking immediately
3. Plan 10 user interviews in first week
4. Identify your primary growth loop

### If scoring 5-7.5:
1. Write down your 3 biggest assumptions
2. Design tests for each (landing page, fake door, interviews)
3. Run tests, gather evidence
4. Re-evaluate with new data

### If scoring below 5:
1. Identify the fundamental problem (value? market? timing?)
2. Consider pivoting to adjacent problem space
3. If pivoting, return to customer discovery
4. Don't build yet - validate first

## Advanced Topics

For deeper analysis, explore the reference materials:

- **Detailed frameworks**: [FRAMEWORKS.md](references/FRAMEWORKS.md)
- **Real-world patterns**: [CASE-STUDIES.md](references/CASE-STUDIES.md)  
- **Warning signs**: [RED-FLAGS.md](references/RED-FLAGS.md)
- **Evaluation template**: [assets/quick-eval-template.md](assets/quick-eval-template.md)

## Remember

**Good evaluation prevents bad building.** 

Spend a few hours evaluating rigorously to save months building the wrong thing. The best code is code you don't have to write because you validated the idea first.

Product-market fit is discovered through iteration, not predicted through planning. Use this framework to guide your experiments, not to create false certainty.
