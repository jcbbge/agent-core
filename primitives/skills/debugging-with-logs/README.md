# Debugging with Logs

**Transform logging from archaeology to analytics**

This skill teaches agents how to implement effective debugging using wide events (canonical log lines) - a modern approach to logging that captures all context in one comprehensive event per request instead of scattering information across multiple log statements.

**Primary languages**: JavaScript (Node.js, Express, Next.js), PHP (Laravel, Symfony)  
**Also supports**: Go, Python, and any language that can output JSON  
**Target environments**: Web applications, APIs, full-stack apps, servers - anything that executes code

## What This Skill Does

When debugging production issues, traditional logging fails because:
- Information is scattered across multiple log lines
- Context is missing when you need it most
- Grep-ing through logs is like finding a needle in a haystack
- String search has no understanding of structure or relationships

Wide events fix this by emitting ONE comprehensive event per request with ALL context attached. This transforms debugging from "grep and pray" to running precise queries against structured data.

## Quick Example

**Before (traditional logging):**
```javascript
console.log('Request received');
console.log('User:', userId);
console.log('Processing payment');
console.log('ERROR: Payment failed'); // Why? What amount? What method?
```

**After (wide events):**
```javascript
{
  "request_id": "req_abc123",
  "user_id": "user_456",
  "subscription": "premium",
  "cart_total_cents": 15999,
  "payment_method": "card",
  "error_code": "card_declined",
  "error_message": "insufficient_funds",
  "duration_ms": 1247
}
// Everything you need in one event
```

## Installation

### Claude Code / Claude Desktop

```bash
# Install to personal skills directory
cp -r debugging-with-logs ~/.claude/skills/

# Or install to project-specific directory
cp -r debugging-with-logs .claude/skills/
```

### Claude Desktop (Upload)

1. Zip the skill directory:
   ```bash
   zip -r debugging-with-logs.zip debugging-with-logs/
   ```
2. Go to Claude.ai Settings > Features
3. Upload the zip file

### Other Agents (Cursor, VS Code, etc.)

This skill follows the agentskills.io open standard and is portable across platforms. Follow your platform's specific installation instructions for skills.

## Usage

The skill activates automatically when you:
- Ask to "add logging to my code"
- Say "help me debug this issue"
- Request "implement observability"
- Ask "why did this fail?"

### Example Prompts

**Adding logging to new code:**
```
I'm building a checkout API. Add wide event logging to track user purchases.
```

**Debugging existing issues:**
```
Users are reporting checkout failures. Help me add logging to debug this.
```

**Improving existing logs:**
```
Our logs are hard to search. Convert these console.log statements to wide events.
```

## What's Inside

```
debugging-with-logs/
├── SKILL.md                         # Main instructions and quick start
├── references/
│   ├── FIELD-REFERENCE.md          # Complete catalog of fields to include
│   └── IMPLEMENTATION-PATTERNS.md  # Framework-specific examples
└── assets/
    ├── wide-event-template.json    # Starter template
    └── tail-sampling.js            # Intelligent sampling function
```

### SKILL.md

Core concepts and quick start guide covering:
- Philosophy: Why wide events beat traditional logging
- Implementation pattern: Initialize → Enrich → Emit
- Tail sampling: Keep costs down without losing critical events
- Client and server-side examples
- Common mistakes to avoid

### FIELD-REFERENCE.md

Comprehensive catalog of fields organized by category:
- Request context (request_id, method, path, duration)
- User context (user_id, subscription, lifetime value)
- Business context (cart details, payment info, orders)
- Performance context (DB queries, cache hits, API latency)
- Error context (error codes, messages, stack traces)

### IMPLEMENTATION-PATTERNS.md

Framework-specific implementation examples:
- Express.js (Node.js)
- Next.js (App Router)
- PHP (Laravel)
- PHP (Generic/Vanilla)
- Flask (Python)
- FastAPI (Python)
- Go (net/http)
- Rust (Axum)
- Client-side (React)

### Assets

**wide-event-template.json**: Starter template showing all common fields with examples

**tail-sampling.js**: Intelligent sampling function that:
- Always keeps errors and slow requests
- Always keeps VIP users
- Samples successful requests at 5%
- Includes adaptive and environment-aware variants

## Key Concepts

### 1. Wide Events

One comprehensive event per request instead of scattered log lines. Contains all context you might need for debugging.

### 2. High Cardinality

Fields with millions of unique values (user_id, request_id) are the most valuable for debugging specific issues.

### 3. Tail Sampling

Make sampling decisions AFTER request completes:
- Keep 100% of errors
- Keep 100% of slow requests
- Keep 100% of VIP users
- Sample 5% of successful fast requests

### 4. Progressive Disclosure

- Metadata (~100 tokens): Loaded at startup
- Main instructions (~3000 tokens): Loaded when skill activates
- Reference docs: Loaded on demand when needed
- Assets: Referenced when appropriate

## When to Use This Skill

✅ **Use when:**
- Adding logging to new features
- Debugging production issues
- Improving existing logging
- Implementing observability
- Reducing log costs

❌ **Don't use when:**
- Simple scripts that don't need debugging
- Development-only code
- Logs are already working perfectly

## Benefits

**For debugging:**
- One query returns all context
- No grep-ing required
- Precise answers, not guesswork

**For observability:**
- Run analytics on production traffic
- Identify patterns across users
- Track performance regressions

**For cost:**
- Tail sampling reduces volume 80-95%
- Never lose critical events
- Pay only for valuable data

## Testing the Skill

Try these scenarios:

1. **Add logging to an API endpoint:**
   ```
   Add wide event logging to this checkout endpoint [paste code]
   ```

2. **Debug a production issue:**
   ```
   User user_123 reported checkout failed. What logging should I add?
   ```

3. **Improve existing logs:**
   ```
   These logs are hard to debug [paste code]. Convert to wide events.
   ```

## Requirements

- None! Works with any language or framework
- Outputs JSON (universally parsable)
- Compatible with all logging systems
- Integrates with OpenTelemetry if desired

## Portability

This skill follows the [agentskills.io](https://agentskills.io) open standard, making it portable across:
- Claude Code
- Claude Desktop
- Cursor
- VS Code (GitHub Copilot)
- OpenCode
- And any other skills-compatible agent

## Learn More

- **Original article**: https://loggingsucks.com
- **OpenTelemetry**: https://opentelemetry.io
- **agentskills.io**: https://agentskills.io

## License

MIT License - Free to use, modify, and distribute

## Feedback

If you find issues or have suggestions:
1. Use the skill and observe results
2. Note what works and what doesn't
3. Iterate based on real usage patterns

The skill improves through real-world testing, not theoretical refinement.

---

**Remember**: Logs lie when they lack context. Wide events tell the truth, the whole truth, in one structured event.
