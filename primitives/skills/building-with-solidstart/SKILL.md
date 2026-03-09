---
name: building-with-solidstart
description: Build full-stack applications with SolidStart, the meta-framework for SolidJS. Use when building SolidStart apps, implementing file-based routing, server functions, SSR/SSG, API routes, data fetching with createAsync, forms/actions, or deploying to Cloudflare/Vercel/Netlify. Covers SolidStart-specific features; reference building-with-solidjs skill for core reactivity concepts.
metadata:
  author: JR
  version: "1.0.0"
  tags: solidstart, solidjs, meta-framework, ssr, full-stack, routing, server-functions
---

# Building with SolidStart

SolidStart is a meta-framework for SolidJS that enables full-stack applications with file-based routing, server-side rendering, and server functions.

## When to use this skill

Use when working with SolidStart applications, especially for:
- File-based routing configuration
- Server functions and server/client boundaries  
- Data fetching with `query` and `createAsync`
- Form handling and actions
- SSR, SSG, or streaming configurations
- API route creation
- Deployment to various platforms
- Performance optimization

**Note:** For SolidJS core reactivity (signals, effects, stores, components), reference the `building-with-solidjs` skill instead.

## Prerequisites

SolidStart builds on SolidJS fundamentals. Ensure you understand:
- Fine-grained reactivity (signals, effects, memos) → See `building-with-solidjs` skill
- Component patterns and JSX → See `building-with-solidjs` skill  
- Props handling and control flow → See `building-with-solidjs` skill

## Quick Start

### Create a new project

```bash
npm init solid@latest my-app
cd my-app
npm install
npm run dev
```

Choose a template when prompted (basic, with-tailwindcss, with-auth, etc.)

### Project structure

```
src/
├── routes/          # File-based routing
│   └── index.tsx    # Home page
├── entry-client.tsx # Client hydration
├── entry-server.tsx # Server rendering
└── app.tsx          # HTML root
```

## File-Based Routing

SolidStart uses file structure to define routes automatically.

### Basic routes

```
routes/index.tsx       → /
routes/about.tsx       → /about
routes/blog/index.tsx  → /blog
```

### Dynamic routes

Use `[param]` for dynamic segments:

```
routes/users/[id].tsx           → /users/:id
routes/blog/[category]/[id].tsx → /blog/:category/:id
```

Access params with `useParams()`:

```tsx
import { useParams } from "@solidjs/router";

export default function UserPage() {
  const params = useParams();
  return <div>User {params.id}</div>;
}
```

### Optional params

Use `[[param]]` for optional segments:

```
routes/users/[[id]].tsx  → matches /users and /users/123
```

### Catch-all routes

Use `[...param]` to match multiple segments:

```
routes/blog/[...post].tsx  → /blog/foo/bar/baz
```

### Nested layouts

Create a file matching the folder name for shared layouts:

```
routes/
├── blog.tsx          # Layout
└── blog/
    ├── post-1.tsx    # Uses blog.tsx layout
    └── post-2.tsx    # Uses blog.tsx layout
```

Layout receives children via props:

```tsx
import { RouteSectionProps } from "@solidjs/router";

export default function BlogLayout(props: RouteSectionProps) {
  return (
    <div>
      <nav>Blog Nav</nav>
      {props.children}
    </div>
  );
}
```

### Route groups

Use `(name)` for organization without URL impact:

```
routes/(marketing)/about.tsx    → /about
routes/(marketing)/contact.tsx  → /contact
```

**For complete routing patterns**, see [ROUTING.md](references/ROUTING.md)

## Server Functions

The `"use server"` directive creates functions that run exclusively on the server.

### Basic server function

```tsx
const getUser = async (id: string) => {
  "use server";
  // Safe to access database directly
  return await db.users.findOne({ id });
};
```

### With query for caching

```tsx
import { query } from "@solidjs/router";

const getUserQuery = query(async (id: string) => {
  "use server";
  return await db.users.findOne({ id });
}, "user");
```

### File-level directive

```tsx
"use server";
// All functions in this file are server-only

export async function getUsers() {
  return await db.users.findMany();
}

export async function createUser(data: UserData) {
  return await db.users.create(data);
}
```

**For server function patterns**, see [SERVER-FUNCTIONS.md](references/SERVER-FUNCTIONS.md)

## Data Fetching

SolidStart uses `query` + `createAsync` for data loading.

### Basic pattern

