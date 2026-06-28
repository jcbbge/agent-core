# SolidStart Data Loading Reference

Complete guide to data fetching in SolidStart using `query`, `createAsync`, and preloading.

## Table of Contents

- [Overview](#overview)
- [query Function](#query-function)
- [createAsync Primitive](#createasync-primitive)
- [Preloading](#preloading)
- [Caching Behavior](#caching-behavior)
- [Error Handling](#error-handling)
- [Advanced Patterns](#advanced-patterns)

## Overview

SolidStart's data loading system consists of three main pieces:

1. **`query`** - Wraps async functions with intelligent caching
2. **`createAsync`** - Reactive primitive for consuming queries
3. **`preload`** - Loads data before route rendering

**Note**: `cache` function is deprecated - use `query` instead.

## query Function

Creates cached, deduplicated data fetching functions.

### Basic usage

```tsx
import { query } from "@solidjs/router";

const getPostsQuery = query(async () => {
  const response = await fetch("https://api.example.com/posts");
  return response.json();
}, "posts");
```

### Type signature

```tsx
function query<T extends (...args: any) => any>(
  fn: T,
  name: string
): CachedFunction<T>;
```

**Parameters:**
- `fn` - Async function with JSON-serializable arguments
- `name` - Unique string namespace for cache keys

### With parameters

```tsx
const getPostQuery = query(async (id: string) => {
  const response = await fetch(`https://api.example.com/posts/${id}`);
  return response.json();
}, "post");

// Usage
const post = getPostQuery("123");
```

### With server functions

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

### With options (caching)

```tsx
const getDataQuery = query(
  async () => {
    "use server";
    return await db.data.findMany();
  },
  "data",
  {
    ttl: 1000 * 60 * 5, // 5 minutes cache
    staleWhileRevalidate: 1000 * 60 * 10 // 10 minutes SWR
  }
);
```

## createAsync Primitive

Reactive primitive for consuming query data.

### Basic usage

```tsx
import { createAsync } from "@solidjs/router";
import { Suspense } from "solid-js";

export default function PostList() {
  const posts = createAsync(() => getPostsQuery());
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <For each={posts()}>{(post) => <div>{post.title}</div>}</For>
    </Suspense>
  );
}
```

### With parameters

```tsx
import { useParams } from "@solidjs/router";

export default function PostPage() {
  const params = useParams();
  const post = createAsync(() => getPostQuery(params.id));
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <h1>{post()?.title}</h1>
      <p>{post()?.content}</p>
    </Suspense>
  );
}
```

### Options

```tsx
const data = createAsync(
  () => getDataQuery(),
  {
    name: "myData",           // Debug name
    deferStream: false,       // Wait before flushing stream
    initialValue: [],         // Initial value
    ssrLoadFrom: "server"     // "server" or "initial"
  }
);
```

## Preloading

Load data before route renders for instant display.

### Basic preload

```tsx
import { type RouteDefinition } from "@solidjs/router";

export const route = {
  preload: () => getPostsQuery(),
} satisfies RouteDefinition;

export default function PostList() {
  const posts = createAsync(() => getPostsQuery());
  // Data already loaded, renders immediately
  return <For each={posts()}>{(post) => <div>{post.title}</div>}</For>;
}
```

### With route parameters

```tsx
export const route = {
  preload: ({ params }) => getPostQuery(params.id),
} satisfies RouteDefinition;

export default function PostPage() {
  const params = useParams();
  const post = createAsync(() => getPostQuery(params.id));
  return <div>{post()?.title}</div>;
}
```

### Multiple queries

```tsx
export const route = {
  preload: ({ params }) => {
    // Preload multiple queries in parallel
    getPostQuery(params.id);
    getCommentsQuery(params.id);
    getUserQuery(params.authorId);
  },
} satisfies RouteDefinition;
```

## Caching Behavior

Query automatically prevents redundant fetches:

### 1. Preload window (5 seconds)

Data preloaded for a route is reused within 5 seconds:

```tsx
// User hovers link → preload triggered
<A href="/posts/123" onMouseEnter={() => getPostQuery("123")}>Post</A>

// User clicks within 5s → uses cached data
```

### 2. Active subscriptions

Components actively using query data get cached results:

```tsx
// Both components share the same cached data
function Component1() {
  const posts = createAsync(() => getPostsQuery());
  // ...
}

function Component2() {
  const posts = createAsync(() => getPostsQuery());
  // Uses same data, no refetch
}
```

### 3. Browser navigation

Back/forward navigation uses cached data:

```tsx
// Navigate to /posts → fetch data
// Navigate to /about
// Back to /posts → uses cache
```

### 4. Server-side deduplication

Multiple calls in SSR reuse same value:

```tsx
// Only makes one database call
async function getServerData() {
  "use server";
  const users = await getUsersQuery();
  const posts = await getPostsQuery();
  const moreUsers = await getUsersQuery(); // Uses cache
  return { users, posts };
}
```

### 5. Client hydration

SSR data is immediately available on client:

```tsx
// Server renders with data
// Client hydrates with same data, no refetch
```

## Error Handling

### With ErrorBoundary

```tsx
import { ErrorBoundary, Suspense } from "solid-js";

export default function PostList() {
  const posts = createAsync(() => getPostsQuery());
  
  return (
    <ErrorBoundary fallback={<div>Failed to load posts</div>}>
      <Suspense fallback={<div>Loading...</div>}>
        <For each={posts()}>{(post) => <div>{post.title}</div>}</For>
      </Suspense>
    </ErrorBoundary>
  );
}
```

### Throwing errors from queries

```tsx
const getPostQuery = query(async (id: string) => {
  const response = await fetch(`https://api.example.com/posts/${id}`);
  
  if (!response.ok) {
    throw new Error(`Failed to load post: ${response.statusText}`);
  }
  
  return response.json();
}, "post");
```

### Returning error states

```tsx
const getPostQuery = query(async (id: string) => {
  try {
    const response = await fetch(`https://api.example.com/posts/${id}`);
    if (!response.ok) {
      return { ok: false, error: "Failed to load post" };
    }
    const data = await response.json();
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: "Network error" };
  }
}, "post");

// Usage
export default function PostPage() {
  const params = useParams();
  const result = createAsync(() => getPostQuery(params.id));
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Show 
        when={result()?.ok}
        fallback={<div>Error: {result()?.error}</div>}
      >
        <div>{result()?.data.title}</div>
      </Show>
    </Suspense>
  );
}
```

## Advanced Patterns

### Dependent queries

```tsx
export default function UserPosts() {
  const params = useParams();
  const user = createAsync(() => getUserQuery(params.id));
  const posts = createAsync(() => {
    const u = user();
    if (!u) return [];
    return getPostsByAuthorQuery(u.id);
  });
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <h1>{user()?.name}'s Posts</h1>
      <For each={posts()}>{(post) => <div>{post.title}</div>}</For>
    </Suspense>
  );
}
```

### Parallel queries

```tsx
export default function Dashboard() {
  const users = createAsync(() => getUsersQuery());
  const posts = createAsync(() => getPostsQuery());
  const stats = createAsync(() => getStatsQuery());
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div>Users: {users()?.length}</div>
      <div>Posts: {posts()?.length}</div>
      <div>Views: {stats()?.views}</div>
    </Suspense>
  );
}
```

### Pagination

```tsx
const getPostsQuery = query(
  async (page: number = 1, limit: number = 10) => {
    "use server";
    const offset = (page - 1) * limit;
    return await db.posts.findMany({ 
      skip: offset, 
      take: limit 
    });
  }, 
  "posts"
);

