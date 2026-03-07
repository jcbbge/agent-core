---
name: debugging-with-logs
description: Implement effective debugging using wide events (canonical log lines) for web applications, APIs, and servers. Use when adding logging to JavaScript/PHP applications (or Go/Python), debugging production issues, or improving observability. Focuses on high-cardinality, context-rich events instead of scattered log statements.
license: MIT
metadata:
  author: agentskills.io
  version: "1.0"
---

# Debugging with Wide Events

## When to use this skill

Use this skill when you need to:
- Add logging to client-side or server-side code for debugging
- Debug production issues (user complaints, errors, performance problems)
- Improve observability without drowning in log volume
- Replace scattered `console.log` statements with structured events
- Implement cost-effective logging at scale

**Trigger phrases**: "add logging", "debug this issue", "trace this error", "why did X fail", "implement observability"

## Core philosophy

**Traditional logging is broken**: Scattered log lines optimized for writing, not querying. When debugging, you grep through thousands of lines hoping to find context.

**Wide events fix this**: Emit ONE comprehensive event per request/operation with ALL context attached. Transform debugging from archaeology to analytics.

```
Traditional (bad):
2024-12-20T10:23:45Z INFO Request received
2024-12-20T10:23:45Z DEBUG User: user_123
2024-12-20T10:23:46Z DEBUG Processing payment
2024-12-20T10:23:47Z ERROR Payment failed
// Missing: Why? What payment method? What was the amount?

Wide event (good):
{
  "timestamp": "2024-12-20T10:23:45Z",
  "request_id": "req_abc123",
  "user_id": "user_123",
  "subscription": "premium",
  "payment_method": "card",
  "amount_cents": 15999,
  "error_code": "card_declined",
  "error_message": "insufficient_funds",
  "duration_ms": 1247
}
// Everything you need to debug in one event
```

## Quick start

### 1. Set up middleware to capture events

Build the event throughout the request lifecycle, emit once at the end:

```javascript
// middleware/wideEvent.js
export function wideEventMiddleware() {
  return async (ctx, next) => {
    const startTime = Date.now();
    
    // Initialize wide event with request context
    const event = {
      timestamp: new Date().toISOString(),
      request_id: ctx.get('requestId') || generateId(),
      method: ctx.req.method,
      path: ctx.req.path,
      service: process.env.SERVICE_NAME,
      version: process.env.SERVICE_VERSION,
      region: process.env.REGION,
    };
    
    // Make event accessible to handlers
    ctx.set('wideEvent', event);
    
    try {
      await next();
      event.status_code = ctx.res.status;
      event.outcome = 'success';
    } catch (error) {
      event.status_code = 500;
      event.outcome = 'error';
      event.error = {
        type: error.name,
        message: error.message,
        code: error.code,
        stack: error.stack,
      };
      throw error;
    } finally {
      event.duration_ms = Date.now() - startTime;
      console.log(JSON.stringify(event)); // Emit as JSON
    }
  };
}
```

### 2. Enrich with business context in handlers

Add context as you process the request:

```javascript
app.post('/checkout', async (ctx) => {
  const event = ctx.get('wideEvent');
  const user = ctx.get('user');
  
  // Add user context (always include user data)
  event.user = {
    id: user.id,
    subscription: user.subscription,
    account_age_days: daysSince(user.createdAt),
    lifetime_value_cents: user.ltv,
  };
  
  // Add business context as you process
  const cart = await getCart(user.id);
  event.cart = {
    id: cart.id,
    item_count: cart.items.length,
    total_cents: cart.total,
    coupon_code: cart.coupon?.code,
  };
  
  // Add performance tracking
  const paymentStart = Date.now();
  const payment = await processPayment(cart, user);
  
  event.payment = {
    method: payment.method,
    provider: payment.provider,
    latency_ms: Date.now() - paymentStart,
    attempt: payment.attemptNumber,
  };
  
  // Add error details if payment failed
  if (payment.error) {
    event.error = {
      type: 'PaymentError',
      code: payment.error.code,
      provider_code: payment.error.providerCode,
      retriable: payment.error.retriable,
    };
  }
  
  return ctx.json({ orderId: payment.orderId });
});
```