```tsx
import { query, createAsync } from "@solidjs/router";

// Define query (can be in separate file)
const getPostsQuery = query(async () => {
  const response = await fetch("https://api.example.com/posts");
  return response.json();
}, "posts");

// Use in component
export default function PostList() {
  const posts = createAsync(() => getPostsQuery());
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <For each={posts()}>{(post) => <div>{post.title}</div>}</For>
    </Suspense>
  );
}
```

### With preloading

```tsx
import { type RouteDefinition } from "@solidjs/router";

export const route = {
  preload: () => getPostsQuery(),
} satisfies RouteDefinition;
```

### With parameters

```tsx
const getPostQuery = query(async (id: string) => {
  "use server";
  return await db.posts.findOne({ id });
}, "post");

export const route = {
  preload: ({ params }) => getPostQuery(params.id),
} satisfies RouteDefinition;

export default function PostPage() {
  const params = useParams();
  const post = createAsync(() => getPostQuery(params.id));
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <h1>{post()?.title}</h1>
    </Suspense>
  );
}
```

**For complete data loading patterns**, see [DATA-LOADING.md](references/DATA-LOADING.md)

## Forms and Actions

Actions handle data mutations with automatic revalidation.

### Basic action

```tsx
import { action } from "@solidjs/router";

const createPostAction = action(async (formData: FormData) => {
  "use server";
  const title = formData.get("title")?.toString();
  await db.posts.create({ title });
}, "createPost");

export default function CreatePost() {
  return (
    <form action={createPostAction} method="post">
      <input name="title" />
      <button type="submit">Create</button>
    </form>
  );
}
```

### With submission state

```tsx
import { useSubmission } from "@solidjs/router";

export default function CreatePost() {
  const submission = useSubmission(createPostAction);
  
  return (
    <form action={createPostAction} method="post">
      <input name="title" />
      <button disabled={submission.pending}>
        {submission.pending ? "Creating..." : "Create"}
      </button>
    </form>
  );
}
```

### With additional arguments

```tsx
const updatePostAction = action(
  async (id: string, formData: FormData) => {
    "use server";
    const title = formData.get("title")?.toString();
    await db.posts.update({ id }, { title });
  },
  "updatePost"
);

export default function EditPost(props: { postId: string }) {
  return (
    <form action={updatePostAction.with(props.postId)} method="post">
      <input name="title" />
      <button type="submit">Update</button>
    </form>
  );
}
```

### Error handling

Always return structured objects, don't throw:

```tsx
const createPostAction = action(async (formData: FormData) => {
  "use server";
  const title = formData.get("title")?.toString();
  
  if (!title || title.length < 3) {
    return {
      ok: false,
      errors: { title: "Title must be at least 3 characters" }
    };
  }
  
  await db.posts.create({ title });
  return { ok: true };
}, "createPost");

export default function CreatePost() {
  const submission = useSubmission(createPostAction);
  
  const errors = () => {
    const result = submission.result;
    return result && !result.ok ? result.errors : undefined;
  };
  
  return (
    <form action={createPostAction} method="post">
      <input name="title" />
      <Show when={errors()?.title}>
        <p class="error">{errors()!.title}</p>
      </Show>
      <button type="submit">Create</button>
    </form>
  );
}
```

**For complete forms and actions patterns**, see [FORMS-ACTIONS.md](references/FORMS-ACTIONS.md)

## API Routes

Create serverless functions by exporting HTTP method handlers.

### Basic API route

```tsx
// routes/api/users/[id].ts
import type { APIEvent } from "@solidjs/start/server";

export async function GET({ params }: APIEvent) {
  const user = await db.users.findOne({ id: params.id });
  return user;
}

export async function DELETE({ params }: APIEvent) {
  await db.users.delete({ id: params.id });
  return new Response(null, { status: 204 });
}
```

### With request body

```tsx
export async function POST({ request }: APIEvent) {
  const body = await request.json();
  const user = await db.users.create(body);
  return user;
}
```

### Error handling

```tsx
export async function GET({ params }: APIEvent) {
  const user = await db.users.findOne({ id: params.id });
  
  if (!user) {
    return new Response("User not found", { status: 404 });
  }
  
  return user;
}
```

## SSR and Rendering Modes

Configure rendering in `entry-server.tsx`:

```tsx
import { createHandler, StartServer } from "@solidjs/start/server";

export default createHandler(
  () => <StartServer document={/* ... */} />,
  {
    mode: "stream" // or "sync" or "async"
  }
);
```

### Streaming SSR (default)

Best performance with progressive rendering:

```tsx
export default function App() {
  return (
    <div>
      <Header /> {/* Renders immediately */}
      
      <Suspense fallback={<div>Loading...</div>}>
        <SlowContent /> {/* Streams when ready */}
      </Suspense>
    </div>
  );
}
```

