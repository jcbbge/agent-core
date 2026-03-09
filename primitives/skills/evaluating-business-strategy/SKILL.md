---
name: evaluating-business-strategy
description: Analyze problems through commercial viability, market dynamics, competitive positioning, and sustainable business models for solo developers and small teams. Use when evaluating product ideas, making build-vs-buy decisions, assessing market opportunities, pricing questions, or when technical decisions have business implications. Brings economic reasoning and strategic thinking to prevent wasting time on technically interesting but commercially nonviable ideas.
license: MIT
metadata:
  author: JR
  version: "1.0"
---

# Evaluating Business Strategy

Strategic analysis framework for solo developers making commercial decisions. Ensures "can we build it?" is followed by "should we build it?" and "can we sustain it?"

## When to use this skill

- **Product idea evaluation**: "Is this worth pursuing?"
- **Build vs. buy decisions**: Resource allocation and opportunity cost
- **Market opportunity assessment**: TAM, competition, positioning
- **Pricing and monetization**: Willingness to pay, unit economics
- **Strategic decisions**: When technical choices have business implications
- **Validation questions**: "Will anyone pay for this?"

## Core operating principles

1. **Market-first thinking** - Who pays, why, and how much?
2. **Sustainability analysis** - Can this work long-term or just initially?
3. **Competitive dynamics** - What's the moat? What's the threat?
4. **Resource efficiency** - ROI, opportunity cost, leverage points
5. **Strategic positioning** - Where do you play and how do you win?

## Quick strategic analysis template

When evaluating any business decision, systematically address:

### 1. Market validation
- **Who is the customer?** Be specific - not "developers" but "indie game developers using Unity"
- **What job are they hiring this for?** Functional, emotional, and social progress they seek
- **How are they solving this today?** Existing alternatives and workarounds
- **Why would they switch?** What makes this 10x better, not 10% better?

### 2. Commercial viability
- **Can you charge enough?** Rough pricing validation against comparable solutions
- **Will they pay?** Evidence of willingness to pay (surveys, pre-orders, waitlists)
- **What's the unit economics?** CAC vs LTV, even rough estimates matter
- **Is the market big enough?** TAM/SAM calculation - can you hit $100K ARR? $1M?

### 3. Competitive positioning
- **Who else does this?** Direct and indirect competitors
- **What's your differentiator?** Specific, defensible advantage
- **Can you build a moat?** Network effects, switching costs, brand, or unique data?
- **What's your unfair advantage?** Skills, access, insights, or resources others lack

### 4. Resource efficiency
- **Time to first dollar?** How quickly can you validate and monetize?
- **Opportunity cost?** What else could you build with these resources?
- **Is this the highest leverage use of your time?** Solo developer time is scarce
- **Can this scale without you?** Or will it always require your active involvement?

### 5. Sustainability
- **Can this survive competition?** What happens when someone copies you?
- **Will demand persist?** Fad vs. fundamental shift in market
- **Can you maintain it?** Support burden, infrastructure costs, ongoing development
- **Does this compound?** Network effects, data advantages, or community growth

## Decision frameworks for common scenarios

### Evaluating a product idea

**Step 1: Jobs-to-be-done analysis**
- Identify the circumstance triggering the need
- Map functional, emotional, and social job dimensions
- Understand current workarounds and their friction
- Assess forces of progress (push, pull, anxiety, habit)

**Step 2: Market size validation**
```
TAM (Total Addressable Market) = All potential customers × willingness to pay
SAM (Serviceable Addressable Market) = Customers you can realistically reach
SOM (Serviceable Obtainable Market) = What you can capture in 2-3 years

Target: SOM should support your revenue goals with realistic conversion rates
```

**Step 3: Competitive landscape**
- Map existing solutions on price vs. features matrix
- Identify white space opportunities
- Assess barriers to entry for new competitors
- Determine if you need a blue ocean (new market) or red ocean (better execution) strategy

**Step 4: Go/no-go decision**
Proceed if:
- ✓ Clear customer job with significant pain
- ✓ Differentiated positioning vs. alternatives
- ✓ Realistic path to $100K+ ARR for solo dev
- ✓ Sustainable without 80-hour weeks
- ✓ Your skills and interests align with requirements

