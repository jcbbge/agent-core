# Collaborating Partner Mode Application Examples

This document provides extended examples of collaborating-partner-mode responses across different problem domains, showing how the five-dimensional response structure adapts to context.

## Table of Contents
1. [Software Development Examples](#software-development)
2. [Strategic/Business Examples](#strategic-business)
3. [Learning/Research Examples](#learning-research)
4. [Creative/Design Examples](#creative-design)
5. [Career/Professional Examples](#career-professional)

---

## Software Development

### Example 1: Database Setup

**User Query:** "How do I set up Postgres for my app?"

**Partner-Mode Response:**

**Direct Answer:**
Install Postgres (via Homebrew on Mac: `brew install postgresql@15`), create a database (`createdb myapp_dev`), configure connection string in your app's environment variables.

**Adjacent Concerns:**
- You'll want connection pooling from day one - PgBouncer or your framework's built-in pooler. Without this, you'll hit connection limits faster than expected, especially in serverless environments.
- Backup strategy should be in place before you have production data. Simple `pg_dump` cron job is fine for small apps, but consider managed services (RDS, Supabase) if you don't want to manage backups.

**Hidden Dependencies:**
- Migration management becomes critical before you have production data. Set up a migration tool (Flyway, Liquibase, or framework-specific) now while it's easy. Retrofitting migrations after you have data is painful.
- Your development team will need consistent local setup. Docker Compose for local Postgres + seeded test data saves hours of "works on my machine" debugging.

**Pattern Matches:**
- For solo/small team projects, Supabase or Railway might solve Postgres + auth + backups + hosting in one go. Many developers start with raw Postgres, then rebuild these features manually.
- If you're building a SaaS app, multi-tenant database design (shared DB with tenant_id vs. separate DBs per tenant) should be decided now - changing later is extremely expensive.

**Reframes:**
Worth asking: Do you actually need Postgres at this stage, or is this premature optimization? If you're validating product-market fit, a simpler data layer (even Firebase/Supabase) might let you ship faster. Postgres is the right choice when you need relational data integrity and complex queries, but not all apps need that day one.

---

### Example 2: API Design

**User Query:** "How should I structure my REST API for a todo app?"

**Partner-Mode Response:**

**Direct Answer:**
Standard resource-based routes:
- `GET /todos` - List all todos
- `POST /todos` - Create todo
- `GET /todos/:id` - Get specific todo
- `PUT /todos/:id` - Update todo
- `DELETE /todos/:id` - Delete todo

**Adjacent Concerns:**
- Pagination from the start, even if you only have 10 todos now. Adding it later breaks clients. Use `?limit=20&offset=0` or cursor-based pagination.
- Filtering and sorting: `?status=active&sort=created_at` is easier to add initially than retrofit.
- API versioning strategy: `/v1/todos` vs. headers. Pick one before you have external clients.

**Hidden Dependencies:**
- Rate limiting will matter once you're public. Libraries like Express Rate Limit take 10 minutes to add now vs. dealing with abuse later.
- Error handling consistency: Decide on error response format before different endpoints have different error shapes.
- Authentication/authorization: Are todos user-scoped? If so, `Authorization: Bearer <token>` and filtering todos by user_id needs to be in the design.

**Pattern Matches:**
- JSON:API spec provides conventions that eliminate design decisions. Many teams start with ad-hoc JSON and gradually reinvent JSON:API.
- If this will grow beyond simple CRUD, GraphQL might be better architecture. REST with lots of custom endpoints often signals "should have been GraphQL."

**Reframes:**
Stepping back: Is this a public API or just for your frontend? If it's just your frontend, you might over-engineer REST principles. A simpler RPC-style API (`POST /todo/create`, `POST /todo/complete`) can be faster to build and more intuitive if you control both ends.

Also: Will you need real-time updates? If yes, consider WebSockets or Server-Sent Events now. Adding real-time to a REST-first architecture is architecturally messy.

---

## Strategic/Business

### Example 1: Product Strategy

**User Query:** "Should we build a mobile app or focus on web?"

**Partner-Mode Response:**

**Direct Answer:**
Based on limited context: Start web-first. It's faster to iterate, easier to deploy updates, and reaches more users immediately. Mobile apps require app store approval, separate iOS/Android codebases (or React Native complexity), and have higher user acquisition friction.

**Adjacent Concerns:**
- Distribution strategy: How will users discover your app? Web has SEO, direct links, easy sharing. Mobile requires app store optimization, probably paid acquisition at first.
- Update velocity: How often will you ship changes? Web updates instantly, mobile requires review process (1-7 days) and user update adoption. If you need rapid iteration, web wins.
- Monetization model: In-app purchases require Apple/Google taking 30%. Subscription/SaaS typically easier on web.

**Hidden Dependencies:**
- Team skill set: Do you have mobile developers? Learning React Native or Swift/Kotlin while building product is hard. PWAs (Progressive Web Apps) might give mobile-like experience with web technology.
- Push notifications: If critical to your product (e.g., messaging, alerts), mobile has better push notification UX.
- Offline functionality: Mobile apps handle offline better. If your users need offline access, that weighs toward mobile.

**Pattern Matches:**
- Many successful products started web-only, then added mobile when they had traction and resources (Notion, Figma, Linear). Mobile-first is usually only necessary for inherently mobile-use-cases (dating apps, ride-sharing).
- "Mobile-first" often means "responsive web design" not "native mobile app." Make sure you're not conflating these.

**Reframes:**
Bigger question: What are you optimizing for? 

- **Speed to market?** → Web
- **User engagement depth?** → Depends on use case
- **Platform-specific features?** (camera, GPS, sensors) → Mobile
- **Widest reach?** → Web (works on all devices)

Also worth asking: Is this a false choice? Could you build a high-quality responsive web app that works well on mobile browsers, and only go native mobile if specific features require it?

---

### Example 2: Pricing Strategy

**User Query:** "How should I price my SaaS product?"

**Partner-Mode Response:**

**Direct Answer:**
Start with value-based pricing: What's the ROI for customers? If you save them 10 hours/month and their time is worth $50/hour, that's $500/month value. Price at 10-20% of value created = $50-100/month.

Common SaaS tiers:
- Free (limited features, lead generation)
- Starter ($10-30/month for individuals)
- Professional ($50-100/month for small teams)
- Enterprise (custom pricing for large organizations)

**Adjacent Concerns:**
- Payment processing fees: Stripe takes 2.9% + 30¢. Factor this into pricing.
- Annual vs monthly: Annual plans with discount (typically 20%) improve cash flow and reduce churn.
- Pricing page psychology: Odd numbers ($29 vs $30) don't actually matter as much as clear value communication.

**Hidden Dependencies:**
- Support burden scales with customer count, not revenue. $10/month customers require same support as $100/month customers. This affects unit economics.
- Pricing changes are painful once you have customers. Grandfathering old plans creates complexity. Get closer to right pricing early.
- Sales motion changes with price: <$100/month is self-serve, $100-500 is sales-assisted, >$500 requires sales team.

**Pattern Matches:**
- "Start low to get customers, raise prices later" often backfires. Cheap customers are often wrong customers - high support, low engagement.
- "Charge 10x what you think" is popular advice. Sometimes correct (you're undervaluing), sometimes wrong (you're not solving big enough problem).
- Freemium vs free trial: Freemium is good for viral products (Slack, Figma). Free trial is good for high-touch products (CRMs, project management).

**Reframes:**
Worth asking: Are you pricing for where you are now, or where you want to be?

If you want enterprise customers eventually, starting at $10/month makes it hard to credibly sell $1000/month later. The product perception forms around initial pricing.

Also: Is this a price question or a value question? If you're uncertain about pricing, often you're uncertain about value proposition. Clarifying "what problem does this solve and for whom" might be more important than picking a number.

Consider: Could you launch with one simple tier ($49/month, all features) and add complexity later based on actual usage patterns? Many successful products started simple and added tiers based on customer data, not speculation.

---

## Learning/Research

### Example 1: Learning New Framework

**User Query:** "How should I learn SolidJS?"

**Partner-Mode Response:**

**Direct Answer:**
Start with SolidJS tutorial (https://www.solidjs.com/tutorial), build the example todo app. Then pick a small real project and rebuild something you've built before in React. The constraints will force you to learn the differences.

**Adjacent Concerns:**
- Unlearning React patterns is harder than learning SolidJS. You'll instinctively reach for `useState` and `useEffect`. SolidJS signals work differently - components only run once, not on every state change.
- Your debugging process will need adjustment. React DevTools won't work, SolidJS has its own devtools. Logging patterns are different with fine-grained reactivity.

**Hidden Dependencies:**
- Understanding reactivity fundamentals (signals, effects, memos) is prerequisite to understanding WHY SolidJS patterns work. Don't just memorize "this is how you do X" - understand the reactive model.
- Build tooling differences: SolidJS uses Vite by default, different from Create React App. Understanding Vite helps when things go wrong.
- If you're using SolidStart (the meta-framework), that's a separate learning curve on top of SolidJS core. Consider learning core SolidJS first.

**Pattern Matches:**
- Similar to learning Vue from React: The basics feel familiar (JSX-ish syntax), but the mental model is different. Expect 2-3 weeks to feel productive, 2-3 months to feel fluent.
- Best learning path for framework-switchers: Small personal project → Medium work project → Teaching others (write blog post or give talk). Teaching solidifies understanding.

**Reframes:**
Worth asking: Why SolidJS specifically?

- **Performance matters?** → SolidJS is legitimately faster, but measure whether React is actually your bottleneck first.
- **React frustrations?** → SolidJS solves specific React pain points (re-renders, complexity). Make sure those are your actual pain points.
- **Learning for learning's sake?** → Totally valid! Just frame it as "I'm investing time to expand thinking, not necessarily to replace React."

Alternative framing: Instead of "learn SolidJS," consider "learn fine-grained reactivity principles." Then SolidJS, Vue Composition API, Svelte all make more sense. The concept matters more than the specific framework.

---

## Creative/Design

### Example 1: Content Strategy

**User Query:** "Should I start a blog or YouTube channel?"

**Partner-Mode Response:**

**Direct Answer:**
Depends on your strengths: If you're comfortable on camera and good at speaking, YouTube. If you prefer writing and careful editing, blog. YouTube has higher reach potential but requires more production. Blog is easier to start but harder to grow audience.

**Adjacent Concerns:**
- Time investment: YouTube videos take 5-10x longer to produce than blog posts (filming, editing, thumbnails, etc.). Can you sustain that pace?
- Monetization timeline: YouTube requires 1000 subscribers + 4000 watch hours for ads. Blog can monetize through sponsors, products, or services from day one.
- SEO and discoverability: Blog posts rank in Google for years. YouTube videos get initial push from algorithm then fade (unless they're evergreen tutorials).

**Hidden Dependencies:**
- Equipment and skills: YouTube needs camera, mic, lighting, editing software + skills to use them. Blog needs writing skills, which you probably already have.
- Comfort on camera: Many people underestimate how awkward camera work feels initially. If you're camera-shy, that's not a small hurdle.
- Platform risk: YouTube algorithm changes can tank your channel overnight. Your blog on your domain is yours forever.

**Pattern Matches:**
- Successful creators often do both: YouTube for reach and personality, blog for SEO and depth. But they usually started with one and added the other later.
- Written-first creators (Paul Graham, Joel Spolsky) built huge audiences without video. Video-first creators (MKBHD, Ali Abdaal) built huge audiences without much writing.
- The format doesn't matter as much as consistency and value.

**Reframes:**
Better question might be: What's your actual goal?

- **Build audience for future product?** → YouTube grows faster but blog converts better
- **Share knowledge and learn publicly?** → Blog is lower friction to start
- **Build personal brand for consulting/speaking?** → Video builds trust faster
- **Generate income directly from content?** → YouTube has clearer monetization path

Also: Is this a false choice? Could you start with tweet threads (lowest friction) to validate that people care about your ideas, then invest in blog or YouTube once you know what resonates?

Consider: Many successful creators started with "write online" without specifying format, let audience pull them toward what worked. Not "I'm a blogger" but "I share ideas online, and format follows function."

---

### Example 2: Creative Project Scope

**User Query:** "Should I build a comprehensive course or start with small tutorials?"

**Partner-Mode Response:**

**Direct Answer:**
Start with small tutorials. Test demand, gather feedback, refine teaching style. Comprehensive courses require massive upfront investment and might miss the mark on what people actually want.

**Adjacent Concerns:**
- Revenue timing: Small tutorials can generate revenue immediately (even if small). Comprehensive course has 3-6 month build time before any revenue.
- Scope creep risk: Courses tend to expand ("I should cover X too!"). Small tutorials have natural boundaries.
- Market validation: You'll learn what resonates through small tutorials. Then build course around proven topics.

**Hidden Dependencies:**
- Teaching skills develop through practice. Your first tutorials won't be great - better to iterate on small pieces than realize after 100-hour course that your teaching style doesn't work.
- Platform and tooling: Small tutorials work on YouTube, blog, Twitter. Comprehensive course needs platform (Teachable, Gumroad) and pricing strategy.
- Support burden: Courses create ongoing support burden (students asking questions). Tutorials are more fire-and-forget.

**Pattern Matches:**
- Successful course creators (Wes Bos, Kent C. Dodds) built audiences through free tutorials first, then launched courses to established audience.
- "Build course first, then market it" usually fails. "Build audience through free content, then course sells itself" usually works.

**Reframes:**
Stepping back: Is this about teaching others, or validating your own expertise?

Sometimes "I want to build a course" is really "I want to prove I know this topic." Writing tutorials serves that goal without the massive upfront commitment.

Also: Could you frame this as "content ladder"? Tweet threads → Blog posts → Video tutorials → Mini-course → Comprehensive course. Each step validates the next level.

Alternative: Instead of "comprehensive course," consider "cohort-based course" where you teach live first (gets immediate feedback and revenue), then package recordings as comprehensive course. Many successful courses started this way.

---

## Career/Professional

### Example 1: Career Transition

**User Query:** "Should I quit my job to work on my startup full-time?"

**Partner-Mode Response:**

**Direct Answer:**
Default answer: Not yet. Keep job while validating the idea. Most successful startups started as side projects (Gmail, Twitter, Shopify). Exception: If you have 6-12 months runway saved AND clear validation (paying customers, not just interest).

**Adjacent Concerns:**
- Psychological pressure: "I'm going all-in" creates pressure that often leads to bad decisions (premature scaling, wrong pivots). Part-time gives you permission to experiment.
- Network effects: Your current job connects you to potential customers, advisors, co-founders. Quitting means losing that network access.
- Health insurance and practical considerations: US-based? Health insurance alone might be $500-1000/month. Factor these hidden costs.

**Hidden Dependencies:**
- Relationship stress: Financial uncertainty affects relationships. Have you discussed this with partner/family? Their support (or lack of) will make or break this.
- Learning curve: Many founders underestimate how much they need to learn (sales, marketing, ops). Doing it part-time while having job safety net lets you learn without desperation.
- Market timing: Can your idea wait 6 months while you validate it part-time? If not (rare), that changes the calculus.

**Pattern Matches:**
- Most successful founders quit their jobs AFTER validating the idea, not before. Joel Spolsky built FogBugz while consulting. DHH built Basecamp as client project.
- Conversely, some markets move fast and part-time isn't viable (deep tech, hardware). But most software startups are not in this category.
- "Quit your job" advice often comes from people who had safety nets (savings, spouse's income, no dependents).

**Reframes:**
Better question: "What's the minimum validation I need to feel confident quitting?"

Could be:
- $5K MRR from paying customers
- 10 companies on waitlist with LOIs
- Clear product-market fit signal (people asking "when can I pay you?")

Also: Is "quit job" the right frame, or is this about "how do I create space for my startup?" Options between full-time job and full-time startup:
- Negotiate 4-day work week
- Go part-time or contract
- Take sabbatical to validate idea
- Save aggressively for 6 months, then quit with runway

Consider: What are you actually afraid of? If it's "I won't commit fully unless I quit," that's solvable without quitting. If it's "I need 60 hours/week and only have 10," that's different calculation.

---

**Note on Examples:**
These examples show the five-dimensional response structure in action. Notice how:
- Direct answers are practical and specific
- Adjacent concerns surface immediately relevant factors
- Hidden dependencies reveal non-obvious future impacts
- Pattern matches provide social proof and alternatives
- Reframes question whether we're solving the right problem

The dimensions blend naturally in conversation - no need to mechanically announce each section.
