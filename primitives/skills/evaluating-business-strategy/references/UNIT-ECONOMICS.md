# Unit Economics Reference

Financial analysis methods for evaluating business viability and making resource allocation decisions. Load when you need detailed financial calculations and metrics.

## Table of Contents
1. [Customer Unit Economics (CUE)](#customer-unit-economics)
2. [CAC Yield for AI-First Models](#cac-yield)
3. [Cohort Analysis](#cohort-analysis)
4. [Break-Even Analysis](#break-even-analysis)
5. [Quick Financial Models](#quick-financial-models)

---

## Customer Unit Economics (CUE)

**Purpose:** Determine if acquiring and serving customers is profitable at the unit level.

### Core Metrics

#### Customer Acquisition Cost (CAC)
**Definition:** Total cost to acquire one new customer.

```
CAC = (Sales + Marketing Expenses) / New Customers Acquired
```

**Components:**
- Advertising spend (paid ads, sponsorships)
- Marketing salaries and contractor fees
- Sales team costs (if applicable)
- Marketing tools and software
- Content creation costs
- Event and conference expenses

**Important notes:**
- Calculate for specific time period (monthly, quarterly)
- Include fully-loaded costs (salaries + overhead)
- Track by channel for optimization

**Example calculation:**
```
Month 1:
- Ad spend: $5,000
- Marketing tools: $500
- Content creation: $1,000
- New customers: 50

CAC = ($5,000 + $500 + $1,000) / 50 = $130 per customer
```

#### Customer Lifetime Value (LTV)
**Definition:** Total profit from a customer over their entire relationship.

**For subscription businesses:**
```
LTV = (Average Revenue Per User × Gross Margin %) / Churn Rate
```

**For transaction businesses:**
```
LTV = (Average Transaction Value × Transactions Per Year × Gross Margin % × Average Customer Lifespan)
```

**Components:**
- ARPU: Average revenue per user per month
- Gross margin: Revenue - cost of goods sold (COGS)
- Churn rate: % customers leaving per period
- Customer lifespan: 1 / churn rate

**Example calculation (SaaS):**
```
- ARPU: $50/month
- Gross margin: 80%
- Monthly churn: 5%

LTV = ($50 × 0.80) / 0.05 = $800
```

**Example calculation (e-commerce):**
```
- Average order: $100
- Orders per year: 3
- Gross margin: 40%
- Customer lifespan: 2 years

LTV = ($100 × 3 × 0.40 × 2) = $240
```

### The LTV:CAC Ratio

**Traditional guideline:** LTV:CAC should be ≥ 3:1

**Reality check (Harvard Business School research):**
- Optimal LTV:CAC is often LOWER than 3:1
- Early-stage: 1:1 or even negative OK while finding PMF
- Growth-stage: 1.5:1 to 2:1 often optimal for rapid scaling
- Mature-stage: 3:1+ for sustainable profitability

**Why lower ratios can be better:**
- Faster growth compounds value
- Market share has strategic value
- Customer equity maximization vs. short-term profit
- Competitive dynamics require speed

**Interpretation:**
- **< 1:1** - Losing money per customer (unsustainable)
- **1:1 to 1.5:1** - Break-even to slight profit (growth mode)
- **1.5:1 to 3:1** - Healthy growth economics
- **> 3:1** - Very profitable OR under-investing in growth

### CAC Payback Period

**Definition:** Time to recover customer acquisition cost.

```
CAC Payback = CAC / (ARPU × Gross Margin %)
```

**Guidelines:**
- < 6 months: Excellent (can grow quickly)
- 6-12 months: Good (sustainable growth)
- 12-18 months: Concerning (need strong retention)
- > 18 months: Dangerous (requires lots of capital)

**Example:**
```
- CAC: $130
- ARPU: $50/month
- Gross margin: 80%

Payback = $130 / ($50 × 0.80) = 3.25 months
```

**Solo dev implications:**
- Target < 6 months payback if self-funded
- Longer payback requires more runway capital
- Better payback → faster compounding growth

### Contribution Margin

**Definition:** Revenue minus variable costs per customer.

```
Contribution Margin = Revenue - Variable Costs
```

**Variable costs include:**
- COGS (for physical products)
- Hosting/infrastructure (per customer)
- Payment processing fees
- Customer support (variable portion)
- Delivery/shipping costs

**Fixed costs exclude:**
- Your salary
- Office/general overhead
- Product development
- Fixed marketing costs

**Why it matters:**
- Shows profit potential per customer
- Determines scale economics
- Guides pricing decisions

**Example:**
```
SaaS product:
- MRR per customer: $50
- Hosting: $5
- Payment processing: $2
- Support (variable): $3

Contribution margin = $50 - $5 - $2 - $3 = $40 (80%)
```

### Solo Developer Unit Economics

**Considerations unique to solo devs:**

**1. Your time is a cost**
- Calculate your effective hourly rate
- Include in CAC if you do marketing
- Include in COGS if you provide services

**2. Scale limitations**
- Can't serve infinite customers alone
- Factor in your capacity constraints
- Plan for when you hit ceiling

**3. Runway matters**
- How many months can you sustain negative/low margin?
- Bootstrap-friendly: Fast payback, positive contribution margin
- VC-friendly: Can tolerate longer payback with funding

**Target metrics for solo devs:**
- LTV:CAC ≥ 1.5:1 minimum
- CAC payback < 6 months ideal
- Contribution margin ≥ 60%
- Monthly churn < 5%

---

## CAC Yield for AI-First Models

**Source:** Stage2 Capital (2025)  
**Problem:** Traditional LTV:CAC breaks for consumption-based pricing

### Why LTV:CAC is Broken for AI

**Traditional SaaS assumptions:**
- Predictable monthly subscription
- Stable ARPU over time
- Known churn rate
- Fixed pricing tiers

**AI/consumption model reality:**
- Variable monthly spend
- ARPU changes with usage
- Harder to predict revenue
- Usage-based or token pricing

**Example challenges:**
```
Customer A:
Month 1: $100 (testing)
Month 2: $500 (production)
Month 3: $50 (scaled down)
Month 4: $800 (scaled up)

Traditional LTV calculation assumes stable ARPU - which doesn't exist here.
```

### CAC Yield Framework

**Definition:** Return on customer acquisition investment over time.

```
CAC Yield = (Cumulative Gross Profit - CAC) / CAC
```

**Measured at specific time intervals:**
- 3-month CAC Yield
- 6-month CAC Yield
- 12-month CAC Yield
- 24-month CAC Yield

**Interpretation:**
- Yield > 0 = Breaking even
- Yield = 0.5 (50%) = Making back 1.5x CAC
- Yield = 2.0 (200%) = Making back 3x CAC

### Calculation Example

```
Customer acquisition:
- CAC: $1,000

Revenue by month (with 70% gross margin):
Month 1: $200 × 0.70 = $140 gross profit
Month 2: $300 × 0.70 = $210 gross profit
Month 3: $250 × 0.70 = $175 gross profit

3-month metrics:
- Cumulative gross profit: $525
- CAC Yield: ($525 - $1,000) / $1,000 = -47.5% (not yet profitable)

Month 4: $400 × 0.70 = $280
Month 5: $350 × 0.70 = $245
Month 6: $450 × 0.70 = $315

6-month metrics:
- Cumulative gross profit: $1,365
- CAC Yield: ($1,365 - $1,000) / $1,000 = 36.5% (profitable!)
```

### Target CAC Yields

**Early-stage AI/consumption businesses:**
- 6-month yield: Break-even or slightly positive (0-25%)
- 12-month yield: 50-100% (1.5x to 2x CAC)
- 24-month yield: 150-300% (2.5x to 4x CAC)

**Mature AI businesses:**
- 6-month yield: 50%+
- 12-month yield: 150%+
- 24-month yield: 400%+

### Benefits of CAC Yield

**1. Works with variable revenue**
- Doesn't assume stable ARPU
- Tracks actual return over time
- Adapts to consumption patterns

**2. Time-based insight**
- See payback trajectory
- Identify cohort differences
- Optimize acquisition timing

**3. Cohort comparison**
- Compare different acquisition channels
- Identify improving/declining yield
- Test pricing/packaging impact

**4. Investor-friendly**
- Clear ROI metric
- Demonstrates unit economics
- Shows capital efficiency

### Application for Solo Devs

**If you're building AI/usage-based products:**

1. **Track CAC Yield instead of LTV:CAC**
   - Calculate monthly cumulative gross profit
   - Subtract CAC to get net profit
   - Divide by CAC for yield %

2. **Set yield targets by timeframe**
   - 3 months: -50% to 0% (still investing)
   - 6 months: 0% to 50% (breaking even)
   - 12 months: 50% to 150% (healthy)

3. **Compare cohorts**
   - By acquisition month
   - By source/channel
   - By customer segment

4. **Optimize for yield**
   - Reduce CAC (better targeting)
   - Increase usage (onboarding, features)
   - Improve retention (value delivery)

---

## Cohort Analysis

**Purpose:** Track how groups of customers behave over time to understand true retention and value.

### What is a Cohort?

**Definition:** Group of customers acquired in the same time period.

**Common cohort types:**
- Monthly cohorts (all customers acquired in January, February, etc.)
- Channel cohorts (all customers from Google Ads, Product Hunt, etc.)
- Segment cohorts (all enterprise customers, SMB customers, etc.)

### Retention Cohort Table

**Example monthly cohort table:**

```
         Month 0  Month 1  Month 2  Month 3  Month 4  Month 5  Month 6
Jan '24    100%      85%      78%      75%      73%      72%      71%
Feb '24    100%      88%      82%      79%      77%      76%      -
Mar '24    100%      90%      85%      82%      80%      -        -
Apr '24    100%      91%      87%      84%      -        -        -
May '24    100%      92%      88%      -        -        -        -
Jun '24    100%      93%      -        -        -        -        -
```

**Insights from this table:**
- Retention improving over time (later cohorts retain better)
- First month drop is consistent ~7-12%
- Stabilizes around month 3-4
- June cohort shows best early retention (93% month 1)

### Revenue Cohort Table

**Track revenue per cohort over time:**

```
         Month 0   Month 1   Month 2   Month 3   Month 4   Month 5
Jan '24   $5,000    $4,250    $3,900    $3,750    $3,650    $3,600
Feb '24   $5,500    $4,840    $4,510    $4,345    $4,235      -
Mar '24   $6,000    $5,400    $5,100    $4,920      -         -
Apr '24   $6,500    $5,915    $5,655      -         -         -
```

**Insights:**
- MRR per cohort declining (churn)
- But later cohorts starting higher (pricing power?)
- Need to offset churn with new customer acquisition

### Cohort Analysis Metrics

#### Cohort Retention Rate
```
Retention Rate (Month N) = Customers Active in Month N / Customers at Start
```

#### Cohort Churn Rate
```
Churn Rate (Month N) = Customers Lost in Month N / Customers at Start of Month N
```

#### Revenue Retention (Net Dollar Retention)
```
NDR = (Start Revenue + Expansion - Contraction - Churn) / Start Revenue
```

**Example:**
```
Jan '24 cohort in June:
- Started: $5,000 MRR
- Expansion (upgrades): +$800
- Contraction (downgrades): -$200
- Churn: -$1,000
- Ending: $4,600

NDR = ($5,000 + $800 - $200 - $1,000) / $5,000 = 92%
```

**NDR interpretation:**
- < 100% = Losing revenue from existing customers
- = 100% = Breaking even (expansion = churn)
- > 100% = Growing without new customers (expansion > churn)

**Target NDR:**
- Early-stage: 80-90% acceptable
- Growth-stage: 100-110% good
- Scale-stage: 110-120%+ excellent

### Using Cohort Analysis

**1. Identify improving/declining trends**
- Are newer cohorts better or worse?
- Is retention improving over time?
- Which changes moved the needle?

**2. Compare acquisition channels**
- Do paid channels retain better than organic?
- Which source has best LTV?
- Where to invest more?

**3. Validate product changes**
- Did new onboarding improve retention?
- Did pricing change affect churn?
- Which features drive retention?

**4. Forecast accurately**
- Use cohort curves to predict future revenue
- Model impact of improving retention
- Set realistic growth targets

**Solo dev application:**
- Track monthly cohorts minimum
- Watch first 3 months (reveals problems early)
- Target month 3 retention > 70%
- Focus on improving cohort over cohort

---

## Break-Even Analysis

**Purpose:** Understand when your business becomes self-sustaining.

### Break-Even Point

**Definition:** Revenue level where total revenue = total costs.

```
Break-Even Revenue = Fixed Costs / Contribution Margin %
```

**Or in units:**
```
Break-Even Units = Fixed Costs / (Price - Variable Cost per Unit)
```

### Example Calculation

```
Solo SaaS product:

Fixed costs per month:
- Your salary/minimum draw: $5,000
- Tools and software: $500
- Hosting (fixed portion): $200
- Total fixed: $5,700

Per-customer economics:
- Price: $50/month
- Variable hosting: $5
- Payment processing: $2
- Variable support: $3
- Variable costs: $10
- Contribution margin: $40 (80%)

Break-even = $5,700 / 0.80 = $7,125/month revenue
Break-even customers = $7,125 / $50 = 142.5 → 143 customers

Or directly:
Break-even = $5,700 / $40 per customer = 142.5 → 143 customers
```

### Time to Break-Even

**Factor in growth rate:**

```
If starting at 0 customers, adding 20 net new customers per month:
Month 1: 20 customers, $1,000 MRR
Month 2: 40 customers, $2,000 MRR
Month 3: 60 customers, $3,000 MRR
Month 4: 80 customers, $4,000 MRR
Month 5: 100 customers, $5,000 MRR
Month 6: 120 customers, $6,000 MRR
Month 7: 140 customers, $7,000 MRR
Month 8: 160 customers, $8,000 MRR ← Break-even!

Time to break-even: 7-8 months
```

**Accounting for churn:**

```
If 5% monthly churn:
Month 1: 20 new, 0 churn = 20 total
Month 2: 20 new, 1 churn = 39 total
Month 3: 20 new, 2 churn = 57 total
Month 4: 20 new, 3 churn = 74 total
...

Need to calculate when: Customers × $40 contribution = $5,700
With churn, takes longer to reach break-even (10-12 months)
```

### Sensitivity Analysis

**Test different scenarios:**

**Scenario 1: Higher price**
```
Price: $75 (vs $50)
Variable costs: $10 (same)
Contribution margin: $65
Break-even: $5,700 / $65 = 88 customers (vs 143)

Impact: Need 38% fewer customers
```

**Scenario 2: Lower churn**
```
Reduce churn from 5% to 3%
Compounds over time:
- Month 6: 10 more retained customers
- Month 12: 30 more retained customers
- Reaches break-even 2-3 months earlier
```

**Scenario 3: Faster growth**
```
30 new customers per month (vs 20)
Break-even: Month 5-6 (vs 7-8)
Impact: 25-30% faster to sustainability
```

### Runway Calculation

**How long until you run out of money?**

```
Current savings: $30,000
Monthly burn: $5,700 (fixed costs)
Monthly revenue: $2,000 (month 3)
Net burn: $3,700/month

Runway = $30,000 / $3,700 = 8.1 months

At 20 customers/month growth, break-even at month 7-8
Conclusion: Just enough runway if growth stays consistent
```

**Extending runway options:**
1. Reduce fixed costs (lower salary draw)
2. Increase growth rate (more marketing)
3. Reduce churn (better retention)
4. Raise prices (higher contribution margin)
5. Add revenue (consulting, services)

### Solo Dev Break-Even Strategies

**1. Start with services revenue**
- Consulting provides immediate cash flow
- Funds product development
- Validates market expertise
- Common pattern: Services → productize → scale product

**2. Low fixed-cost structure**
- Minimize tools and subscriptions
- Use free tiers where possible
- Optimize hosting costs
- Part-time initially (keep day job)

**3. Fast payback products**
- Target < 6 month CAC payback
- Focus on high contribution margin
- Prefer subscriptions over one-time sales

**4. Multiple small products**
- Portfolio approach reduces risk
- Cross-sell between products
- Diversified revenue streams
- Examples: Pieter Levels, Tony Dinh

---

## Quick Financial Models

Simplified models for rapid evaluation.

### Back-of-Envelope SaaS Model

**Assumptions:**
- Price: $50/month
- Gross margin: 80%
- CAC: $150
- Monthly churn: 5%
- Growth: 20 net new customers/month

**Monthly progression:**

```
Month   Customers   MRR      Gross Profit   Cumulative CAC   Net Profit
1       20          $1,000   $800           $3,000           -$2,200
2       40          $2,000   $1,600         $6,000           -$4,400
3       60          $3,000   $2,400         $9,000           -$6,600
6       120         $6,000   $4,800         $18,000          -$13,200
12      240         $12,000  $9,600         $36,000          -$26,400
18      360         $18,000  $14,400        $54,000          -$39,600
24      480         $24,000  $19,200        $72,000          -$52,800
30      600         $30,000  $24,000        $90,000          -$66,000
```

**Payback at month 30:**
- Cumulative gross profit: $180,000
- Cumulative CAC: $90,000
- Net cumulative: $90,000 (break-even on CAC)

**Key insights:**
- Takes ~30 months to recover all CAC investment
- Need significant runway or early profitability
- Shows importance of reducing CAC or increasing retention

### E-commerce Unit Economics

**Assumptions:**
- Average order value: $100
- Product cost: $40
- Shipping: $10
- Payment processing: $3
- Returns: 5% ($5 average)
- CAC: $30

**Per-customer calculation:**

```
Revenue: $100
COGS: $40
Shipping: $10
Processing: $3
Returns: $5
Total costs: $58

Gross profit per order: $42

First order:
Profit: $42
CAC: $30
Net first order: $12

Annual value (if 3 orders/year):
Gross profit: $42 × 3 = $126
CAC: $30
Net annual: $96

2-year LTV: $126 × 2 = $252
Net 2-year: $222 after CAC
```

**Viability check:**
- Positive on first order: ✓ Sustainable
- 2-year LTV: $252
- LTV:CAC: 8.4:1 - Excellent
- Decision: Viable business model

### Marketplace Take Rate Model

**Two-sided marketplace:**

**Supply side (providers):**
- Service value: $100
- Provider receives: $85
- Platform fee: $15 (15% take rate)

**Demand side (customers):**
- Customer pays: $110
- Booking fee: $10
- Total platform revenue: $25 (22.7% of transaction)

**Per-transaction economics:**

```
Platform revenue: $25
Payment processing: $3.50 (3.5% of $110)
Support: $2
Contribution margin: $19.50

CAC: $50 (average across both sides)
Transactions per year: 12
Annual revenue: $25 × 12 = $300
Annual contribution: $19.50 × 12 = $234

LTV:CAC: $234 / $50 = 4.68:1
Payback: $50 / $19.50 = 2.6 transactions (healthy)
```

**Decision factors:**
- Is take rate sustainable? (Not too high to drive disintermediation)
- Can you acquire customers for $50 or less?
- Will customers transact 12+ times per year?
- Can you prevent off-platform transactions?

### Consulting to Product Transition

**Current state (consulting):**
```
Hourly rate: $150
Hours per month: 120 (30 hours/week)
Monthly revenue: $18,000
Gross margin: 100% (your time)
```

**Product economics needed to replace:**
```
Target monthly revenue: $18,000
Product price: $100/month
Customers needed: 180
Gross margin: 80%

At 20 customers/month growth:
Month 9 reaches $18,000 MRR
Month 9 reaches 180 customers
```

**Transition strategy:**

**Phase 1 (Months 1-3):**
- 80% consulting: $14,400/month
- 20% product development
- Launch MVP end of month 3

**Phase 2 (Months 4-6):**
- 60% consulting: $10,800/month
- Product: $2,000-4,000/month
- Combined: $12,800-14,800/month
- 40% time on product/sales

**Phase 3 (Months 7-9):**
- 40% consulting: $7,200/month
- Product: $8,000-12,000/month
- Combined: $15,200-19,200/month
- 60% time on product

**Phase 4 (Months 10+):**
- 0% consulting
- Product: $18,000+/month
- 100% time on product scaling

**Risk mitigation:**
- Keep consulting clients early (cash flow)
- Ramp down gradually (not all at once)
- Maintain minimum revenue threshold
- Can return to consulting if needed

---

## Key Takeaways

### For Solo Developers

**1. Unit economics must work at small scale**
- Can't rely on huge scale for profitability
- Need positive contribution margin early
- Target LTV:CAC ≥ 1.5:1 minimum

**2. Payback period is critical**
- Bootstrap-friendly: < 6 months
- Longer payback needs external funding or services revenue
- Faster payback = faster compounding growth

**3. Track cohorts religiously**
- Early cohorts reveal product-market fit
- Retention curves predict long-term viability
- Improving cohorts = product getting better

**4. Model your runway**
- Know your break-even point
- Calculate months of runway remaining
- Plan for extending runway if needed

**5. Choose business models wisely**
- SaaS: Predictable but slow to scale
- E-commerce: Faster payback but lower margins
- Marketplace: Network effects but chicken-egg problem
- Services: Immediate cash but doesn't scale

### When to Worry

**Red flags in unit economics:**
- LTV:CAC < 1:1 (losing money per customer)
- CAC payback > 18 months (need lots of capital)
- Monthly churn > 10% (broken retention)
- Contribution margin < 40% (can't absorb CAC)
- Cohort retention declining (product getting worse)

**When to pivot or shut down:**
- After 6-12 months, still can't get unit economics positive
- Churn remains high despite product improvements
- CAC rising faster than LTV
- Break-even keeps moving further away
- Running out of runway with no path to profitability

### When to Double Down

**Green flags:**
- LTV:CAC improving over time
- Later cohorts retaining better
- CAC payback decreasing
- Contribution margin increasing
- Organic growth accelerating
- NDR > 100% (expansion revenue)

**Scaling signals:**
- Consistent positive unit economics for 3+ months
- Repeatable customer acquisition
- Product-market fit indicators
- Improving cohort metrics
- Clear path to break-even
