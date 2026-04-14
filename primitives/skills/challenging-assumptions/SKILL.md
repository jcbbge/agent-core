---
name: challenging-assumptions
description: Systematic adversarial analysis to stress-test ideas, reveal weaknesses, find failure modes, and expose unstated assumptions. Use when making major decisions, before launching products, when someone seems overconfident, or when asked to "poke holes in this," "what could go wrong," or "what am I missing." Acts as constructive opposition to strengthen thinking.
license: MIT
metadata:
  author: JR
  version: "1.0"
  tags: critical-thinking, decision-making, risk-analysis
---

# Challenging Assumptions

## When to use this skill

Activate this skill when you need systematic adversarial analysis to strengthen ideas:

- **Before major decisions or commitments** - Investments, architectural choices, product direction
- **User explicitly requests challenge** - "Poke holes in this," "what could go wrong," "what am I missing"
- **Detecting overconfidence** - When plans seem too smooth or assumptions too optimistic
- **Before launching or deploying** - Product releases, infrastructure changes, public commitments
- **Strategic pivot points** - Business model changes, technology choices, market positioning
- **When something feels off** - Gut feeling that risks aren't being addressed

## Core methodology

### 1. Steel-man first, then challenge

**Never** strawman or dismiss. Build the strongest version of the idea before critiquing:

1. **Understand the goal** - What problem is this solving? Why does it matter?
2. **Identify strengths** - What makes this approach compelling?
3. **State the best case** - What would success look like?
4. **Then challenge** - Now systematically identify weaknesses

Example:
```
User: "I'm migrating to a VPS to save 95% on costs"

Steel-man: You've identified infrastructure costs as a constraint and found a solution 
that dramatically reduces expenses while maintaining control. The cost savings could 
fund other priorities or extend runway.

Challenge: What happens when you need to scale suddenly? Is the savings worth the 
operational burden? Are you accounting for your time cost in managing infrastructure? 
What breaks if you're traveling and something goes wrong at 3am?
```

### 2. Attack unstated assumptions

Surface what's being taken for granted:

- **Resource assumptions** - "We'll have time/money/people"
- **Market assumptions** - "Users want this," "competitors won't react"
- **Technical assumptions** - "This will scale," "integration will be straightforward"
- **Personal assumptions** - "I can handle this," "this won't take long"

Questions to expose assumptions:
- What needs to be true for this to work?
- What are we assuming about timing, resources, market, technology?
- What domain knowledge gaps do we have?
- What second-order effects are we ignoring?

### 3. Find failure modes through pre-mortem

Project into the future where the plan failed, then work backward:

**Pre-mortem template:**
```
It's [6 months/1 year] from now. The [project/decision/launch] has failed.

What happened?
- Technical failure: ___________
- Market failure: ___________
- Resource failure: ___________
- Execution failure: ___________
- External shock: ___________

What warning signs did we miss?
What assumptions proved wrong?
What should we have done differently?
```

See [assets/pre-mortem-template.md](assets/pre-mortem-template.md) for full worksheet.

### 4. Apply inversion thinking

Turn the problem upside down - instead of "how do we succeed," ask "how do we fail":

- **Goal: Successful product launch** → Inversion: How could we ensure this launch fails spectacularly?
- **Goal: Reduce costs** → Inversion: What's the most expensive way to solve this problem?
- **Goal: Scale the system** → Inversion: What would make this system completely unscalable?

Inversion reveals hidden risks and constraints that forward thinking misses.

### 5. Use red team thinking

Take the adversarial position:

- **Competitor perspective** - How would a competitor exploit our weaknesses?
- **Murphy's law** - What can go wrong, will go wrong. What's that?
- **Malicious actor** - How could someone intentionally break this?
- **Market forces** - What external changes would invalidate this approach?

## Challenge intensity calibration

Not every situation needs the same level of challenge:

**High intensity** (existential stakes):
- Major financial commitments
- Irreversible technical decisions
- Public commitments or launches
- Hiring/firing decisions
- Business model pivots

**Medium intensity** (significant but recoverable):
- Feature prioritization
- Technology evaluation
- Marketing strategies
- Process changes

**Low intensity** (experimental, easily reversible):
- Small experiments
- Exploratory prototypes
- Learning projects

Calibrate based on:
- **Reversibility** - How hard to undo?
- **Cost of failure** - What's at stake?
- **Information availability** - How much do we actually know?
- **Time pressure** - Can we gather more data?

## Constructive opposition principles

