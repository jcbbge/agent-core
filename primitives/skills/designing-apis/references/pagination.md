# Pagination Guide

How to handle large datasets in your API responses.

## The Problem

You can't return millions of records in a single API response. You'll run out of memory, the request will timeout, and even if it worked, the client couldn't process it.

Solution: **Pagination** - split large result sets into smaller "pages".

## When to Paginate

**Always paginate** endpoints that return collections:

```
GET /users
GET /posts
GET /orders
GET /comments
```

Even if you only have 10 records today, you might have 10,000 tomorrow. Build pagination from day one.

**Don't paginate** single-resource endpoints:

```
GET /users/:id      # Returns one user
GET /posts/:id      # Returns one post
```

## Two Pagination Strategies

### Strategy 1: Offset/Page-Based Pagination

**How it works:** Client specifies which "page" of results to retrieve.

```
GET /users?page=1&per_page=20    # Records 1-20
GET /users?page=2&per_page=20    # Records 21-40
GET /users?page=3&per_page=20    # Records 41-60
```

Or with offsets:

```
GET /users?offset=0&limit=20     # Records 1-20
GET /users?offset=20&limit=20    # Records 21-40
GET /users?offset=40&limit=20    # Records 41-60
```

**Database query:**
```sql
-- Page-based
SELECT * FROM users 
ORDER BY id 
LIMIT 20 OFFSET 40;  -- page 3 (40 = (3-1) * 20)

-- Offset-based (same thing)
SELECT * FROM users
ORDER BY id
LIMIT 20 OFFSET 40;
```

**When to use:**
- Small to medium datasets (< 10,000 records)
- Data that doesn't change frequently
- When users need to jump to specific pages
- Admin panels, dashboards

**Pros:**
- Simple to understand
- Easy to implement
- Users can jump to any page
- Easy to show total count

**Cons:**
- **Performance degrades** with high offsets (database has to count through all skipped records)
- Inconsistent results if data changes between requests
- Not suitable for large datasets

**Example implementation:**

```javascript
// Express.js
app.get('/users', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const perPage = parseInt(req.query.per_page) || 20;
  const offset = (page - 1) * perPage;

  const [users, total] = await Promise.all([
    db.users.findAll({
      limit: perPage,
      offset: offset,
      order: [['id', 'ASC']]
    }),
    db.users.count()
  ]);

  res.json({
    data: users,
    pagination: {
      page: page,
      per_page: perPage,
      total: total,
      total_pages: Math.ceil(total / perPage),
      next_page: page < Math.ceil(total / perPage) ? page + 1 : null
    }
  });
});
```

### Strategy 2: Cursor-Based Pagination

**How it works:** Client provides a "cursor" (pointer to last seen record), and you return the next batch.

```
GET /users?limit=20                    # First page
GET /users?cursor=abc123&limit=20      # Next page (cursor from previous response)
GET /users?cursor=def456&limit=20      # Next page
```

**Database query:**
```sql
-- First request (no cursor)
SELECT * FROM users
ORDER BY id
LIMIT 20;

-- Subsequent request (with cursor)
SELECT * FROM users
WHERE id > 12345  -- cursor is the last ID from previous page
ORDER BY id
LIMIT 20;
```

**When to use:**
- Large datasets (> 10,000 records)
- Real-time data (social feeds, activity streams)
- When you need consistent pagination despite data changes
- **Default choice if unsure** (changing from offset to cursor later is painful)

**Pros:**
- **Consistent performance** regardless of dataset size
- Handles data changes gracefully
- No "missing" or "duplicate" records
- Scales to millions of records

**Cons:**
- Can't jump to arbitrary pages
- Can't show total count easily
- Slightly more complex to implement
- Cursors can be opaque to users

**Example implementation:**

```javascript
// Express.js
app.get('/users', async (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  const cursor = req.query.cursor;

  const query = {
    limit: limit + 1,  // Fetch one extra to check if there's more
    order: [['id', 'ASC']]
  };

  if (cursor) {
    // Decode cursor (could be base64-encoded JSON with id + timestamp)
    const cursorId = parseInt(Buffer.from(cursor, 'base64').toString());
    query.where = {
      id: { $gt: cursorId }
    };
  }

  const users = await db.users.findAll(query);
  
  const hasMore = users.length > limit;
  const results = hasMore ? users.slice(0, -1) : users;
  
  const nextCursor = hasMore 
    ? Buffer.from(String(results[results.length - 1].id)).toString('base64')
    : null;

  res.json({
    data: results,
    pagination: {
      next_cursor: nextCursor,
      has_more: hasMore
    }
  });
});
```

## Cursor Implementation Details

### What Should the Cursor Be?

**Option 1: Just the ID (simple)**
```javascript
cursor = lastRecord.id.toString()
```

Good for: Most use cases. Simple and works well.

**Option 2: Base64-encoded ID (opaque)**
```javascript
cursor = Buffer.from(lastRecord.id.toString()).toString('base64')
```

