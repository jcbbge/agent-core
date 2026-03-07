# SolidStart Ecosystem Reference

Libraries, tools, and integrations that complement SolidStart development.

## Table of Contents

- [UI Component Libraries](#ui-component-libraries)
- [Styling Solutions](#styling-solutions)
- [Testing](#testing)
- [State Management](#state-management)
- [Authentication](#authentication)
- [Database & ORM](#database--orm)
- [Data Fetching](#data-fetching)
- [Forms](#forms)
- [Development Tools](#development-tools)

## UI Component Libraries

### Headless/Unstyled

**Kobalte** - Accessible unstyled UI primitives

```bash
npm install @kobalte/core
```

```tsx
import { Dialog } from "@kobalte/core";

<Dialog.Root>
  <Dialog.Trigger>Open</Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Overlay />
    <Dialog.Content>
      <Dialog.Title>Title</Dialog.Title>
      <Dialog.Description>Description</Dialog.Description>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

**Ark UI** - Multi-framework headless components

```bash
npm install @ark-ui/solid
```

**Corvu** - Unstyled accessible primitives

```bash
npm install corvu
```

### Styled Libraries

**Hope UI** - Styled component library

```bash
npm install @hope-ui/solid
```

```tsx
import { Button, HopeProvider } from "@hope-ui/solid";

<HopeProvider>
  <Button colorScheme="primary">Click me</Button>
</HopeProvider>
```

**SUID** - Material UI for SolidJS

```bash
npm install @suid/material
```

## Styling Solutions

### Tailwind CSS

```bash
npm install -D tailwindcss @tailwindcss/vite
```

```tsx
// app.config.ts
import { defineConfig } from "@solidjs/start/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  vite: {
    plugins: [tailwindcss()]
  }
});
```

### UnoCSS

```bash
npm install -D unocss
```

```tsx
// app.config.ts
import UnoCSS from "unocss/vite";

export default defineConfig({
  vite: {
    plugins: [UnoCSS()]
  }
});
```

### CSS-in-JS

**solid-styled-components**

```bash
npm install solid-styled-components
```

```tsx
import { styled } from "solid-styled-components";

const Button = styled("button")`
  background: ${props => props.primary ? "blue" : "gray"};
  color: white;
  padding: 1rem;
`;
```

## Testing

### Vitest

```bash
npm install -D vitest @solidjs/testing-library jsdom
```

```tsx
// vitest.config.ts
import { defineConfig } from "vitest/config";
import solid from "vite-plugin-solid";

export default defineConfig({
  plugins: [solid()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./test/setup.ts"]
  }
});
```

```tsx
// Component test
import { render, screen } from "@solidjs/testing-library";
import { expect, test } from "vitest";

test("renders component", () => {
  render(() => <MyComponent />);
  expect(screen.getByText("Hello")).toBeInTheDocument();
});
```

### Playwright

End-to-end testing:

```bash
npm install -D @playwright/test
```

```tsx
// tests/example.spec.ts
import { test, expect } from "@playwright/test";

test("homepage loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toContainText("Welcome");
});
```

## State Management

### Built-in (Signals & Stores)

Most apps don't need external state management:

```tsx
import { createSignal, createStore } from "solid-js";

// Signals
const [count, setCount] = createSignal(0);

// Stores
const [state, setState] = createStore({
  user: null,
  posts: []
});
```

### TanStack Query

Advanced data fetching and caching:

```bash
npm install @tanstack/solid-query
```

```tsx
import { QueryClient, QueryClientProvider, createQuery } from "@tanstack/solid-query";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Posts />
    </QueryClientProvider>
  );
}

function Posts() {
  const posts = createQuery(() => ({
    queryKey: ["posts"],
    queryFn: async () => {
      const response = await fetch("/api/posts");
      return response.json();
    }
  }));
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <For each={posts.data}>{(post) => <div>{post.title}</div>}</For>
    </Suspense>
  );
}
```

### Solid Primitives

Collection of useful primitives:

```bash
npm install @solid-primitives/storage
```

```tsx
import { makePersisted } from "@solid-primitives/storage";

const [theme, setTheme] = makePersisted(
  createSignal("light"),
  { name: "theme" }
);
```

## Authentication

### Auth.js (NextAuth.js)

```bash
npm install @auth/solid-start
```

```tsx
// routes/api/auth/[...solidauth].ts
import { SolidAuth } from "@auth/solid-start";
import GitHub from "@auth/core/providers/github";

export const { GET, POST } = SolidAuth({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET
    })
  ]
});
```

```tsx
// routes/index.tsx
import { SessionProvider } from "@auth/solid-start/client";

export default function Home() {
  return (
    <SessionProvider>
      <Profile />
    </SessionProvider>
  );
}
```

### Lucia Auth

Type-safe authentication:

```bash
npm install lucia
```

```tsx
import { lucia } from "lucia";
import { web } from "lucia/middleware";

export const auth = lucia({
  adapter: prismaAdapter(prisma),
  middleware: web(),
  env: "DEV"
});
```

### Better Auth

Modern authentication framework:

```bash
npm install better-auth
```

## Database & ORM

### Prisma

```bash
npm install prisma @prisma/client
npx prisma init
```

```prisma
// prisma/schema.prisma
model User {
  id    String @id @default(cuid())
  email String @unique
  name  String?
  posts Post[]
}

