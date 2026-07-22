# API Safety: Idempotency and Rate Limiting

How to make your API safe, reliable, and resilient.

## Part 1: Idempotency

### The Problem

When an API request fails, should you retry?

```javascript
// User clicks "Create Post"
await fetch('/api/posts', {
  method: 'POST',
  body: JSON.stringify({ title: 'Hello World' })
});
// Request times out. Was the post created? Unknown.
```

If you retry, you might create two posts. If you don't retry, you might create zero posts.

**Idempotency solves this:** You can safely retry the request. It will only create the post once, no matter how many times you retry.

### What is Idempotency?

**Idempotent = Safe to retry without duplicates**

An operation is idempotent if doing it multiple times has the same effect as doing it once.

**Examples:**

```javascript
// ✅ Idempotent (safe to retry)
GET /users/123           // Reading is always safe
DELETE /users/123        // Deleting same ID multiple times is safe
PUT /users/123           // Full replacement is safe

// ❌ Not idempotent (duplicates possible)
POST /users              // Creates new user each time
POST /posts              // Creates new post each time
POST /payments           // Charges credit card each time (!)
```

### When You Need Idempotency

**Always need it:**
- Payments, money transfers
- Sending emails, SMS
- Creating orders, invoices
- Any high-stakes operation

**Usually need it:**
- Creating records (posts, comments, users)
- Updating records (especially partial updates)

**Don't need it:**
- GET requests (reads are inherently safe)
- DELETE by ID (ID serves as idempotency key)
- Internal operations you control

### How to Implement Idempotency

**Use an idempotency key** - a unique identifier for the request.

#### Basic Implementation

```javascript
// Client sends idempotency key
POST /posts
Idempotency-Key: 123e4567-e89b-12d3-a456-426614174000

{
  "title": "Hello World"
}
```

```javascript
// Server checks if we've seen this key before
app.post('/posts', async (req, res) => {
  const idempotencyKey = req.headers['idempotency-key'];
  
  if (!idempotencyKey) {
    return res.status(400).json({
      error: { message: 'Idempotency-Key header required' }
    });
  }
  
  // Check if we've processed this key before
  const existing = await redis.get(`idempotency:${idempotencyKey}`);
  
  if (existing) {
    // We've seen this before - return the cached response
    return res.status(200).json(JSON.parse(existing));
  }
  
  // Process the request
  const post = await db.posts.create({
    title: req.body.title,
    userId: req.user.id
  });
  
  // Cache the response
  await redis.setex(
    `idempotency:${idempotencyKey}`,
    3600,  // Expire after 1 hour
    JSON.stringify(post)
  );
  
  res.status(201).json(post);
});
```

#### Idempotency Key Generation

**Client-side:**
```javascript
// Generate UUID v4
const idempotencyKey = crypto.randomUUID();

fetch('/api/posts', {
  method: 'POST',
  headers: {
    'Idempotency-Key': idempotencyKey,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ title: 'Hello' })
});
```

**Best practices:**
- Use UUIDs (globally unique, unguessable)
- Client generates the key (they control retries)
- Use same key for all retries of the same operation
- Generate new key for new operations

#### Storage Options

**Option 1: Redis (Recommended)**
```javascript
// Store key + response in Redis
await redis.setex(
  `idempotency:${key}`,
  3600,  // Expire after 1 hour
  JSON.stringify(response)
);
```

**Pros:** Fast, automatic expiration, doesn't bloat database
**Cons:** Data lost if Redis crashes (acceptable for most cases)

**Option 2: Database Column**
```javascript
// Add idempotency_key column to table
await db.posts.create({
  title: req.body.title,
  idempotencyKey: req.headers['idempotency-key']
});

// Check for duplicates
const existing = await db.posts.findOne({
  where: { idempotencyKey: key }
});
```

**Pros:** Persistent, survives crashes
**Cons:** Slower, bloats database, harder to expire

**For solo/small teams:** Use Redis. It's simpler and faster.

#### Making Idempotency Optional

**Don't require idempotency keys for low-stakes operations:**

```javascript
app.post('/comments', async (req, res) => {
  const idempotencyKey = req.headers['idempotency-key'];
  
  // Idempotency is optional
  if (idempotencyKey) {
    const existing = await redis.get(`idempotency:${idempotencyKey}`);
    if (existing) {
      return res.json(JSON.parse(existing));
    }
  }
  
  // Create comment
  const comment = await db.comments.create(req.body);
  
  // Cache if key provided
  if (idempotencyKey) {
    await redis.setex(`idempotency:${idempotencyKey}`, 3600, JSON.stringify(comment));
  }
  
  res.status(201).json(comment);
});
```

