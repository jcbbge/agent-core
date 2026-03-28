# Red Flags and Warning Signs

## Critical Red Flags (Stop Building)

### 🚩 Red Flag #1: Can't Articulate the Job-to-be-Done

**Warning Signs:**
- You describe your product by features, not user outcomes
- You say "it's like [competitor] but better"
- You can't name a specific struggling moment
- Target users say "interesting" but don't express urgency

**Why This Matters:**
If you can't articulate the job, users won't understand why they need your product. "Better" features without solving a different/better job = commoditization.

**Fix:**
1. Interview 10+ target users about their current solutions
2. Ask: "Walk me through the last time you struggled with [problem]"
3. Listen for the circumstance, emotional response, and desired outcome
4. Reframe product around the job, not the features

**Example:**
- ❌ "A better note-taking app with AI features"
- ✅ "When I'm in meetings, I want to focus on conversation without missing important details, so I can be present while capturing decisions"

---

### 🚩 Red Flag #2: Low Frequency Use Case

**Warning Signs:**
- Product solves annual or monthly problem (tax filing, insurance renewal)
- Users wouldn't think about it unless reminded
- Can't build a daily or weekly habit
- Retention measurement takes months

**Why This Matters:**
Low-frequency products struggle with:
- High customer acquisition cost (can't recover quickly)
- Low engagement makes iteration slow
- Users forget product exists between uses
- Difficult to build retention habits

**Fix Options:**

**Option 1: Add high-frequency adjacent jobs**
- Example: TurboTax (annual) → Year-round tax planning tools
- Example: Zillow (occasional) → Daily home value tracking

**Option 2: Pivot to B2B/workflow integration**
- Annual consumer use → Daily professional use
- Example: Individual tax filing → Accountant's daily workflow

**Option 3: Accept limitation, optimize for retention**
- Focus on annual retention, not daily
- Reminders and triggers around use time
- Make the annual experience exceptional

**Decision Framework:**
- Can you add high-frequency value without scope creep? → Try Option 1
- Is there a professional user who needs this daily? → Try Option 2  
- Neither feasible? → Reconsider building (or accept limitation)

---

### 🚩 Red Flag #3: No Clear Growth Loop

**Warning Signs:**
- Only growth plan is "paid ads" or "I'll market it"
- Product usage doesn't create any viral/UGC/SEO mechanism
- Acquisition fully dependent on your ongoing effort
- Linear growth curve (not compounding)

**Why This Matters:**
Solo devs can't sustain linear acquisition:
- Paid ads require continuous funding
- Personal marketing doesn't scale
- Growth caps at your effort capacity
- Vulnerable to competitors with better distribution

**Fix:**
1. **Identify potential loop mechanism:**
   - Does usage create shareable content? → UGC/SEO loop
   - Does product require collaboration? → Viral loop
   - Can it be free with paid upgrade? → PLG loop
   - Does it solve searchable problems? → Content/SEO loop

2. **If no natural loop exists:**
   - Add sharing incentive (Dropbox: extra storage)
   - Make results publicly shareable (public profiles, boards)
   - Create SEO-friendly artifact (public pages, snippets)
   - Enable collaboration (requires invites)

3. **If can't add loop:**
   - Reconsider the market (might need VC funding for growth)
   - Pivot to adjacent use case with loop potential
   - Accept lifestyle business limitations (manual growth)

**Example Transformations:**
- Private tool → Public sharing (screenshots, boards, results)
- Individual use → Team collaboration (requires invites)
- Closed system → SEO-friendly content (public pages)

---

### 🚩 Red Flag #4: Retention Drops to Near-Zero

**Warning Signs:**
- Day-7 retention below 15%
- Day-30 retention below 5%
- Users try once, never return
- Can't identify a retained power user segment

**Why This Matters:**
If no one returns, no one is getting value. All acquisition investment is wasted because users churn immediately.

**Fix Process:**

**Step 1: Segment retained vs churned users**
- Who are the 5-15% who DO return?
- What do they have in common?
- What did they do differently in first session?

**Step 2: Interview both groups**
- Retained: "What value did you get? What job did we solve?"
- Churned: "What were you hoping for? Why didn't you return?"

**Step 3: Hypothesis generation**
- Do retained users understand the value prop better?
- Did they complete activation action (aha moment)?
- Do they have different circumstances/jobs?

**Step 4: Action based on findings**

**If retained users found different job than intended:**
→ Pivot to their use case, abandon original vision

**If activation issue (didn't complete key action):**
→ Redesign onboarding to drive activation
→ Measure time-to-value, reduce it

**If value exists but for tiny niche:**
→ Decide: Double down on niche or pivot to broader market

**If no retained segment exists at all:**
→ Fundamental value problem, need major pivot or abandon

---

## Warning Signs (Iterate Before Scaling)

### ⚠️ Warning Sign #1: Excited Signups, Weak Retention

**Symptoms:**
- Viral launch, lots of signups
- Retention drops sharply after initial spike
- Sean Ellis test under 30%
- Users say "cool idea" but don't use it

**Diagnosis:**
You've created interest (curiosity), not value (solution to job). Interest fades, value persists.

**Fix:**
1. Don't scale acquisition yet (you'll just acquire more churning users)
2. Focus on activation: Get new users to "aha moment" faster
3. Identify what retained users did differently in first session
4. Redesign onboarding around activation action
5. Measure cohort retention improvement before scaling

**Example:**
Many viral apps spike on Product Hunt → 100K signups → 95% churn in week 1
Better: 100 signups → 60% retention → Understand why → Scale

---

### ⚠️ Warning Sign #2: Feature Requests from Non-Users

**Symptoms:**
- People suggest features but don't use product
- Feature requests from users who signed up but churned
- Feedback focuses on what's missing, not what's there

**Diagnosis:**
Chasing feature parity with competitors won't fix fundamental value gap. Non-users don't understand what retained users value.

**Fix:**
1. Ignore feature requests from churned users (they left for fundamental reasons)
2. Interview retained power users: "What would make this 10x better?"
3. Double down on what's working for retained segment
4. Add features that deepen value for retained users, not attract churned users back

**Principle:**
- Retained users reveal what works
- Churned users reveal what didn't work for them (different job/circumstances)
- Build for retained users, not churned users

---

### ⚠️ Warning Sign #3: Can't Explain Why Users Would Pay

**Symptoms:**
- "I'll figure out monetization later"
- Free users happy, no one wants to pay
- Can't articulate what's worth paying for
- Value proposition isn't 10x better than free alternatives

**Diagnosis:**
If you can't explain payment value prop, users won't understand it either. Freemium requires clear paid value.

**Fix:**
1. **Identify the job worth paying to solve:**
   - What pain is severe enough to pay?
   - What job has budget allocated already?
   - What's 10x better than free alternatives?

2. **Common freemium patterns:**
   - Free: Individual use → Paid: Team/collaboration
   - Free: Limited usage → Paid: Power user/unlimited
   - Free: Core job → Paid: Advanced jobs/workflows
   - Free: Storage/compute → Paid: More capacity

3. **Validate payment willingness early:**
   - Ask: "If this cost $X/month, would you pay?"
   - Fake door pricing page to gauge interest
   - Waitlist for paid tier (measures real intent)

**Example:**
- Notion: Free for individual → Paid for team workspace
- Dropbox: Free 2GB → Paid for more storage
- Calendly: Free basic scheduling → Paid for team/advanced features

---

### ⚠️ Warning Sign #4: Solving Your Problem, Not User's Problem

**Symptoms:**
- You're the primary user
- Your circumstances are unique (developer, designer, etc.)
- Target users don't share your pain level
- "I would use this" but they don't

**Diagnosis:**
You feel the pain intensely, but you're an outlier. Market of one ≠ viable product.

**Fix:**
1. **Validate problem severity in target market:**
   - Interview 20+ non-you potential users
   - Ask about current solutions and workarounds
   - Measure: Are they paying for alternatives? (signal of value)
   - Look for patterns: Do they all struggle similarly?

2. **Decision criteria:**
   - If 50%+ struggle similarly → Real market, proceed
   - If only 10-20% struggle → Niche, decide if viable
   - If near-zero struggle → Your unique problem, reconsider

3. **Alternative paths:**
   - Build for yourself, open-source (community contribution)
   - Pivot to adjacent problem with broader market
   - Accept tiny market, optimize for lifestyle business

**Example:**
Many developer tools fail this test:
- Developer experiences pain
- Builds tool to solve it
- Other developers don't share same workflow/pain
- No market beyond builder

---

## Cognitive Biases Affecting Evaluation

### Confirmation Bias

**What It Is:**
Seeking evidence that confirms your existing beliefs, ignoring contradicting evidence.

**How It Shows Up:**
- Interviewing only users who like the product
- Interpreting ambiguous feedback positively
- Dismissing retention data as "measurement error"
- Focusing on success stories, ignoring churn

**Fix:**
- Actively seek disconfirming evidence
- Interview churned users, not just power users
- Look at retention data first, stories second
- Ask: "What would prove me wrong?"

---

### Sunk Cost Fallacy

**What It Is:**
Continuing because of past investment, not future potential.

**How It Shows Up:**
- "I've already spent 6 months building this"
- "Just need one more feature to fix retention"
- Refusing to pivot despite weak signals
- Adding features instead of addressing core issues

**Fix:**
- Evaluate based on future potential, not past effort
- Ask: "If I started today, would I build this?"
- Set clear pivot criteria before building (e.g., "If Day-7 retention < 20% after 3 months, I pivot")
- Accept that iteration includes abandoning what doesn't work

---

### Optimism Bias

**What It Is:**
Overestimating probability of positive outcomes.

**How It Shows Up:**
- "Once I launch, users will come"
- "Retention will improve with more features"
- "I just need to explain it better"
- Ignoring competitive threats

**Fix:**
- Set measurable success criteria upfront
- Plan for pessimistic scenario (what if retention stays low?)
- Look at base rates (most products fail)
- Trust data over intuition

---

## Emergency Fixes by Symptom

### Symptom: Low Day-7 Retention (<20%)

**Immediate Action:**
1. Interview 5 retained and 5 churned users THIS WEEK
2. Identify activation action (what retained users did differently)
3. Redesign onboarding to drive that action
4. Measure improvement in next cohort

---

### Symptom: High Signups, No Engagement

**Immediate Action:**
1. Stop acquisition (don't scale the problem)
2. Analyze first-session behavior (where do users drop off?)
3. Reduce time-to-value (get to aha moment faster)
4. A/B test onboarding variations
5. Resume acquisition only when retention improves

---

### Symptom: Users Say "Interesting" But Don't Return

**Immediate Action:**
1. This is curiosity, not value
2. Reframe around job-to-be-done (not features)
3. Find the struggling moment (when do they need this?)
4. Pivot to solve actual recurring pain
5. Measure problem frequency (daily? weekly? monthly?)

---

### Symptom: No Organic Growth, Only Paid

**Immediate Action:**
1. Identify why users don't share/refer
2. Add sharing incentive (Dropbox model)
3. Make results publicly shareable
4. Create SEO-friendly artifacts
5. If no natural loop possible, reconsider market viability

---

## Final Red Flag: Building Before Validating

**Biggest Mistake:**
Building full product before validating core assumptions.

**Better Approach:**
1. **Week 1**: Interview 10 target users, identify job
2. **Week 2**: Landing page + fake door test, measure interest
3. **Week 3**: MVP (smallest possible version), 10 beta users
4. **Week 4**: Measure retention, iterate or pivot
5. **Month 2+**: Scale only if retention signal strong

**Rule:**
- Spend more time on validation than building
- Code is expensive to change, assumptions are cheap to test
- Good evaluation prevents bad building

If you see these red flags, pause building and fix them first. The best code is code you don't write because you validated the idea properly.
