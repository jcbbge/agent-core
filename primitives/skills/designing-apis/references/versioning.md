# API Versioning Guide

A practical guide to versioning APIs for solo developers and small teams.

## The Core Principle

**Versioning is a necessary evil.** It should be your last resort, not your first option.

Every new version you add:
- Doubles your maintenance burden
- Confuses users
- Creates technical debt
- Requires ongoing support for multiple versions

## When to Version

### ❌ Bad Reasons to Version

- "The new structure is cleaner"
- "I made a typo in a field name"
- "This would be easier to document"
- "I want to refactor the code"

Remember: **we do not break userspace** just for aesthetics.

### ✅ Good Reasons to Version

- Security vulnerability requires fundamental restructuring
- Product pivot requires completely different data model
- Performance requires incompatible changes to pagination/streaming
- Legal/compliance requirements force breaking changes

Even then, consider if you can solve it another way first.

## Versioning Strategies

### Strategy 1: URL Versioning (Recommended)

Include version in the URL path:

```
https://api.example.com/v1/users
https://api.example.com/v2/users
```

**Pros:**
- Extremely clear which version is being used
- Easy to route in your backend
- Works with any HTTP client
- Easy to cache separately

**Cons:**
- URLs change between versions
- Looks "ugly" to some people

**Example:**
```
# OpenAI does this
POST https://api.openai.com/v1/chat/completions
```

**Implementation:**
```javascript
// Express.js example
app.use('/v1', v1Routes);
app.use('/v2', v2Routes);

// v1Routes
router.get('/users', (req, res) => {
  // Old version logic
  res.json({ users: [...] });
});

// v2Routes  
router.get('/users', (req, res) => {
  // New version logic with breaking changes
  res.json({ data: [...], meta: {...} });
});
```

### Strategy 2: Header Versioning

Include version in request header:

```
GET /users
Accept: application/vnd.example.v2+json
```

**Pros:**
- URLs stay clean
- Follows "proper" REST principles

**Cons:**
- Harder to test (need to set headers)
- Harder to cache
- More confusing for users
- Harder to debug

**Example:**
```
# Stripe does this
curl https://api.stripe.com/v1/charges \
  -H "Stripe-Version: 2024-12-18"
```

**For solo/small teams:** Stick with URL versioning. It's simpler.

### Strategy 3: Query Parameter Versioning

```
GET /users?version=2
```

**Don't use this.** It's the worst of both worlds - ugly URLs AND confusing caching.

## Migration Timeline

When you do version, here's a realistic timeline:

### Month 0: Launch New Version
```
✓ v2 endpoints live alongside v1
✓ Documentation updated with v2 examples
✓ Deprecation notice added to v1 docs
✓ Blog post announcing v2
```

### Month 1-3: Active Migration
```
✓ Email users about v2
✓ Add deprecation warning header to v1 responses:
  Warning: 199 - "API v1 is deprecated. Migrate to v2 by [date]"
✓ Track usage metrics (who's still on v1?)
✓ Provide migration guide with examples
```

### Month 6: Final Warning
```
✓ More aggressive notifications
✓ Personal outreach to high-volume v1 users
✓ Set firm sunset date (e.g., +6 months)
```

### Month 12: Sunset v1
```
✓ Start returning errors from v1
✓ Provide migration support for stragglers
✓ Keep v1 code around for emergency rollback
```

**Reality check:** Even with all this, when you finally sunset v1, you'll still get angry users. That's just how it is.

## How to Minimize Versioning

### Additive Changes Only

Always try to make changes additive:

```javascript
// ❌ Breaking change
// v1
{ "user_name": "John" }

// v2
{ "username": "John" }

// ✅ Additive change  
// v1
{ "user_name": "John" }

// v1.1 (same endpoint!)
{ 
  "user_name": "John",
  "username": "John"  // New field, old field still works
}
```

After several months, when everyone has migrated to `username`, you can quietly stop including `user_name`.

### Deprecation Without Breaking

Use headers to signal deprecation:

```
HTTP/1.1 200 OK
Deprecation: true
Sunset: Sat, 31 Dec 2025 23:59:59 GMT
Link: <https://api.example.com/v2/users>; rel="successor-version"

{
  "user_name": "John"  // Still works, but deprecated
}
```

This gives users advance warning without breaking their code.

### Feature Flags for Gradual Rollout

Instead of versioning the entire API, version individual features:

```
POST /users?new_validation=true
```

Or use account-level feature flags:

```javascript
if (account.features.includes('new_user_validation')) {
  // Use new validation logic
} else {
  // Use old validation logic  
}
```

This lets you migrate users gradually without API versioning.

## Version Naming

### Semantic Versioning (v1, v2, v3)

**Use this.** Simple, clear, no confusion.

```
/v1/users
/v2/users
/v3/users
```

### Date-Based Versioning

```
/2024-12-01/users
/2025-01-15/users
```

**Don't use this** unless you're Stripe. It's confusing and doesn't convey breaking changes clearly.

### Year-Based Versioning

```
/2024/users
/2025/users
```

**Only if** you release major versions annually. Otherwise confusing.

## Implementation Tips

### Share Code Between Versions

Don't duplicate your entire codebase. Use a translation layer:

```javascript
// Shared business logic
function getUser(id) {
  return db.users.findById(id);
}

// v1 serializer
function serializeUserV1(user) {
  return {
    user_name: user.name,
    email: user.email
  };
}

// v2 serializer
function serializeUserV2(user) {
  return {
    username: user.name,
    email: user.email,
    created_at: user.createdAt
  };
}

// v1 endpoint
app.get('/v1/users/:id', async (req, res) => {
  const user = await getUser(req.params.id);
  res.json(serializeUserV1(user));
});

// v2 endpoint
app.get('/v2/users/:id', async (req, res) => {
  const user = await getUser(req.params.id);
  res.json(serializeUserV2(user));
});
```

### Test Both Versions

Your test suite should cover all active versions:

```javascript
describe('GET /users/:id', () => {
  it('v1 returns user_name field', async () => {
    const res = await request(app).get('/v1/users/123');
    expect(res.body).toHaveProperty('user_name');
  });

  it('v2 returns username field', async () => {
    const res = await request(app).get('/v2/users/123');
    expect(res.body).toHaveProperty('username');
  });
});
```

### Monitor Version Usage

Track which versions are being used:

```javascript
app.use((req, res, next) => {
  const version = req.path.split('/')[1]; // e.g., 'v1'
  metrics.increment(`api.version.${version}.requests`);
  next();
});
```

This tells you when it's safe to sunset old versions.

## The Nuclear Option: Hard Cutover

If you're a solo developer with very few users, you can sometimes just make the breaking change and notify everyone:

```
Subject: Breaking API Change on Jan 1, 2026

Hi,

On January 1st, we're making a breaking change to the /users endpoint.

Old format:
{ "user_name": "John" }

New format:
{ "username": "John" }

Please update your code before Jan 1st.

Sorry for the inconvenience,
[Your name]
```

**Only do this if:**
- You have fewer than 10 API consumers
- You can personally notify each one
- The change is absolutely necessary
- You're willing to help them migrate

## Summary

- **Avoid versioning** - it's expensive and annoying
- **Make additive changes** instead of breaking changes
- **Use URL versioning** (`/v1/`, `/v2/`) if you must version
- **Plan 6-12 months** for migration
- **Share code** between versions with translation layers
- **Only hard cutover** if you have very few users

Remember: The best version is no version. Focus on getting the API right the first time.