**Make it required only for high-stakes operations:**

```javascript
app.post('/payments', async (req, res) => {
  const idempotencyKey = req.headers['idempotency-key'];
  
  // Require idempotency key for payments
  if (!idempotencyKey) {
    return res.status(400).json({
      error: { 
        message: 'Idempotency-Key required for payment operations',
        code: 'MISSING_IDEMPOTENCY_KEY'
      }
    });
  }
  
  // ... process payment with idempotency
});
```

### Edge Cases

**What if the request fails halfway?**

```javascript
app.post('/orders', async (req, res) => {
  const key = req.headers['idempotency-key'];
  
  try {
    // Check cache
    const cached = await redis.get(`idempotency:${key}`);
    if (cached) return res.json(JSON.parse(cached));
    
    // Create order
    const order = await db.orders.create(req.body);
    
    // Send confirmation email
    await sendEmail(order.email, 'Order confirmed');
    
    // Cache response
    await redis.setex(`idempotency:${key}`, 3600, JSON.stringify(order));
    
    res.status(201).json(order);
  } catch (error) {
    // If we fail, DON'T cache the error
    // Let the client retry
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

**Key point:** Only cache successful responses. Let clients retry failures.

**What if two requests with same key arrive simultaneously?**

Use a lock:

```javascript
const locked = await redis.set(
  `lock:${key}`,
  '1',
  'EX', 10,  // 10 second expiry
  'NX'       // Only set if doesn't exist
);

if (!locked) {
  // Another request is processing this key
  // Wait a moment and check cache
  await sleep(100);
  const cached = await redis.get(`idempotency:${key}`);
  if (cached) return res.json(JSON.parse(cached));
  
  return res.status(409).json({
    error: { message: 'Request already in progress' }
  });
}

// Process request...

// Release lock
await redis.del(`lock:${key}`);
```

## Part 2: Rate Limiting

### The Problem

APIs are called at the speed of code, not the speed of hands.

```javascript
// Malicious or buggy client
for (let i = 0; i < 1000000; i++) {
  await fetch('/api/users');
}
```

Without rate limiting, this kills your server.

### Basic Rate Limiting

**Limit requests per user per time window:**

```javascript
// 100 requests per minute per API key
const MAX_REQUESTS = 100;
const WINDOW_MS = 60 * 1000;  // 1 minute

app.use(async (req, res, next) => {
  const key = `rate_limit:${req.apiKey.id}`;
  
  const count = await redis.incr(key);
  
  if (count === 1) {
    await redis.expire(key, WINDOW_MS / 1000);
  }
  
  if (count > MAX_REQUESTS) {
    return res.status(429).json({
      error: {
        message: 'Rate limit exceeded',
        retry_after: 60
      }
    });
  }
  
  // Add headers so client knows their limits
  res.setHeader('X-RateLimit-Limit', MAX_REQUESTS);
  res.setHeader('X-RateLimit-Remaining', MAX_REQUESTS - count);
  res.setHeader('X-RateLimit-Reset', Date.now() + WINDOW_MS);
  
  next();
});
```

### Rate Limit Headers

**Tell clients their limits:**

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1640123456
```

**When limit exceeded:**

```
HTTP/1.1 429 Too Many Requests
Retry-After: 60
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1640123456

{
  "error": {
    "message": "Rate limit exceeded. Try again in 60 seconds.",
    "retry_after": 60
  }
}
```

### Different Limits for Different Endpoints

```javascript
const rateLimits = {
  'GET /users': { max: 1000, window: 60 },      // 1000/min for reads
  'POST /users': { max: 10, window: 60 },       // 10/min for creates
  'POST /payments': { max: 5, window: 60 },     // 5/min for payments
};

app.use(async (req, res, next) => {
  const endpoint = `${req.method} ${req.path}`;
  const limits = rateLimits[endpoint] || { max: 100, window: 60 };
  
  const key = `rate_limit:${req.apiKey.id}:${endpoint}`;
  const count = await redis.incr(key);
  
  if (count === 1) {
    await redis.expire(key, limits.window);
  }
  
  if (count > limits.max) {
    return res.status(429).json({
      error: { message: 'Rate limit exceeded' }
    });
  }
  
  next();
});
```

