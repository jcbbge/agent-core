# Authentication Guide

Simple, practical authentication for solo developers and small teams.

## The Golden Rule

**Start with API keys.** They're simple, they work, and everyone knows how to use them.

Yes, OAuth is more secure. Yes, JWT tokens are stateless and scalable. **It doesn't matter.** API keys are good enough for 90% of use cases, and you can always add OAuth later.

## Why API Keys?

### They're Dead Simple

**Creating an API key:**
```javascript
const apiKey = crypto.randomBytes(32).toString('hex');
// Store in database
await db.apiKeys.create({
  userId: user.id,
  key: apiKey,
  createdAt: new Date()
});
```

**Using an API key:**
```bash
curl https://api.example.com/users \
  -H "Authorization: Bearer sk_live_abc123xyz789"
```

That's it. No OAuth handshake, no token refresh, no PKCE flow. Just a header.

### Your Users Aren't All Engineers

Many API users are:
- Product managers automating workflows
- Data analysts pulling reports
- Students learning to code
- Hobbyists building side projects

These users struggle with OAuth. They can copy/paste an API key.

### You Can Always Add OAuth Later

Start with API keys. If you get enterprise customers who demand OAuth, add it then. Don't over-engineer day one.

## API Key Implementation

### Generating Keys

```javascript
// Use crypto for randomness
const crypto = require('crypto');

function generateApiKey() {
  // 32 bytes = 64 hex characters
  const key = crypto.randomBytes(32).toString('hex');
  
  // Add a prefix so keys are identifiable
  return `sk_live_${key}`;
  // sk = secret key
  // live = production environment (vs sk_test_ for sandbox)
}
```

**Why prefixes?**
- Easy to identify in logs (`sk_live_` = production key)
- Can rotate by prefix (`sk_v2_` for new format)
- Helps users spot test vs production keys

### Storing Keys

**Option 1: Hash them (more secure)**
```javascript
const bcrypt = require('bcrypt');

// When creating
const apiKey = generateApiKey();
const hashedKey = await bcrypt.hash(apiKey, 10);

await db.apiKeys.create({
  userId: user.id,
  keyHash: hashedKey,  // Store hash, not plain text
  prefix: apiKey.substring(0, 12),  // Store prefix for lookup
  createdAt: new Date()
});

// Show user the key ONCE
return { api_key: apiKey };

// When authenticating
const keyRecord = await db.apiKeys.findOne({
  where: { prefix: providedKey.substring(0, 12) }
});

const isValid = await bcrypt.compare(providedKey, keyRecord.keyHash);
```

**Option 2: Store plain text (simpler)**
```javascript
// When creating
const apiKey = generateApiKey();

await db.apiKeys.create({
  userId: user.id,
  key: apiKey,  // Plain text
  createdAt: new Date()
});

// When authenticating  
const keyRecord = await db.apiKeys.findOne({
  where: { key: providedKey }
});
```

**For solo/small teams:** Plain text is fine. Just use HTTPS and don't log keys.

### Authentication Middleware

```javascript
// Express.js middleware
async function authenticateApiKey(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: { message: 'Missing API key' }
    });
  }

  const apiKey = authHeader.substring(7); // Remove 'Bearer '
  
  const keyRecord = await db.apiKeys.findOne({
    where: { key: apiKey },
    include: ['user']
  });

  if (!keyRecord) {
    return res.status(401).json({
      error: { message: 'Invalid API key' }
    });
  }

  // Attach user to request
  req.user = keyRecord.user;
  req.apiKey = keyRecord;
  
  // Update last used timestamp (optional)
  await keyRecord.update({ lastUsedAt: new Date() });
  
  next();
}

// Use it
app.get('/users', authenticateApiKey, async (req, res) => {
  // req.user is available here
  const users = await db.users.findAll();
  res.json({ data: users });
});
```

### Where to Accept Keys

**Preferred: Authorization header**
```
Authorization: Bearer sk_live_abc123
```

**Alternative: Custom header**
```
X-API-Key: sk_live_abc123
```

**Don't use query parameters:**
```
GET /users?api_key=sk_live_abc123  ❌
```

Query params get logged in server logs, proxy logs, browser history, etc. Headers are safer.

## API Key Features

### Multiple Keys Per User

Let users create multiple keys for different purposes:

```javascript
await db.apiKeys.create({
  userId: user.id,
  key: generateApiKey(),
  name: 'Production Server',  // User-defined name
  createdAt: new Date()
});

await db.apiKeys.create({
  userId: user.id,
  key: generateApiKey(),
  name: 'Local Development',
  createdAt: new Date()
});
```

This lets them rotate keys without breaking everything.

### Key Expiration (Optional)

```javascript
await db.apiKeys.create({
  userId: user.id,
  key: generateApiKey(),
  expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)  // 90 days
});

// In middleware
if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
  return res.status(401).json({
    error: { message: 'API key expired' }
  });
}
```

**For solo/small teams:** Skip this unless you need it for compliance. Long-lived keys are simpler.

### Key Scopes/Permissions (Optional)