model Post {
  id       String @id @default(cuid())
  title    String
  content  String?
  author   User   @relation(fields: [authorId], references: [id])
  authorId String
}
```

```tsx
// lib/db.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

### Drizzle ORM

Type-safe SQL ORM:

```bash
npm install drizzle-orm
npm install -D drizzle-kit
```

```tsx
import { drizzle } from "drizzle-orm/better-sqlite3";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

const users = sqliteTable("users", {
  id: integer("id").primaryKey(),
  name: text("name"),
  email: text("email")
});

const db = drizzle(process.env.DATABASE_URL);
```

### Supabase

Backend as a service:

```bash
npm install @supabase/supabase-js
```

```tsx
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// Usage
const { data, error } = await supabase
  .from("posts")
  .select("*");
```

## Data Fetching

### Built-in (query + createAsync)

Recommended for most use cases:

```tsx
import { query, createAsync } from "@solidjs/router";

const getPostsQuery = query(async () => {
  "use server";
  return await db.posts.findMany();
}, "posts");

export default function Posts() {
  const posts = createAsync(() => getPostsQuery());
  return <For each={posts()}>{(post) => <div>{post.title}</div>}</For>;
}
```

### TanStack Query

Advanced features like background refetching:

```tsx
const posts = createQuery(() => ({
  queryKey: ["posts"],
  queryFn: fetchPosts,
  staleTime: 1000 * 60 * 5,
  refetchInterval: 1000 * 60
}));
```

## Forms

### Native HTML Forms (Recommended)

```tsx
const createPostAction = action(async (formData: FormData) => {
  "use server";
  // Handle form submission
}, "createPost");

<form action={createPostAction} method="post">
  <input name="title" />
  <button type="submit">Submit</button>
</form>
```

### Modular Forms

Type-safe form library:

```bash
npm install @modular-forms/solid
```

```tsx
import { createForm } from "@modular-forms/solid";

type LoginForm = {
  email: string;
  password: string;
};

export default function Login() {
  const [loginForm, { Form, Field }] = createForm<LoginForm>();
  
  const handleSubmit = (values: LoginForm) => {
    console.log(values);
  };
  
  return (
    <Form onSubmit={handleSubmit}>
      <Field name="email">
        {(field, props) => (
          <input {...props} type="email" />
        )}
      </Field>
      <Field name="password">
        {(field, props) => (
          <input {...props} type="password" />
        )}
      </Field>
      <button type="submit">Login</button>
    </Form>
  );
}
```

## Development Tools

### Solid DevTools

Browser extension for debugging:

```bash
npm install -D solid-devtools
```

```tsx
// entry-client.tsx
import { attachDevtoolsOverlay } from "@solid-devtools/overlay";

if (import.meta.env.DEV) {
  attachDevtoolsOverlay();
}
```

### ESLint

```bash
npm install -D eslint eslint-plugin-solid
```

```js
// eslint.config.js
import solid from "eslint-plugin-solid";

export default [
  {
    files: ["**/*.{ts,tsx}"],
    plugins: { solid },
    rules: {
      ...solid.configs.recommended.rules,
      "solid/reactivity": "warn"
    }
  }
];
```

### TypeScript

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "preserve",
    "jsxImportSource": "solid-js",
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "~/*": ["./src/*"]
    }
  }
}
```

## Meta Frameworks & Extensions

### MDX Support

```bash
npm install -D @mdx-js/rollup remark-gfm
```

```tsx
// app.config.ts
import mdx from "@mdx-js/rollup";
import remarkGfm from "remark-gfm";

export default defineConfig({
  vite: {
    plugins: [
      mdx({
        remarkPlugins: [remarkGfm]
      })
    ]
  }
});
```

### Internationalization

**solid-i18n**

```bash
npm install @solid-primitives/i18n
```

```tsx
import { I18nContext, createI18nContext } from "@solid-primitives/i18n";

const i18n = createI18nContext({
  en: { hello: "Hello" },
  es: { hello: "Hola" }
});

<I18nContext.Provider value={i18n}>
  <App />
</I18nContext.Provider>
```

## Recommended Stack

### Minimal Stack
- **Framework**: SolidStart
- **Styling**: Tailwind CSS
- **Database**: Prisma + PostgreSQL
- **Auth**: Auth.js
- **Testing**: Vitest + Playwright

### Full-Featured Stack
- **Framework**: SolidStart
- **UI Components**: Kobalte + shadcn/solid
- **Styling**: Tailwind CSS + UnoCSS
- **State**: TanStack Query
- **Database**: Prisma + Supabase
- **Auth**: Better Auth
- **Forms**: Native HTML + Zod validation
- **Testing**: Vitest + @solidjs/testing-library + Playwright
- **Monitoring**: Sentry

## Resources

- [SolidStart Docs](https://docs.solidjs.com/solid-start/)
- [SolidJS Docs](https://docs.solidjs.com/)
- [Awesome SolidJS](https://github.com/one-aalam/awesome-solidjs)
- [SolidJS Discord](https://discord.com/invite/solidjs)
- [Solid Primitives](https://github.com/solidjs-community/solid-primitives)