### 3. Implement tail sampling

Keep costs manageable by intelligently sampling:

```javascript
// Always keep: errors, slow requests, VIP users
// Random sample: successful fast requests

function shouldSample(event) {
  // Always keep errors
  if (event.status_code >= 500) return true;
  if (event.error) return true;
  
  // Always keep slow requests (above p99)
  if (event.duration_ms > 2000) return true;
  
  // Always keep VIP users
  if (event.user?.subscription === 'enterprise') return true;
  
  // Always keep specific feature flags (for debugging rollouts)
  if (event.feature_flags?.new_checkout) return true;
  
  // Random sample the rest at 5%
  return Math.random() < 0.05;
}

// In your middleware:
finally {
  event.duration_ms = Date.now() - startTime;
  if (shouldSample(event)) {
    console.log(JSON.stringify(event));
  }
}
```

## Field categories to include

Your wide events should capture context across these categories. See [FIELD-REFERENCE.md](references/FIELD-REFERENCE.md) for the complete catalog.

### Essential fields (always include)
- **Request context**: `request_id`, `timestamp`, `method`, `path`, `status_code`, `duration_ms`
- **Infrastructure**: `service`, `version`, `region`, `deployment_id`
- **User context**: `user_id`, `session_id`, `subscription_tier`

### Business context (include what's relevant)
- Cart details, payment info, product data
- Feature flags enabled for this request
- A/B test variants
- Customer lifetime value, account age

### Error context (when errors occur)
- Error type, code, message
- Provider-specific error codes
- Whether error is retriable
- Stack traces (in development)

### Performance context
- Duration of key operations
- Database query count and latency
- External API call latency
- Cache hit/miss

## Client-side implementation

Wide events work on the frontend too:

```javascript
// Client-side wide event
function trackUserAction(action, context = {}) {
  const event = {
    timestamp: new Date().toISOString(),
    event_id: generateId(),
    action: action, // 'button_click', 'form_submit', 'page_view'
    
    // User context
    user_id: getCurrentUserId(),
    session_id: getSessionId(),
    
    // Page context
    page_url: window.location.href,
    page_title: document.title,
    referrer: document.referrer,
    
    // Device context
    user_agent: navigator.userAgent,
    viewport_width: window.innerWidth,
    viewport_height: window.innerHeight,
    
    // Performance context
    page_load_ms: performance.now(),
    
    // Business context (passed in)
    ...context,
  };
  
  // Send to analytics endpoint
  fetch('/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  });
}

// Usage:
trackUserAction('checkout_attempted', {
  cart_value_cents: 15999,
  item_count: 3,
  payment_method: 'card',
});
```

## Debugging workflow

### When a user reports an issue

1. **Query by high-cardinality field**: `user_id`, `email`, `session_id`, `request_id`
2. **Get complete context instantly**: One query returns everything about their request
3. **No grep-ing required**: Structured data enables precise queries

```sql
-- Traditional debugging: pray and grep
grep "user_123" logs/*.log | grep "checkout" | less

-- Wide events: precise query
SELECT * FROM events 
WHERE user_id = 'user_123' 
  AND path = '/api/checkout'
  AND timestamp > NOW() - INTERVAL '1 hour'
ORDER BY timestamp DESC;
```

### When investigating patterns

Wide events let you run analytics on production traffic:

