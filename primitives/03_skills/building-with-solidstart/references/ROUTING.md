# SolidStart Routing Reference

Complete guide to file-based routing in SolidStart.

## Table of Contents

- [Basic Routes](#basic-routes)
- [Dynamic Routes](#dynamic-routes)
- [Optional Parameters](#optional-parameters)
- [Catch-All Routes](#catch-all-routes)
- [Nested Routes](#nested-routes)
- [Route Groups](#route-groups)
- [Route Configuration](#route-configuration)
- [Navigation](#navigation)

## Basic Routes

Files in `routes/` automatically become routes:

```
routes/index.tsx       → /
routes/about.tsx       → /about
routes/contact.tsx     → /contact
routes/blog/index.tsx  → /blog
routes/blog/post.tsx   → /blog/post
```

Each route exports a default component:

```tsx
export default function About() {
  return <div>About Page</div>;
}
```

## Dynamic Routes

Use `[param]` for dynamic segments:

```
routes/users/[id].tsx              → /users/:id
routes/blog/[category]/[slug].tsx  → /blog/:category/:slug
```

Access with `useParams()`:

```tsx
import { useParams } from "@solidjs/router";

export default function UserPage() {
  const params = useParams();
  return <div>User ID: {params.id}</div>;
}
```

### Multiple dynamic segments

```tsx
// routes/blog/[category]/[slug].tsx
import { useParams } from "@solidjs/router";

export default function BlogPost() {
  const params = useParams();
  return (
    <div>
      <p>Category: {params.category}</p>
      <p>Slug: {params.slug}</p>
    </div>
  );
}
```

## Optional Parameters

Use `[[param]]` for optional segments:

```
routes/users/[[id]].tsx  → matches /users and /users/123
```

Example:

```tsx
// routes/products/[[category]].tsx
import { useParams } from "@solidjs/router";

export default function Products() {
  const params = useParams();
  
  return (
    <div>
      {params.category 
        ? `Showing ${params.category} products`
        : "Showing all products"}
    </div>
  );
}
```

## Catch-All Routes

Use `[...param]` to match unlimited segments:

```
routes/docs/[...path].tsx  → /docs/foo, /docs/foo/bar, /docs/foo/bar/baz
```

Access as string with forward slashes:

```tsx
import { useParams } from "@solidjs/router";

export default function Docs() {
  const params = useParams();
  // params.path = "getting-started/installation"
  return <div>Path: {params.path}</div>;
}
```

## Nested Routes

### Nested layouts

Create a file matching the folder name:

```
routes/
├── blog.tsx          # Layout component
└── blog/
    ├── index.tsx     # /blog
    ├── new.tsx       # /blog/new
    └── [id].tsx      # /blog/:id
```

Layout receives children:

```tsx
// routes/blog.tsx
import { RouteSectionProps } from "@solidjs/router";

export default function BlogLayout(props: RouteSectionProps) {
  return (
    <div>
      <nav>
        <a href="/blog">All Posts</a>
        <a href="/blog/new">New Post</a>
      </nav>
      <main>{props.children}</main>
    </div>
  );
}
```

### Deep nesting

```
routes/
├── dashboard.tsx
└── dashboard/
    ├── index.tsx
    ├── settings.tsx
    └── settings/
        ├── profile.tsx
        └── security.tsx
```

Each level can have its own layout.

### Renaming index files

Avoid multiple `index.tsx` files:

```
routes/
└── blog/
    ├── (blog).tsx    # Instead of index.tsx → /blog
    ├── new.tsx       # /blog/new
    └── [id].tsx      # /blog/:id
```

## Route Groups

Use `(name)` to organize without affecting URLs:

```
routes/
├── (marketing)/
│   ├── about.tsx     # /about
│   └── contact.tsx   # /contact
└── (app)/
    ├── dashboard.tsx # /dashboard
    └── settings.tsx  # /settings
```

Groups can have shared layouts:

```
routes/
├── (marketing).tsx   # Layout for marketing pages
├── (marketing)/
│   ├── about.tsx
│   └── contact.tsx
├── (app).tsx         # Layout for app pages
└── (app)/
    ├── dashboard.tsx
    └── settings.tsx
```

### Escaping nested routes

Create separate layouts for the same path:

```
routes/
├── users/
│   ├── index.tsx     # /users with users layout
│   └── projects.tsx  # /users/projects with users layout
└── users(details)/
    └── [id].tsx      # /users/:id with separate layout
```

## Route Configuration

Export a `route` object for additional configuration:

```tsx
import type { RouteDefinition } from "@solidjs/router";

export const route = {
  preload: ({ params }) => {
    // Preload data before rendering
    return getUserQuery(params.id);
  }
} satisfies RouteDefinition;

export default function UserPage() {
  // Component implementation
}
```

### Available configuration

- `preload` - Function to load data before route renders
- `load` - Alternative data loading (older pattern)
- `matchFilters` - Custom route matching logic

## Navigation

### Link component

```tsx
import { A } from "@solidjs/router";

<A href="/about">About</A>
<A href={`/users/${user.id}`}>View User</A>
```

### Programmatic navigation

```tsx
import { useNavigate } from "@solidjs/router";

export default function LoginPage() {
  const navigate = useNavigate();
  
  const handleLogin = async () => {
    await login();
    navigate("/dashboard");
  };
  
  return <button onClick={handleLogin}>Login</button>;
}
```

### Server-side redirects

```tsx
import { redirect } from "@solidjs/router";

const checkAuthQuery = query(async () => {
  "use server";
  const session = await getSession();
  
  if (!session.userId) {
    throw redirect("/login");
  }
  
  return { authenticated: true };
}, "auth");
```

## Router Setup

Configure in `app.tsx`:

```tsx
import { Suspense } from "solid-js";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";

export default function App() {
  return (
    <Router root={(props) => <Suspense>{props.children}</Suspense>}>
      <FileRoutes />
    </Router>
  );
}
```

**Critical**: Always wrap `props.children` in `<Suspense />` to prevent hydration errors since components are lazy-loaded.

## Advanced Patterns

### Route metadata

```tsx
import { Title, Meta } from "@solidjs/meta";

export default function AboutPage() {
  return (
    <>
      <Title>About Us</Title>
      <Meta name="description" content="Learn about our company" />
      <div>Content</div>
    </>
  );
}
```

### Dynamic metadata

```tsx
import { Title } from "@solidjs/meta";
import { useParams } from "@solidjs/router";
import { createAsync } from "@solidjs/router";

export default function UserPage() {
  const params = useParams();
  const user = createAsync(() => getUserQuery(params.id));
  
  return (
    <>
      <Title>{user()?.name || "Loading..."}</Title>
      <div>{user()?.bio}</div>
    </>
  );
}
```

### Protected routes pattern

```tsx
import { redirect } from "@solidjs/router";
import type { RouteDefinition } from "@solidjs/router";

const getAuthenticatedUserQuery = query(async () => {
  "use server";
  const session = await getSession();
  
  if (!session.userId) {
    throw redirect("/login");
  }
  
  return await db.users.findOne({ id: session.userId });
}, "authenticatedUser");

export const route = {
  preload: () => getAuthenticatedUserQuery()
} satisfies RouteDefinition;

export default function DashboardPage() {
  const user = createAsync(() => getAuthenticatedUserQuery());
  return <div>Welcome, {user()?.name}</div>;
}
```

## Best Practices

1. **Use preload for data fetching** - Improves perceived performance
2. **Keep layouts simple** - Complex logic belongs in route components
3. **Use route groups** for organization, not URL structure
4. **Wrap Router in Suspense** - Prevents hydration errors
5. **Use TypeScript** - RouteDefinition type ensures correct configuration
6. **Server-side redirects** - Use in preload/query for auth checks
7. **Consistent naming** - Use clear, descriptive file names