```javascript
await db.apiKeys.create({
  userId: user.id,
  key: generateApiKey(),
  scopes: ['users:read', 'posts:write']  // Limited permissions
});

// In middleware
function requireScope(scope) {
  return (req, res, next) => {
    if (!req.apiKey.scopes.includes(scope)) {
      return res.status(403).json({
        error: { message: 'Insufficient permissions' }
      });
    }
    next();
  };
}

// Use it
app.post('/posts', authenticateApiKey, requireScope('posts:write'), ...);
```

**For solo/small teams:** Skip this initially. Add it if you get requests from security-conscious customers.

## When to Add OAuth

Consider OAuth when:
- Enterprise customers require it
- You're building a third-party integration marketplace
- Users need to grant access without sharing passwords
- You need fine-grained permission controls

## OAuth 2.0 Quick Overview

**The flow (simplified):**

1. User clicks "Connect to [Your App]"
2. Redirected to your OAuth page
3. User approves access
4. User redirected back with authorization code
5. Your app exchanges code for access token
6. Your app uses access token to call API

**Example (Authorization Code Flow):**

```javascript
// Step 1: Redirect user to authorize
app.get('/oauth/authorize', (req, res) => {
  const { client_id, redirect_uri, scope, state } = req.query;
  
  // Show authorization page
  res.render('authorize', { client_id, scope });
});

// Step 2: User approves
app.post('/oauth/authorize', async (req, res) => {
  const { client_id, redirect_uri, scope } = req.body;
  
  // Create authorization code
  const code = crypto.randomBytes(32).toString('hex');
  await db.authCodes.create({
    code,
    userId: req.user.id,
    clientId: client_id,
    scope,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000)  // 10 min
  });
  
  // Redirect back
  res.redirect(`${redirect_uri}?code=${code}`);
});

// Step 3: Exchange code for token
app.post('/oauth/token', async (req, res) => {
  const { code, client_id, client_secret } = req.body;
  
  const authCode = await db.authCodes.findOne({ where: { code } });
  
  if (!authCode || authCode.expiresAt < new Date()) {
    return res.status(400).json({ error: 'Invalid code' });
  }
  
  // Verify client
  const client = await db.oauthClients.findOne({ 
    where: { clientId: client_id, clientSecret: client_secret }
  });
  
  if (!client) {
    return res.status(401).json({ error: 'Invalid client' });
  }
  
  // Create access token
  const accessToken = crypto.randomBytes(32).toString('hex');
  await db.accessTokens.create({
    token: accessToken,
    userId: authCode.userId,
    clientId: client_id,
    scope: authCode.scope,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000)  // 1 hour
  });
  
  res.json({
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: 3600,
    scope: authCode.scope
  });
});
```

**Don't build this yourself.** Use a library:
- Node.js: `oauth2-server`
- Python: `authlib`
- Ruby: `doorkeeper`

## JWT Tokens (Alternative to API Keys)

**What are JWTs?**
- Self-contained tokens
- Include user info + expiration
- Stateless (no database lookup needed)

**Example:**
```javascript
const jwt = require('jsonwebtoken');

// Creating a JWT
const token = jwt.sign(
  { userId: user.id, email: user.email },
  process.env.JWT_SECRET,
  { expiresIn: '1h' }
);

// Verifying a JWT
try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = decoded;
} catch (err) {
  return res.status(401).json({ error: 'Invalid token' });
}
```

**Pros:**
- Stateless (no database lookup)
- Include user data in token
- Easy to verify

**Cons:**
- Can't revoke without database
- Tokens can get large
- Must protect secret key

**For solo/small teams:** API keys are simpler. Use JWTs if you need stateless auth for scaling.

## Rate Limiting Per Key

Track usage per API key:

```javascript
// In middleware
const rateLimitKey = `rate_limit:${req.apiKey.id}`;
const requestCount = await redis.incr(rateLimitKey);

if (requestCount === 1) {
  await redis.expire(rateLimitKey, 60);  // 1 minute window
}

if (requestCount > 100) {  // 100 requests per minute
  return res.status(429).json({
    error: { message: 'Rate limit exceeded' }
  });
}
```

See [safety.md](safety.md) for more on rate limiting.

## Testing Authentication

```javascript
describe('API Key Authentication', () => {
  it('accepts valid API key', async () => {
    const apiKey = await createTestApiKey();
    const res = await request(app)
      .get('/users')
      .set('Authorization', `Bearer ${apiKey}`);
    
    expect(res.status).toBe(200);
  });

  it('rejects invalid API key', async () => {
    const res = await request(app)
      .get('/users')
      .set('Authorization', 'Bearer invalid_key');
    
    expect(res.status).toBe(401);
  });

  it('rejects missing API key', async () => {
    const res = await request(app).get('/users');
    expect(res.status).toBe(401);
  });
});
```

## Summary

**For solo/small teams:**

1. **Start with API keys** (simple, works for 90% of cases)
2. **Use Authorization header** (safer than query params)
3. **Add prefixes** (sk_live_, sk_test_)
4. **Allow multiple keys per user** (easier rotation)
5. **Skip expiration/scopes** (add later if needed)
6. **Add OAuth only when required** (don't over-engineer)

**Remember:**
- The best auth is auth that users can actually use
- Security without usability leads to insecure workarounds
- Start simple, add complexity when you need it

Your API key implementation can literally be 50 lines of code. That's enough.