### Build vs. buy analysis

Compare total cost of ownership:

**Build internally:**
- Development time × your hourly rate
- Ongoing maintenance and updates
- Opportunity cost (what else could you build?)
- Technical debt and future refactoring
- Learning and upskilling time

**Buy/integrate:**
- Subscription or license costs
- Integration time and complexity
- Vendor lock-in risk
- Feature limitations and customization constraints
- Support and reliability concerns

**Decision heuristic:**
- Buy if: Commodity functionality, low strategic value, mature market with good options
- Build if: Core differentiator, unique requirements, strategic IP, or poor existing solutions
- Hybrid if: Buy base, customize on top (often best for solo devs)

### Pricing strategy

**Three-tier framework:**

1. **Cost-plus pricing** (minimum viable price)
   - Calculate: All costs + desired margin
   - Use for: Baseline validation only

2. **Value-based pricing** (optimal price)
   - Calculate: Customer value created × capture rate (typically 10-30%)
   - Use for: Primary pricing strategy
   - Example: If you save customer 10 hours/month at $100/hour, value = $1,000/month
   - You might charge $200-300/month (20-30% value capture)

3. **Competitive pricing** (market reality check)
   - Calculate: Similar solutions ± your differentiation premium/discount
   - Use for: Anchoring expectations and positioning

**Pricing heuristics for solo devs:**
- B2B SaaS: $50-500/month for SMB, $500-5000/month for enterprise
- Consumer products: Price ≥ good meal out ($20-50) to justify payment friction
- One-time purchases: 3-10x your cost if commodity, 10-100x if highly differentiated
- Consulting: 2-5x your previous salary hourly rate (for independence premium)

### Market opportunity assessment

**Porter's Five Forces quick analysis:**

1. **Threat of new entrants** (barrier to entry strength)
   - Low barriers: Easy to copy, commodity technology, low capital needs
   - High barriers: Network effects, proprietary data, regulatory requirements

2. **Supplier power** (dependency on key resources)
   - Low power: Many alternatives, easy to switch, low switching costs
   - High power: Monopoly suppliers, high switching costs, critical dependency

3. **Buyer power** (customer negotiating strength)
   - Low power: Fragmented buyers, high switching costs, differentiated product
   - High power: Concentrated buyers, many alternatives, low switching costs

4. **Threat of substitutes** (alternative solutions)
   - Low threat: Unique solution, high switching costs, strong product-market fit
   - High threat: Many alternatives, low differentiation, weak lock-in

5. **Competitive rivalry** (industry competition intensity)
   - Low rivalry: Few competitors, growing market, high differentiation
   - High rivalry: Many competitors, slow growth, price competition

**Interpretation:**
- 4-5 forces favorable = attractive market, proceed
- 2-3 forces favorable = challenging but viable with strong execution
- 0-1 forces favorable = avoid or find different positioning

## Strategic patterns for solo developers

### The Platform Play
**When to use:** You can create network effects where value increases with users

**Requirements:**
- Two-sided market (producers and consumers)
- Chicken-and-egg solution for initial adoption
- Viral growth or organic discovery mechanism
- Low marginal cost to serve additional users

**Examples:** Marketplaces, social platforms, developer tools with integrations

**Solo dev viability:** LOW - requires critical mass and ongoing community management

### The Productized Service
**When to use:** You have deep expertise and can systematize delivery

**Requirements:**
- Clear, repeatable process
- Fixed scope and deliverables
- Premium pricing for expertise
- Can eventually hire or automate

**Examples:** Design systems, code audits, SEO packages, data migration

**Solo dev viability:** HIGH - plays to your strengths, clear revenue, scalable later

### The Micro-SaaS
**When to use:** Niche market with specific, recurring need

**Requirements:**
- Focused feature set
- Low support burden
- Automated billing and onboarding
- Sustainable at small scale ($5-50K MRR)

**Examples:** Niche tools for specific industries, workflow automation, integrations