export default function PostList() {
  const [page, setPage] = createSignal(1);
  const posts = createAsync(() => getPostsQuery(page()));
  
  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <For each={posts()}>{(post) => <div>{post.title}</div>}</For>
      </Suspense>
      <button onClick={() => setPage(p => p - 1)}>Previous</button>
      <button onClick={() => setPage(p => p + 1)}>Next</button>
    </div>
  );
}
```

### Infinite scroll

```tsx
const getPostsPageQuery = query(
  async (cursor?: string) => {
    "use server";
    const result = await db.posts.findMany({
      take: 20,
      cursor: cursor ? { id: cursor } : undefined,
    });
    
    return {
      items: result,
      nextCursor: result[result.length - 1]?.id
    };
  },
  "postsPage"
);

export default function InfinitePosts() {
  const [pages, setPages] = createSignal<string[]>([]);
  
  const loadMore = async () => {
    const lastCursor = pages()[pages().length - 1];
    const result = await getPostsPageQuery(lastCursor);
    if (result.nextCursor) {
      setPages(p => [...p, result.nextCursor]);
    }
  };
  
  return (
    <div>
      <For each={pages()}>
        {(cursor) => {
          const page = createAsync(() => getPostsPageQuery(cursor));
          return (
            <Suspense fallback={<div>Loading...</div>}>
              <For each={page()?.items}>
                {(post) => <div>{post.title}</div>}
              </For>
            </Suspense>
          );
        }}
      </For>
      <button onClick={loadMore}>Load More</button>
    </div>
  );
}
```

### Client-only fetching

For data that should only fetch on client, use `createResource`:

```tsx
import { createResource, Suspense } from "solid-js";

export default function ClientOnlyData() {
  const [data] = createResource(async () => {
    const response = await fetch("https://api.example.com/client-only");
    return response.json();
  });
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div>{data()?.value}</div>
    </Suspense>
  );
}
```

### Integration with TanStack Query

For advanced features like background refetching:

```tsx
import { QueryClient, QueryClientProvider, createQuery } from "@tanstack/solid-query";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PostList />
    </QueryClientProvider>
  );
}

function PostList() {
  const posts = createQuery(() => ({
    queryKey: ["posts"],
    queryFn: async () => {
      const response = await fetch("https://api.example.com/posts");
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 // Refetch every minute
  }));
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <For each={posts.data}>{(post) => <div>{post.title}</div>}</For>
    </Suspense>
  );
}
```

## Migration from cache

If using deprecated `cache` function:

### Before (cache)

```tsx
const getUsers = cache(async () => {
  return await fetch("/api/users").then(r => r.json());
}, "users");
```

### After (query)

```tsx
const getUsersQuery = query(async () => {
  return await fetch("/api/users").then(r => r.json());
}, "users");
```

Same API, just renamed. All caching behavior is identical.

## Best Practices

1. **Use `query` for all data fetching** - Don't use `cache` (deprecated)
2. **Preload in route configuration** - Improves perceived performance
3. **Wrap in Suspense** - Always provide loading fallbacks
4. **Use ErrorBoundary** - Handle errors gracefully
5. **Server functions for sensitive data** - Database access, API keys
6. **Return structured errors** - Better than throwing for form validation
7. **Use TanStack Query for advanced features** - Background refetch, mutations
8. **Keep query names unique** - Prevents cache collisions