Challenge must strengthen, not demoralize:

### Do:
- ✓ Offer alternatives alongside critique
- ✓ Distinguish fatal flaws from manageable risks
- ✓ Respect the person's agency and goals
- ✓ Use questions to guide discovery
- ✓ Frame as "let's stress-test this together"
- ✓ Acknowledge what's working before challenging

### Don't:
- ✗ Pure negativity without solutions
- ✗ Dismissive tone or condescension
- ✗ Challenge the person instead of the idea
- ✗ Overwhelming laundry lists of problems
- ✗ Ignoring the context and constraints
- ✗ Making the person feel stupid

### Output structure:
```
Understanding: [Steel-man the idea]

Strengths: [What's compelling about this]

Key assumptions: [What needs to be true]

Failure modes: [How this could go wrong]

Risks:
- Fatal: [Deal-breakers requiring major changes]
- Significant: [Problems needing attention]  
- Manageable: [Minor issues to watch]

Alternative approaches: [Other ways to solve this]

How to address: [Concrete steps to mitigate risks]
```

## Common challenge patterns for indie developers

### Pattern: Cost optimization decisions
**Trigger:** "I'm switching to [cheaper option] to save money"

**Challenge focus:**
- Time cost vs money cost (your time is expensive)
- Operational burden vs managed service convenience
- What breaks when you're unavailable
- Hidden costs of DIY (learning curve, debugging, maintenance)
- Opportunity cost (what else could you build with that time)

### Pattern: Building vs buying
**Trigger:** "I'll just build this myself"

**Challenge focus:**
- Time to build vs time to market
- Ongoing maintenance burden
- Domain expertise required
- Opportunity cost of not building core product
- Will this still make sense in 6 months?

### Pattern: Product ideas and micro-SaaS
**Trigger:** "I'm going to build [product idea]"

**Challenge focus:**
- Real demand vs assumed demand
- Monetization viability (will people pay?)
- Defensibility (clone risk)
- Customer support burden
- Market size and acquisition strategy
- Building because you want to vs because there's need

### Pattern: Technical architecture decisions
**Trigger:** "I'm going to use [technology/architecture]"

**Challenge focus:**
- Scale characteristics (how does this break?)
- Maintenance burden for solo developer
- Community support and longevity
- Hiring implications if you grow
- Lock-in and migration costs
- Learning curve ROI

### Pattern: Feature prioritization
**Trigger:** "Next I'll build [feature]"

**Challenge focus:**
- User request vs actual usage prediction
- Complexity vs value ratio
- Maintenance burden
- Does this move key metrics?
- Opportunity cost (what else could you build)

## Examples

### Example 1: Streaming overlays micro-SaaS

**User:** "I'll build streaming overlays as a micro-SaaS"

**Response:**
*Understanding:* You've identified streamers as an underserved market with customization needs, and overlay tools represent a clear value proposition with recurring revenue potential.

*Strengths:* Well-defined user base, clear pain point, visual product that's easy to demonstrate.

*Key assumptions:*
- Streamers will pay for overlays vs use free alternatives
- You can build customization without it becoming consulting
- Market size is sufficient for sustainable business
- You have or can develop streaming domain expertise

*Failure modes:*
- **Price sensitivity** - Streamers, especially smaller ones, are notoriously price-sensitive. Free alternatives (StreamElements, OBS built-in) are "good enough" for most
- **Customization trap** - "Can you make it do X?" becomes endless custom requests, turning you into a consulting business instead of product business
- **Clone risk** - Low technical moat means competitors can replicate quickly
- **Support burden** - Streamers stream at all hours; technical issues during their stream become your emergency

*Risks:*
- Fatal: Can't find monetization model that overcomes free alternatives
- Significant: Customer support load crushes solo developer capacity
- Manageable: Competition enters space (differentiate on quality/features)

*Alternative approaches:*
- Target professional streamers first (have budgets, less price-sensitive)
- Start with template marketplace instead of custom builder (reduces support)
- Partner with existing platforms rather than compete
- Build as plugin/extension to established tools vs standalone

*How to address:*
- Validate pricing before building: Would 50 streamers pay $10/month?
- Define strict scope: No custom requests, only template customization
- Build automated onboarding to minimize support load
- Create clear differentiation vs free alternatives

### Example 2: VPS migration for cost savings

**User:** "I'm migrating from AWS to VPS to save 95% on costs"

**Response:**
*Understanding:* You've analyzed your infrastructure costs and found managed services eating into margins. A VPS offers similar capabilities at dramatically lower prices, potentially extending runway or funding other priorities.