### Sliding Window Rate Limiting

**Problem with fixed windows:**

```
Window 1: 00:00-01:00
- User makes 100 requests at 00:59 ✓

Window 2: 01:00-02:00
- User makes 100 requests at 01:00 ✓

Result: 200 requests in 1 minute!
```

**Solution: Sliding window**

```javascript
async function checkRateLimit(userId, max, windowMs) {
  const now = Date.now();
  const key = `rate_limit:${userId}`;
  
  // Remove old entries
  await redis.zremrangebyscore(key, 0, now - windowMs);
  
  // Count requests in window
  const count = await redis.zcard(key);
  
  if (count >= max) {
    return { allowed: false, remaining: 0 };
  }
  
  // Add this request
  await redis.zadd(key, now, `${now}-${Math.random()}`);
  await redis.expire(key, windowMs / 1000);
  
  return { allowed: true, remaining: max - count - 1 };
}
```

**For solo/small teams:** Simple fixed window is fine. Sliding window is more complex.

### Rate Limit Bypass for Testing

```javascript
// Allow bypassing rate limits in development
if (process.env.NODE_ENV === 'development') {
  return next();
}

// Or use a special header
if (req.headers['x-bypass-rate-limit'] === process.env.BYPASS_SECRET) {
  return next();
}
```

### Emergency Killswitch

**Disable API for specific users in emergencies:**

```javascript
const blockedKeys = await redis.smembers('blocked_api_keys');

if (blockedKeys.includes(req.apiKey.id)) {
  return res.status(403).json({
    error: { 
      message: 'API access temporarily disabled. Contact support.' 
    }
  });
}
```

```bash
# Block a key
redis-cli SADD blocked_api_keys "api_key_123"

# Unblock
redis-cli SREM blocked_api_keys "api_key_123"
```

### Cost-Based Rate Limiting

**Expensive operations cost more:**

```javascript
const costs = {
  'GET /users/:id': 1,
  'GET /users': 5,           // List is more expensive
  'POST /users': 2,
  'POST /exports': 10,       // Very expensive
};

const cost = costs[req.route] || 1;
const count = await redis.incrby(`rate_limit:${req.apiKey.id}`, cost);

if (count > 100) {  // 100 "points" per minute
  return res.status(429).json({ error: 'Rate limit exceeded' });
}
```

### Libraries

**Don't build from scratch. Use a library:**

**Node.js:**
- `express-rate-limit`
- `rate-limiter-flexible`

**Python:**
- `flask-limiter`
- `slowapi` (FastAPI)

**Ruby:**
- `rack-attack`

### Testing Rate Limits

```javascript
describe('Rate Limiting', () => {
  it('blocks after 100 requests', async () => {
    const apiKey = await createTestApiKey();
    
    // Make 100 requests
    for (let i = 0; i < 100; i++) {
      await request(app)
        .get('/users')
        .set('Authorization', `Bearer ${apiKey}`)
        .expect(200);
    }
    
    // 101st request should fail
    await request(app)
      .get('/users')
      .set('Authorization', `Bearer ${apiKey}`)
      .expect(429);
  });

  it('resets after window expires', async () => {
    const apiKey = await createTestApiKey();
    
    // Fill up rate limit
    for (let i = 0; i < 100; i++) {
      await request(app).get('/users').set('Authorization', `Bearer ${apiKey}`);
    }
    
    // Wait for window to expire
    await sleep(61000);  // 61 seconds
    
    // Should work again
    await request(app)
      .get('/users')
      .set('Authorization', `Bearer ${apiKey}`)
      .expect(200);
  });
});
```

## Summary

### Idempotency
- **Use idempotency keys** for operations that create/modify data
- **Make it optional** for low-stakes operations
- **Make it required** for payments and critical operations
- **Store in Redis** with 1-hour expiration
- **Only cache successful responses**

### Rate Limiting
- **Start with simple limits** (e.g., 100 requests/minute)
- **Include headers** so clients know their limits
- **Different limits** for expensive operations
- **Add killswitch** for emergencies
- **Use a library** - don't build from scratch

### Both
- Protect your infrastructure
- Make retries safe
- Be a good citizen of the internet

Your API should be resilient enough that if a client misbehaves, your server doesn't fall over.
