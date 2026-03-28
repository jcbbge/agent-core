---
name: dense-summarization
description: Produces dual-context summaries splitting operational reality for AI assistants from strategic implications for human decision-makers. Use when work needs to be understood by both parties with distinct information needs.
---

# Dual-Audience Dense Summarization

Every technical task has two contexts:

1. **Agent Context** — What the AI assistant needs to know to execute successfully (tool constraints, edge cases, implementation landmines, sequence dependencies)

2. **Human Context** — What you need to know to make decisions, delegate effectively, and understand consequences (strategic implications, resource commitments, failure modes that matter, what "done" actually looks like)

These are not the same information. The agent doesn't need your business priorities. You don't need to know the Bash tool timeout threshold.

## Output Format

```
# [Task Name] — Dual-Context Synthesis

<agent_summary>

[Dense paragraph(s) for AI assistant consumption. Focus on:]
- Tool constraints and workarounds
- Edge cases that break naive implementations
- Sequence dependencies (what must happen before what)
- Environment-specific gotchas
- Verification checkpoints
- Rollback procedures
- Token/context limitations
- Specific file paths or command formats
- What assumptions are dangerous

[Voice: Operational, imperative, warning-heavy. No fluff. Every sentence is a constraint or requirement the agent must respect.]

</agent_summary>

<human_summary>

[Dense paragraph(s) for human consumption. Focus on:]
- What this actually accomplishes in plain language
- Strategic implications and second-order effects
- Resource/time commitment required
- Risk surface area (what could go wrong that you care about)
- Decision points where judgment matters
- Success criteria you can observe without being technical
- What "good enough" looks like vs "perfect"
- Why this approach vs alternatives
- What you're committing to if you approve this

[Voice: Strategic, evaluative, decision-oriented. No implementation detail. Every sentence helps you answer "should I do this?" and "what am I getting into?"]

</human_summary>

## Common Information
[If something matters to BOTH audiences, put it here as bullet list. Usually 2-4 items max.]
- Core invariant or constraint both need to know
- Single source of truth reference
- Critical deadline or dependency
```

## Writing Constraints

### For <agent_summary>:

**Forbidden:**
- Strategic rationale ("This improves user experience")
- Business justification ("We need this for Q3 goals")
- Human judgment calls ("Use your discretion")
- Ambiguous qualifiers ("appropriate", "reasonable", "sufficient")

**Required:**
- Specific numbers (timeout: 5000ms, limit: 1000 lines)
- Exact commands or code patterns
- Concrete file paths
- Verification steps that can be executed
- "If X then Y" conditional logic
- Error states and recovery procedures

**Tone:** You are writing instructions for a literal, context-limited assistant. Be the senior engineer who knows exactly what corners will be cut if not specified.

### For <human_summary>:

**Forbidden:**
- Implementation details ("We'll use Redis with 100ms TTL")
- Code snippets or command syntax
- File paths or directory structures
- Technical workarounds
- Specific error messages

**Required:**
- Business/technical outcome achieved
- Effort level (hours, days, complexity)
- Risk categories ("could break auth", "data migration risk")
- Judgment calls you'll need to make
- What changes if this succeeds vs fails
- Maintenance burden created
- Dependencies on other work

**Tone:** You are the staff engineer briefing the CTO. Assume technical competence but focus on implications, not mechanics.

## Separation Heuristics

Ask for each piece of information:

- **Does the agent need this to execute correctly?** → agent_summary
- **Do I need this to decide if we should do this?** → human_summary
- **Do we both need this for coordination?** → Common Information

Examples of proper separation:

| Information | Goes To | Why |
|-------------|---------|-----|
| "Bash tool has 60s timeout" | agent_summary | Agent hits this limit, you don't |
| "This blocks Q3 release" | human_summary | You care about timeline risk, agent doesn't |
| "Requires sudo access" | agent_summary | Tool constraint for execution |
| "Changes 15K user records" | human_summary | Scale of impact for your risk assessment |
| "Rollback takes 30 minutes" | Common | You care about time, agent needs to know procedure |
| "Database connection string format" | agent_summary | Implementation detail |
| "Could cause 2-hour outage if wrong" | human_summary | Risk you must accept |

## Example Output

**Input:** "Migrate user auth from JWT to session cookies"

```
# Auth Migration — Dual-Context Synthesis

<agent_summary>

This migration touches three integration points: the login API (/api/auth/login), the middleware stack (src/middleware/auth.ts), and the client-side token storage (localStorage → httpOnly cookies). The critical sequence is: (1) deploy cookie-based auth alongside JWT without breaking existing tokens, (2) migrate active sessions via background job, (3) remove JWT validation after 30-day grace period. Danger zones: CORS configuration must explicitly allow credentials on all API routes, Safari's ITP will block cross-domain cookies without proper SameSite=None;Secure attributes, and any client code reading localStorage.getItem('token') will break silently after step 3. Verify each phase with: (1) test login returns Set-Cookie header, (2) check /api/me returns 200 for both JWT and cookie auth during overlap period, (3) confirm zero JWT tokens in Redis after grace period expires. Rollback procedure: revert middleware to JWT-only, redeploy, invalidate all cookie sessions via Redis key deletion pattern "sess:*". The background migration job must be idempotent — run it multiple times safely. Token size limit: 4KB total for cookies; compress claims or use session IDs if user data exceeds this.

</agent_summary>

<human_summary>

This migration improves security posture by moving tokens from client storage (vulnerable to XSS) to httpOnly cookies, and reduces latency by avoiding JWT signature verification on every request. Timeline: 3-4 days implementation plus 30-day grace period where both auth methods work. Risk surface: any auth regression blocks all users immediately — this is a single point of failure change. Mitigation: extensive staging testing, feature flag for gradual rollout, 24-hour monitoring period post-deploy. Effort includes: backend changes (moderate), client-side refactor (significant — every API call needs credential:include), infrastructure (Redis session store provisioning), and security audit. Success criteria: auth latency drops 20-40ms per request, zero XSS token theft vectors, and clean degradation (graceful logout) if Redis fails. Tradeoff accepted: slightly higher operational complexity (session store to maintain) for security gain. If this fails, we roll back to JWT and accept the security debt until next quarter.

</human_summary>

## Common Information
- Grace period ends exactly 30 days after deploy (schedule calendar reminder)
- Security team sign-off required before production deploy
```

## Trigger Conditions

Use when:
- User says "explain this to me" (implies they need human_summary, agent will use full context)
- User asks for work that crosses tool/implementation boundaries
- User needs to delegate but retain decision authority
- User says "summarize for both of us" or similar
- Complex work where what you need to know ≠ what the agent needs to know

Do not use when:
- Pure exploration or brainstorming
- Simple factual lookup
- Work is purely mechanical with no decision points