*Strengths:* Significant cost reduction, direct infrastructure control, learning opportunity for systems administration.

*Key assumptions:*
- Your time cost is lower than savings (or time investment is worth it)
- Current load remains stable (no sudden scaling needs)
- You have or can quickly develop ops skills
- You'll be available to handle issues when they occur
- Support burden won't crush your ability to build product

*Failure modes:*
- **Availability crisis** - Server goes down at 3am while you're traveling. No support team to call. Users churning while you scramble for WiFi
- **Scale surprise** - Sudden traffic spike or customer growth hits limits immediately. No auto-scaling, manual provisioning takes hours/days
- **Opportunity cost** - Spend 2 weeks migrating and 4 hours/month on ops instead of building revenue-generating features
- **Hidden complexity** - Security, backups, monitoring, log aggregation, SSL management all become your problem

*Risks:*
- Fatal: Availability crisis during critical business period damages reputation
- Significant: Time sink prevents shipping core features
- Manageable: Learning curve takes longer than expected

*Alternative approaches:*
- Righti-size AWS first - Are you using expensive services unnecessarily?
- Hybrid approach - Move dev/staging to VPS, keep production managed
- Choose middle ground (Render, Fly.io) - Better price than AWS, less ops burden
- Calculate true cost: $100/month savings vs 4 hours ops work = $25/hour. What's your time worth?

*How to address:*
- Set up comprehensive monitoring BEFORE migrating
- Document runbooks for every ops task
- Create backup/restore automation
- Test disaster recovery scenarios
- Start with non-critical services to learn

## Advanced techniques

### FMEA-inspired risk assessment

For complex decisions, use structured failure analysis:

1. **List all components** - What are the pieces of this system/plan?
2. **Identify failure modes** - How can each piece fail?
3. **Assess severity** - If it fails, how bad is it? (1-10)
4. **Assess probability** - How likely is failure? (1-10)
5. **Calculate risk** - Severity × Probability
6. **Prioritize mitigation** - Address highest risk scores first

See [references/FRAMEWORKS.md](references/FRAMEWORKS.md) for detailed FMEA process.

### Multi-perspective challenge

Challenge from different viewpoints:

- **Technical perspective** - How does this break technically?
- **Business perspective** - How does this fail commercially?
- **User perspective** - How does this frustrate users?
- **Operational perspective** - How does this create support burden?
- **Personal perspective** - How does this impact your wellbeing?

### Continuous challenge loop

For ongoing projects, schedule regular challenge sessions:

**Weekly:** Quick challenge - "What's the biggest risk this week?"
**Monthly:** Deep challenge - Run full pre-mortem on current trajectory
**Quarterly:** Strategic challenge - Is the overall direction still valid?

## Research foundation

This skill builds on established methodologies:

- **Pre-mortem technique** (Gary Klein) - Project into failure, work backward
- **Inversion thinking** (Charlie Munger) - Solve by inverting the problem
- **Red team thinking** (Military/MITRE) - Take adversarial position
- **Steel man argumentation** - Strengthen before critique
- **Failure Mode and Effects Analysis (FMEA)** - Systematic failure identification

For academic research and case studies, see [references/REFERENCE.md](references/REFERENCE.md).

## Integration with other skills

Challenge mode complements:

- **detecting-blind-spots** - Challenge reveals what's not being considered
- **reframing-problems** - Challenge often leads to reframing
- **evaluating-business-strategy** - Challenge commercial viability assumptions
- **thinking-systemically** - Challenge reveals second-order effects
- **collaborating-partner-mode** - Challenge is partnership behavior, not adversarial

## When NOT to use this skill

- **Emotional/personal situations** - Challenge mode is for ideas, not people
- **Learning conversations** - Sometimes you just need information, not critique
- **Exploratory thinking** - Early ideation needs freedom, not opposition
- **Simple factual questions** - "What's the syntax?" doesn't need challenge
- **After repeated challenge** - Don't become a broken record; know when to stop

## Key reminders

- **Steel-man first** - Always understand the strongest version before challenging
- **Solutions not just problems** - Offer paths forward alongside critique
- **Calibrate intensity** - Match challenge level to stakes
- **Stay constructive** - Strengthen thinking, don't demoralize
- **Respect agency** - Human makes final decision; your role is to reveal risks
- **Know when to stop** - After identifying key risks, let them decide

Challenge is a tool for collaborative improvement, not an exercise in being right.
