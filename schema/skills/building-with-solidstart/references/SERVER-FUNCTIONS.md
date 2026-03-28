# SolidStart Server Functions Reference

Complete guide to server functions and the `"use server"` directive.

## Table of Contents

- [Overview](#overview)
- [Function-Level Directive](#function-level-directive)
- [File-Level Directive](#file-level-directive)
- [Integration with Data APIs](#integration-with-data-apis)
- [Single-Flight Mutations](#single-flight-mutations)
- [Serialization](#serialization)
- [Security](#security)
- [Patterns](#patterns)

## Overview

The `"use server"` directive marks functions to run exclusively on the server. It transforms marked functions into RPC calls, executing server-side regardless of SSR configuration.

**Key characteristics:**
- Runs only on server, never on client
- Safe for database access and API keys
- Transparent client/server boundary
- Automatic serialization/deserialization
- Must be async or return a promise

## Function-Level Directive

Mark individual functions as server-only:

```tsx
const getUserById = async (id: string) => {
  "use server";
  return await db.users.findOne({ id });
};
```

### With type safety

```tsx
type User = {
  id: string;
  name: string;
  email: string;
};

const getUserById = async (id: string): Promise<User> => {
  "use server";
  return await db.users.findOne({ id });
};
```

### Inline usage

```tsx
export default function MyComponent() {
  const handleClick = async () => {
    const data = await (async () => {
      "use server";
      return await db.getSomeData();
    })();
    console.log(data);
  };
  
  return <button onClick={handleClick}>Get Data</button>;
}
```

## File-Level Directive

Mark entire file as server-only:

```tsx
"use server";

// All functions in this file are server-only
export async function getUsers() {
  return await db.users.findMany();
}

export async function createUser(data: UserData) {
  return await db.users.create(data);
}

export async function deleteUser(id: string) {
  return await db.users.delete({ id });
}
```

### File structure pattern

```
src/
└── lib/
    └── db/
        ├── users.ts      # "use server" at top
        ├── posts.ts      # "use server" at top
        └── comments.ts   # "use server" at top
```

## Integration with Data APIs

### With query

```tsx
import { query } from "@solidjs/router";

const getUsersQuery = query(async () => {
  "use server";
  return await db.users.findMany();
}, "users");

const getUserQuery = query(async (id: string) => {
  "use server";
  return await db.users.findOne({ id });
}, "user");
```

### With action

```tsx
import { action } from "@solidjs/router";

const createUserAction = action(async (formData: FormData) => {
  "use server";
  
  const name = formData.get("name")?.toString();
  const email = formData.get("email")?.toString();
  
  if (!name || !email) {
    return { ok: false, errors: { name: "Required", email: "Required" } };
  }
  
  const user = await db.users.create({ name, email });
  return { ok: true, user };
}, "createUser");
```

## Single-Flight Mutations

When an action throws a redirect, the redirected page's data is fetched in the same request:

```tsx
const createPostAction = action(async (formData: FormData) => {
  "use server";
  
  const title = formData.get("title")?.toString();
  const post = await db.posts.create({ title });
  
  // This triggers single-flight mutation
  // The /posts/:id route's data is fetched in same request
  throw redirect(`/posts/${post.id}`);
}, "createPost");
```

### Revalidation with redirect

```tsx
import { redirect, reload } from "@solidjs/router";

const updatePostAction = action(async (id: string, formData: FormData) => {
  "use server";
  
  const title = formData.get("title")?.toString();
  await db.posts.update({ id }, { title });
  
  // Revalidate specific queries
  throw reload({ revalidate: ["post"] });
  
  // Or redirect with revalidation
  throw redirect(`/posts/${id}`, { 
    revalidate: getPostQuery.keyFor(id) 
  });
}, "updatePost");
```

## Serialization

Server functions use Seroval for serialization, supporting:

### Primitives
```tsx
const getData = async () => {
  "use server";
  return {
    string: "hello",
    number: 42,
    boolean: true,
    null: null,
    undefined: undefined
  };
};
```

### Objects and Arrays
```tsx
const getData = async () => {
  "use server";
  return {
    users: [
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" }
    ],
    metadata: {
      total: 2,
      page: 1
    }
  };
};
```

### Special Types
```tsx
const getData = async () => {
  "use server";
  return {
    date: new Date(),
    regex: /test/g,
    map: new Map([["key", "value"]]),
    set: new Set([1, 2, 3]),
    error: new Error("Something went wrong"),
    bigint: 9007199254740991n,
    url: new URL("https://example.com"),
    // And more...
  };
};
```

### Unsupported Types
```tsx
// ❌ Functions cannot be serialized
const getData = async () => {
  "use server";
  return {
    callback: () => console.log("test") // Error!
  };
};

// ✅ Use separate server function instead
const doSomething = async () => {
  "use server";
  console.log("test");
};
```

## Security

### Environment variables

Safe to access server-only environment variables:

```tsx
const getApiData = async () => {
  "use server";
  
  const apiKey = process.env.API_KEY;
  const response = await fetch("https://api.example.com/data", {
    headers: { Authorization: `Bearer ${apiKey}` }
  });
  
  return response.json();
};
```

### Database access

Direct database access is safe:

```tsx
const getUsers = async () => {
  "use server";
  
  // Database credentials never exposed to client
  return await db.users.findMany({
    select: { id: true, name: true, email: true }
  });
};
```

### Authentication

```tsx
import { getSession } from "vinxi/http";

const getCurrentUser = async () => {
  "use server";
  
  const session = await getSession({
    password: process.env.SESSION_SECRET as string
  });
  
  if (!session.data.userId) {
    throw new Error("Not authenticated");
  }
  
  return await db.users.findOne({ id: session.data.userId });
};
```

### Input validation

Always validate inputs:

```tsx
const createUser = async (data: unknown) => {
  "use server";
  
  // Validate with Zod or similar
  const schema = z.object({
    name: z.string().min(1),
    email: z.string().email()
  });
  
  const validated = schema.parse(data);
  return await db.users.create(validated);
};
```

## Patterns

### Repository pattern

```tsx
"use server";

// users.repository.ts
export class UserRepository {
  static async findAll() {
    return await db.users.findMany();
  }
  
  static async findById(id: string) {
    return await db.users.findOne({ id });
  }
  
  static async create(data: CreateUserData) {
    return await db.users.create(data);
  }
  
  static async update(id: string, data: UpdateUserData) {
    return await db.users.update({ id }, data);
  }
  
  static async delete(id: string) {
    return await db.users.delete({ id });
  }
}
```

### Service layer

```tsx
"use server";

// users.service.ts
import { UserRepository } from "./users.repository";

export class UserService {
  static async getUserWithPosts(id: string) {
    const user = await UserRepository.findById(id);
    const posts = await db.posts.findMany({ authorId: id });
    return { ...user, posts };
  }
  
  static async registerUser(data: RegisterData) {
    // Hash password
    const hashed = await bcrypt.hash(data.password, 10);
    
    // Create user
    const user = await UserRepository.create({
      ...data,
      password: hashed
    });
    
    // Send welcome email
    await emailService.sendWelcome(user.email);
    
    return user;
  }
}
```

### Query builders

```tsx
"use server";

export const getUsersQuery = query(
  async (filters?: {
    role?: string;
    status?: string;
    search?: string;
  }) => {
    "use server";
    
    let query = db.users.findMany();
    
    if (filters?.role) {
      query = query.where({ role: filters.role });
    }
    
    if (filters?.status) {
      query = query.where({ status: filters.status });
    }
    
    if (filters?.search) {
      query = query.where({
        OR: [
          { name: { contains: filters.search } },
          { email: { contains: filters.search } }
        ]
      });
    }
    
    return await query;
  },
  "users"
);
```

### Error handling

```tsx
const createPost = async (data: CreatePostData) => {
  "use server";
  
  try {
    const post = await db.posts.create(data);
    return { ok: true, post };
  } catch (error) {
    console.error("Failed to create post:", error);
    
    if (error instanceof ValidationError) {
      return { ok: false, errors: error.errors };
    }
    
    if (error instanceof DatabaseError) {
      return { ok: false, error: "Database error" };
    }
    
    return { ok: false, error: "Unknown error" };
  }
};
```

### Pagination

```tsx
const getPaginatedUsers = async (
  page: number = 1,
  limit: number = 10
) => {
  "use server";
  
  const offset = (page - 1) * limit;
  
  const [users, total] = await Promise.all([
    db.users.findMany({ skip: offset, take: limit }),
    db.users.count()
  ]);
  
  return {
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: offset + limit < total,
      hasPrev: page > 1
    }
  };
};
```

### Batch operations

```tsx
const batchCreateUsers = async (users: CreateUserData[]) => {
  "use server";
  
  const results = await Promise.allSettled(
    users.map(user => db.users.create(user))
  );
  
  return {
    successful: results.filter(r => r.status === "fulfilled").length,
    failed: results.filter(r => r.status === "rejected").length,
    results
  };
};
```

### Transactions

```tsx
const transferFunds = async (
  fromId: string,
  toId: string,
  amount: number
) => {
  "use server";
  
  return await db.$transaction(async (tx) => {
    // Deduct from sender
    const from = await tx.accounts.update({
      where: { id: fromId },
      data: { balance: { decrement: amount } }
    });
    
    // Add to receiver
    const to = await tx.accounts.update({
      where: { id: toId },
      data: { balance: { increment: amount } }
    });
    
    // Create transaction record
    await tx.transactions.create({
      data: { fromId, toId, amount }
    });
    
    return { from, to };
  });
};
```

### Caching strategies

```tsx
// In-memory cache
const cache = new Map();

const getCachedData = async (key: string) => {
  "use server";
  
  if (cache.has(key)) {
    return cache.get(key);
  }
  
  const data = await db.data.findOne({ key });
  cache.set(key, data);
  
  // Clear after 5 minutes
  setTimeout(() => cache.delete(key), 5 * 60 * 1000);
  
  return data;
};
```

### Rate limiting

```tsx
import { rateLimit } from "~/lib/rate-limit";

const createPost = async (userId: string, data: CreatePostData) => {
  "use server";
  
  // Check rate limit
  const allowed = await rateLimit.check(userId, {
    max: 10,
    window: "1h"
  });
  
  if (!allowed) {
    throw new Error("Rate limit exceeded");
  }
  
  return await db.posts.create({ ...data, authorId: userId });
};
```

## Best Practices

1. **Always mark as async** - Server functions must return promises
2. **Use file-level directive** for utility modules
3. **Validate all inputs** - Never trust client data
4. **Return structured errors** - Better than throwing for validation
5. **Use environment variables** for secrets
6. **Implement proper error handling** - Try/catch with specific error types
7. **Consider transactions** - For multi-step database operations
8. **Cache when appropriate** - But be mindful of memory usage
9. **Rate limit sensitive operations** - Prevent abuse
10. **Type everything** - TypeScript provides safety across boundaries

## Meta Information

Get stable function identifiers for parallel processes:

```tsx
import { getServerFunctionMeta } from "@solidjs/start";

const myServerFunction = async () => {
  "use server";
  return "data";
};

const meta = getServerFunctionMeta(myServerFunction);
console.log(meta); // Stable identifier
```

Useful for multi-worker setups or distributed systems.