```sql
-- Which payment provider has the highest error rate?
SELECT 
  payment.provider,
  COUNT(*) as total,
  SUM(CASE WHEN error IS NOT NULL THEN 1 ELSE 0 END) as errors,
  AVG(duration_ms) as avg_latency_ms
FROM events
WHERE path = '/api/checkout'
  AND timestamp > NOW() - INTERVAL '24 hours'
GROUP BY payment.provider;

-- Are premium users experiencing more errors?
SELECT 
  user.subscription,
  COUNT(*) as requests,
  SUM(CASE WHEN status_code >= 500 THEN 1 ELSE 0 END) as errors
FROM events
WHERE timestamp > NOW() - INTERVAL '1 hour'
GROUP BY user.subscription;

-- What's the p99 latency for the new feature?
SELECT 
  percentile_cont(0.99) WITHIN GROUP (ORDER BY duration_ms) as p99
FROM events
WHERE feature_flags->>'new_checkout' = 'true'
  AND timestamp > NOW() - INTERVAL '24 hours';
```

## Common mistakes to avoid

### ❌ Don't: Scatter context across multiple log lines
```javascript
console.log('User logged in:', userId);
console.log('Subscription:', subscription);
console.log('Processing checkout');
console.log('Payment method:', paymentMethod);
// Hard to correlate, easy to lose context
```

### ✅ Do: Capture everything in one event
```javascript
const event = {
  action: 'checkout',
  user_id: userId,
  subscription: subscription,
  payment_method: paymentMethod,
  // ... all context
};
console.log(JSON.stringify(event));
```

### ❌ Don't: Log without context
```javascript
console.log('Payment failed');
// Why? For which user? What amount? What payment method?
```

### ✅ Do: Include all relevant context
```javascript
event.error = {
  type: 'PaymentError',
  code: 'card_declined',
  provider_code: 'insufficient_funds',
  user_id: userId,
  amount_cents: 15999,
  payment_method: 'card',
  attempt_number: 3,
};
```

### ❌ Don't: Random sample blindly
```javascript
// Might drop the one error that explains your outage
if (Math.random() < 0.01) {
  console.log(event);
}
```

### ✅ Do: Use tail sampling
```javascript
// Always keep errors, slow requests, VIP users
if (event.error || event.duration_ms > 2000 || event.user?.vip) {
  console.log(event);
} else if (Math.random() < 0.05) {
  console.log(event);
}
```

## Integration with OpenTelemetry

Wide events complement OpenTelemetry perfectly. Your wide events become your trace spans:

```javascript
import { trace } from '@opentelemetry/api';

app.post('/checkout', async (ctx) => {
  const span = trace.getActiveSpan();
  const event = ctx.get('wideEvent');
  
  // Add all your wide event fields as span attributes
  span?.setAttributes({
    'user.id': event.user.id,
    'user.subscription': event.user.subscription,
    'cart.total_cents': event.cart.total_cents,
    'payment.method': event.payment.method,
    // ... all fields
  });
  
  // Now you have:
  // - Tracing: Shows request flow across services
  // - Context: Shows what happened within this service
});
```

## Advanced: Framework-specific patterns

For detailed implementation examples in JavaScript (Express, Next.js), PHP (Laravel, vanilla), Python (Flask, FastAPI), Go, and Rust, see [IMPLEMENTATION-PATTERNS.md](references/IMPLEMENTATION-PATTERNS.md).

## Resources

- **Field reference**: [FIELD-REFERENCE.md](references/FIELD-REFERENCE.md) - Complete catalog of fields to include
- **Templates**: [assets/wide-event-template.json](assets/wide-event-template.json) - Starter template
- **Sampling**: [assets/tail-sampling.js](assets/tail-sampling.js) - Tail sampling function
- **Original article**: https://loggingsucks.com

## Key takeaways

1. **One event per request** with all context attached
2. **High cardinality fields** (user_id, request_id) are most valuable
3. **Business context** matters more than technical details
4. **Tail sampling** keeps costs down without losing critical events
5. **Query, don't grep**: Structured data enables analytics, not just searching

When implemented properly, debugging transforms from archaeology to analytics. Instead of grep-ing through logs hoping to find clues, you query structured data and get precise answers.