Good for: Hiding implementation details. Prevents users from "guessing" cursors.

**Option 3: Encrypted compound value (complex)**
```javascript
cursor = encrypt(JSON.stringify({
  id: lastRecord.id,
  timestamp: lastRecord.createdAt
}))
```

Good for: Complex sorting (e.g., by timestamp AND id). Prevents manipulation.

**For solo/small teams:** Start with Option 2 (base64-encoded ID). Simple and opaque.

### Handling Different Sort Orders

If you're sorting by something other than ID:

```sql
-- Sorting by created_at, then id for consistency
SELECT * FROM users
WHERE (created_at, id) > (cursor_timestamp, cursor_id)
ORDER BY created_at, id
LIMIT 20;
```

Your cursor needs both values:

```javascript
const cursor = Buffer.from(JSON.stringify({
  created_at: lastRecord.createdAt,
  id: lastRecord.id
})).toString('base64');
```

## Response Format

### Offset/Page-Based Response

```json
{
  "data": [
    { "id": 1, "name": "User 1" },
    { "id": 2, "name": "User 2" }
  ],
  "pagination": {
    "page": 2,
    "per_page": 20,
    "total": 150,
    "total_pages": 8,
    "next_page": 3,
    "prev_page": 1
  }
}
```

Or include next/prev URLs:

```json
{
  "data": [...],
  "pagination": {
    "next": "/users?page=3&per_page=20",
    "prev": "/users?page=1&per_page=20"
  }
}
```

### Cursor-Based Response

```json
{
  "data": [
    { "id": 21, "name": "User 21" },
    { "id": 22, "name": "User 22" }
  ],
  "pagination": {
    "next_cursor": "eyJpZCI6NDAsInRpbWVzdGFtcCI6IjIwMjUtMTItMjYifQ==",
    "has_more": true
  }
}
```

Or include the next URL:

```json
{
  "data": [...],
  "pagination": {
    "next": "/users?cursor=eyJpZCI6NDAsInRpbWVzdGFtcCI6IjIwMjUtMTItMjYifQ==&limit=20"
  }
}
```

## Default Limits

Always set a maximum page size to prevent abuse:

```javascript
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const limit = Math.min(
  parseInt(req.query.limit) || DEFAULT_LIMIT,
  MAX_LIMIT
);
```

This prevents users from doing:

```
GET /users?limit=999999  # Would kill your database
```

## Edge Cases

### Empty Results

```json
{
  "data": [],
  "pagination": {
    "next_cursor": null,
    "has_more": false
  }
}
```

### Last Page (Offset-Based)

```json
{
  "data": [...],
  "pagination": {
    "page": 8,
    "per_page": 20,
    "total": 150,
    "total_pages": 8,
    "next_page": null,
    "prev_page": 7
  }
}
```

### Invalid Cursor

Return 400 with helpful error:

```json
{
  "error": {
    "message": "Invalid cursor",
    "code": "INVALID_CURSOR"
  }
}
```

## Quick Decision Chart

```
How many records might you have?
├─ < 10,000 records
│  └─ Use offset/page-based (simpler)
├─ > 10,000 records  
│  └─ Use cursor-based (scales better)
└─ Not sure?
   └─ Use cursor-based (changing later is painful)

Do users need to jump to page 57?
├─ Yes → Offset/page-based
└─ No → Cursor-based

Is this a real-time feed (Twitter, Instagram)?
└─ Yes → Cursor-based (handles changes better)

Is this an admin dashboard?
└─ Probably offset/page-based (easier UX)
```

## Testing Pagination

```javascript
describe('GET /users pagination', () => {
  it('returns first page without cursor', async () => {
    const res = await request(app).get('/users?limit=5');
    expect(res.body.data).toHaveLength(5);
    expect(res.body.pagination.has_more).toBe(true);
  });

  it('returns next page with cursor', async () => {
    const firstPage = await request(app).get('/users?limit=5');
    const cursor = firstPage.body.pagination.next_cursor;
    
    const secondPage = await request(app)
      .get(`/users?limit=5&cursor=${cursor}`);
    
    expect(secondPage.body.data[0].id).toBeGreaterThan(
      firstPage.body.data[4].id
    );
  });

  it('enforces max limit', async () => {
    const res = await request(app).get('/users?limit=9999');
    expect(res.body.data.length).toBeLessThanOrEqual(100);
  });
});
```

## Summary

**Offset/Page-based:**
- Simple, familiar pattern
- Works for small datasets (< 10k records)
- Good for admin UIs

**Cursor-based:**
- Scales to millions of records
- Consistent performance
- Better for real-time feeds
- **Use this if unsure**

**Both:**
- Always paginate collections
- Set max limits (e.g., 100)
- Include next page/cursor in response
- Handle empty results gracefully

When in doubt, use cursor-based pagination. It's harder to learn but scales infinitely and you won't regret it later.
