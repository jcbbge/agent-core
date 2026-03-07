---
name: designing-apis
description: Design REST APIs that are simple, stable, and scalable. Use when building new API endpoints, reviewing API designs, or making changes to existing APIs. Covers versioning, authentication, pagination, idempotency, and rate limiting for solo developers and small teams.
license: MIT
metadata:
  author: jrg | claude
  version: "1.0"
  tags: api, rest, backend, web-development
---

# Designing APIs

A practical guide for solo developers and small teams building REST APIs that are simple, stable, and scalable.

## When to use this skill

Use this skill when you need to:
- Design a new API endpoint
- Review or refactor existing API designs
- Make changes to public or customer-facing APIs
- Plan authentication, pagination, or rate limiting
- Ensure API stability and backward compatibility

## Golden Rules

### 1. WE DO NOT BREAK USERSPACE

**The most important rule in API design:** Never make changes that break existing consumers.

**Breaking changes** (forbidden):
- Removing fields from responses
- Changing field types (e.g., string → number)
- Changing field structure (e.g., moving `user.email` to `user.contact.email`)
- Removing endpoints
- Changing endpoint behavior

**Safe changes** (allowed):
- Adding new fields to responses
- Adding new endpoints
- Adding optional parameters
- Making required parameters optional

**Why this matters:** Every breaking change forces your consumers to update their code. Each forced update makes them consider switching to a more stable alternative.

### 2. Good APIs are Boring

Familiarity beats cleverness. Your API should be so predictable that developers know how to use it before reading documentation. Use REST conventions everyone already knows.

### 3. The Product Matters More Than the API

An elegant API won't save a product nobody wants. But a terrible API won't stop people from using a valuable product (see: Facebook, Jira). Focus on building value first.

### 4. Design for Non-Engineers

Many API consumers are not professional developers. They might be:
- Product managers automating workflows
- Data analysts pulling reports
- Hobbyists building side projects

Keep your API simple enough for these users.

## API Design Workflow

Use this checklist when designing a new endpoint:

```
New Endpoint Checklist:
- [ ] Define the resource (what does this endpoint do?)
- [ ] Choose HTTP method (GET, POST, PUT, DELETE)
- [ ] Design URL structure (RESTful naming)
- [ ] Plan request parameters (required vs optional)
- [ ] Plan response structure (what fields to return)
- [ ] Consider pagination (will this return many records?)
- [ ] Add authentication (who can access this?)
- [ ] Plan rate limiting (how often can this be called?)
- [ ] Add idempotency (if it takes action)
- [ ] Document error responses
- [ ] Write example requests/responses
```

## Quick Decision Trees

### When should I version my API?

**Only when absolutely necessary.** Versioning is a last resort.

Ask yourself:
1. Can I make this change additive instead? (90% of the time: yes)
2. Is the technical value high enough to justify breaking users? (Usually: no)
3. Can I deprecate gradually rather than breaking immediately? (Often: yes)

If you must version, see [references/versioning.md](references/versioning.md)

### What pagination should I use?

**Decision tree:**
- Dataset might exceed 10,000 records? → Use cursor-based pagination
- Dataset will stay small? → Offset/page-based is fine
- Not sure? → Use cursor-based (changing later is painful)

See [references/pagination.md](references/pagination.md) for implementation details.

### What authentication should I use?

**For solo/small team projects:**
- Start with simple API keys
- Add OAuth later if needed
- Make API keys long-lived and easy to generate

See [references/authentication.md](references/authentication.md)

### Do I need idempotency?

**Decision tree:**
- Read-only endpoint (GET)? → No
- Delete by ID? → No (ID serves as idempotency key)
- Creates/updates records? → Yes, make it optional
- Handles payments or critical data? → Yes, make it required

See [references/safety.md](references/safety.md)

## Common Patterns

### RESTful URL Structure

```
GET    /users           # List all users
GET    /users/:id       # Get specific user
POST   /users           # Create new user
PUT    /users/:id       # Update user (full replacement)
PATCH  /users/:id       # Update user (partial update)
DELETE /users/:id       # Delete user

# Nested resources
GET    /users/:id/posts          # Get user's posts
POST   /users/:id/posts          # Create post for user
DELETE /users/:id/posts/:post_id # Delete specific post
```

**Conventions:**
- Use plural nouns (`/users`, not `/user`)
- Use lowercase with hyphens for multi-word resources (`/blog-posts`)
- Keep URLs clean (no verbs like `/getUser` or `/createPost`)

### Request/Response Format

Use JSON for requests and responses:

```json
// POST /users
{
  "name": "Jane Doe",
  "email": "jane@example.com"
}

// Response (201 Created)
{
  "id": 123,
  "name": "Jane Doe",
  "email": "jane@example.com",
  "created_at": "2025-12-26T10:30:00Z"
}
```

**Best practices:**
- Use `snake_case` for field names (consistent with Ruby, Python)
- Or use `camelCase` (consistent with JavaScript) - pick one and stick with it
- Include timestamps in ISO 8601 format
- Return the created resource after POST
- Include resource ID in responses

### Error Responses

Use appropriate HTTP status codes:

```
200 OK              - Successful GET, PUT, PATCH
201 Created         - Successful POST
204 No Content      - Successful DELETE
400 Bad Request     - Invalid request format
401 Unauthorized    - Missing or invalid authentication
403 Forbidden       - Authenticated but not allowed
404 Not Found       - Resource doesn't exist
422 Unprocessable   - Validation failed
429 Too Many Requests - Rate limit exceeded
500 Server Error    - Something broke on your end
```

Return helpful error messages:

```json
// 422 Unprocessable Entity
{
  "error": {
    "message": "Validation failed",
    "details": {
      "email": "Email is already taken",
      "password": "Password must be at least 8 characters"
    }
  }
}
```

### Rate Limiting

Include rate limit headers in responses:

```
HTTP/1.1 200 OK
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 987
X-RateLimit-Reset: 1640000000
```

When limit exceeded:

```
HTTP/1.1 429 Too Many Requests
Retry-After: 3600

{
  "error": {
    "message": "Rate limit exceeded",
    "retry_after": 3600
  }
}
```

### Pagination Response

Include pagination metadata:

```json
{
  "data": [
    { "id": 1, "name": "User 1" },
    { "id": 2, "name": "User 2" }
  ],
  "pagination": {
    "total": 150,
    "per_page": 20,
    "current_page": 1,
    "total_pages": 8,
    "next_page": "/users?page=2"
  }
}
```

Or for cursor-based:

```json
{
  "data": [...],
  "pagination": {
    "next_cursor": "eyJpZCI6MjB9",
    "has_more": true
  }
}
```

## Advanced Topics

### Optional Fields

Make expensive operations opt-in:

```
GET /users/:id?include=subscription,posts
```

This lets you avoid expensive operations unless specifically requested.

### Handling Deletes

Two approaches:

**Hard delete:**
```
DELETE /users/:id  # Permanently removes user
```

**Soft delete:**
```
DELETE /users/:id  # Sets deleted_at timestamp
GET /users/:id     # Returns 404 for deleted users
GET /users/:id?include_deleted=true  # Can still retrieve if needed
```

For solo/small teams, hard deletes are usually fine. Use soft deletes when you need audit trails or might need to restore data.

### Internal vs External APIs

**External APIs** (customers, third parties):
- Follow all rules strictly
- Never break userspace
- Comprehensive documentation
- Version carefully

**Internal APIs** (your team only):
- Can make breaking changes (you control all consumers)
- Still use idempotency for critical operations
- Still rate limit (protect your infrastructure)
- Can be less formal

Even internal APIs benefit from good design - your future self will thank you.

## Common Anti-Patterns

**❌ Don't do this:**

```
GET /getUser?id=123          # Don't use verbs in URLs
POST /users/delete           # Don't use POST for deletes
GET /users?page=1000000      # Don't use offset pagination for large datasets
DELETE /users/deleteAll      # Don't allow mass destructive operations without safeguards
```

**✅ Do this instead:**

```
GET /users/123               # RESTful resource access
DELETE /users/123            # Proper HTTP method
GET /users?cursor=abc123     # Cursor-based pagination
POST /users/bulk-delete      # Explicit bulk operation with confirmation
```

## Quick Reference Links

- **Need to version your API?** See [references/versioning.md](references/versioning.md)
- **Implementing pagination?** See [references/pagination.md](references/pagination.md)
- **Setting up authentication?** See [references/authentication.md](references/authentication.md)
- **Need idempotency or rate limiting?** See [references/safety.md](references/safety.md)

## Testing Your API Design

Before shipping, ask yourself:

1. **Is it boring?** Can a developer figure it out without reading docs?
2. **Is it stable?** Have I avoided breaking changes?
3. **Is it simple?** Can a non-engineer use it with an API key?
4. **Will it scale?** Have I planned for growth (pagination, rate limits)?
5. **Is it safe?** Are critical operations idempotent and retriable?

If you answer "yes" to all five, you're good to ship.

## Remember

The best API is one that:
- Does what users need
- Doesn't break
- Doesn't require a PhD to understand
- Scales when you need it to

Keep it simple, keep it stable, and focus on shipping value.