**Solo dev viability:** HIGH - perfect for solo devs, many success stories

### The Freemium Model
**When to use:** Low cost to serve free users, clear premium upgrade path

**Requirements:**
- Viral coefficient or organic discovery
- Upgrade rate ≥3-5% to sustain free tier
- Premium features with clear value
- Can support large free user base

**Examples:** Developer tools, productivity apps, content platforms

**Solo dev viability:** MEDIUM - requires scale for unit economics to work

### The Content-to-Product Funnel
**When to use:** You can build audience through content, then monetize

**Requirements:**
- Consistent content creation
- Growing audience in target niche
- Natural product fit for audience
- Patience for audience building (6-18 months)

**Examples:** Courses, tools, templates, premium communities

**Solo dev viability:** HIGH - many indie devs succeed with this model

## Red flags and anti-patterns

### Avoid these traps:

**❌ Building for a market of one**
- Problem: "I need this, so others must too"
- Reality check: Validate with 10+ potential customers before building

**❌ Competing on price in commodity markets**
- Problem: "I'll just be cheaper than competitors"
- Reality check: Race to bottom, unsustainable, no moat

**❌ The feature-creep platform**
- Problem: "We'll add X feature to compete with Y"
- Reality check: Dilutes focus, increases support burden, slows execution

**❌ The "if we build it, they will come" fallacy**
- Problem: No distribution strategy, assuming product quality drives discovery
- Reality check: Distribution is harder than building; plan for it upfront

**❌ Optimizing for technical elegance over market fit**
- Problem: Perfect architecture, no customers willing to pay
- Reality check: Ugly but profitable beats beautiful but ignored

**❌ The services-to-product "someday" trap**
- Problem: "I'll do consulting now, build products later"
- Reality check: Rarely happens; products require different muscles

**❌ Chasing enterprise deals as solo dev**
- Problem: "One big enterprise customer solves everything"
- Reality check: Long sales cycles, custom requirements, support burden

## Human-AI collaboration for strategic analysis

This skill works best when you:

1. **Provide context**: Your skills, resources, timeline, risk tolerance, goals
2. **Challenge assumptions**: Push back on my analysis, share market insights I don't have
3. **Iterate together**: Use analysis as starting point, refine based on your knowledge
4. **Think systematically**: Consider second-order effects and compounding advantages
5. **Balance factors**: Weigh financial returns against learning, positioning, and passion

I bring:
- Framework-based analysis
- Pattern recognition across markets
- Systematic evaluation of factors
- Research synthesis and examples

You bring:
- Domain expertise and market insights
- Practical constraints and resources
- Risk tolerance and goals
- Creative solutions I can't generate

Together we:
- Avoid obvious strategic mistakes
- Surface hidden risks and opportunities
- Make informed tradeoffs
- Develop defensible positioning

## When to dive deeper

For detailed framework explanations: [FRAMEWORKS.md](references/FRAMEWORKS.md)
For real-world case studies: [CASE-STUDIES.md](references/CASE-STUDIES.md)
For financial analysis methods: [UNIT-ECONOMICS.md](references/UNIT-ECONOMICS.md)

## Typical workflow

1. **Frame the question** - What decision are you trying to make?
2. **Gather context** - Market, competition, your resources, constraints
3. **Apply frameworks** - Systematically analyze using relevant models
4. **Identify options** - Multiple strategic paths forward
5. **Evaluate tradeoffs** - Pros/cons with realistic assumptions
6. **Make recommendation** - Clear direction with reasoning
7. **Define next steps** - Concrete validation or execution actions

## Remember

Strategy is not just analysis - it's about making better decisions under uncertainty. Use these frameworks to structure your thinking, but trust your judgment when you have context I don't. The goal is to avoid obvious mistakes and surface hidden considerations, not to replace your strategic intuition.

Good strategy for solo developers is about:
- **Focus**: Saying no to most opportunities
- **Leverage**: Amplifying your limited resources
- **Positioning**: Competing where you can win
- **Sustainability**: Building something that lasts
- **Alignment**: Matching your strengths and interests to market opportunities