## Environment Variables

Access in server functions:

```tsx
const api = async () => {
  "use server";
  const key = process.env.API_KEY;
  return fetch(`https://api.example.com?key=${key}`);
};
```

## Configuration

Configure in `app.config.ts`:

```tsx
import { defineConfig } from "@solidjs/start/config";

export default defineConfig({
  ssr: true,
  server: {
    preset: "cloudflare-pages" // or "vercel", "netlify", etc.
  }
});
```

## Deployment

### Cloudflare Pages

```bash
npm create cloudflare@latest my-app --framework=solid
```

Or configure manually:

```tsx
// app.config.ts
export default defineConfig({
  server: {
    preset: "cloudflare-pages",
    rollupConfig: {
      external: ["node:async_hooks"]
    }
  }
});
```

### Vercel

Zero-config deployment:

```bash
vercel
```

### Netlify

Configure build settings:
- Build command: `npm run build`
- Publish directory: `dist`

**For complete deployment guides**, see [DEPLOYMENT.md](references/DEPLOYMENT.md)

## Performance Optimization

### Code splitting

Routes are automatically code-split. For manual splitting:

```tsx
import { lazy } from "solid-js";

const HeavyComponent = lazy(() => import("./HeavyComponent"));

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HeavyComponent />
    </Suspense>
  );
}
```

### Caching strategies

```tsx
const getDataQuery = query(
  async () => {
    "use server";
    return await db.data.findMany();
  },
  "data",
  {
    ttl: 1000 * 60 * 5, // 5 minutes
    staleWhileRevalidate: 1000 * 60 * 10 // 10 minutes
  }
);
```

**For complete performance patterns**, see [PERFORMANCE.md](references/PERFORMANCE.md)

## Middleware

Intercept requests for auth, logging, redirects:

```tsx
// src/middleware/index.ts
import { createMiddleware } from "@solidjs/start/middleware";

export default createMiddleware({
  onRequest: (event) => {
    event.locals.startTime = Date.now();
  },
  onBeforeResponse: (event) => {
    const duration = Date.now() - event.locals.startTime;
    console.log(`Request took ${duration}ms`);
  }
});
```

Configure path in `app.config.ts`:

```tsx
export default defineConfig({
  middleware: "src/middleware/index.ts"
});
```

## Common Patterns

### Protected routes

```tsx
const getCurrentUserQuery = query(async () => {
  "use server";
  const session = await useSession({
    password: process.env.SESSION_SECRET as string
  });
  
  if (!session.data.userId) {
    throw redirect("/login");
  }
  
  return await db.users.findOne({ id: session.data.userId });
}, "currentUser");

export const route = {
  preload: () => getCurrentUserQuery()
} satisfies RouteDefinition;
```

### Optimistic UI

```tsx
const addToCartAction = action(async (formData: FormData) => {
  "use server";
  // Add to cart
}, "addToCart");

export default function Cart() {
  const cart = createAsync(() => getCartQuery());
  const submission = useSubmission(addToCartAction);
  
  const optimisticCart = () => {
    const items = cart() ?? [];
    if (submission.pending) {
      const formData = submission.input[0] as FormData;
      const name = formData.get("name")?.toString();
      if (name) {
        return [...items, { id: "temp", name }];
      }
    }
    return items;
  };
  
  return (
    <For each={optimisticCart()}>
      {(item) => <div>{item.name}</div>}
    </For>
  );
}
```

## Reference Documentation

For detailed guides on specific topics:

- **[ROUTING.md](references/ROUTING.md)** - Complete routing patterns, nested layouts, groups
- **[DATA-LOADING.md](references/DATA-LOADING.md)** - query, createAsync, preloading, caching
- **[SERVER-FUNCTIONS.md](references/SERVER-FUNCTIONS.md)** - Server boundaries, serialization
- **[FORMS-ACTIONS.md](references/FORMS-ACTIONS.md)** - Progressive enhancement, validation
- **[DEPLOYMENT.md](references/DEPLOYMENT.md)** - Platform-specific deployment guides
- **[PERFORMANCE.md](references/PERFORMANCE.md)** - Optimization techniques, bundle analysis
- **[ECOSYSTEM.md](references/ECOSYSTEM.md)** - UI libraries, testing, state management

## Related Skills

- **building-with-solidjs** - Core SolidJS reactivity, components, and patterns

## Additional Resources

- [SolidStart Documentation](https://docs.solidjs.com/solid-start/)
- [SolidJS Documentation](https://docs.solidjs.com/)
- [Solid Router Documentation](https://docs.solidjs.com/solid-router/)
