---
description: SolidJS and SolidStart reactivity rules — prevents React-trained patterns
globs: ["**/*.jsx", "**/*.tsx", "**/solid*/**/*", "**/solidjs/**/*", "**/solidstart/**/*"]
---

# SolidJS Rules

Components execute ONCE — not on every render like React.

- **Never destructure props.** `props.name` not `const { name } = props` — destructuring breaks reactivity.
- Signals must be called as functions: `count()` not `count`.
- Access signals inside reactive scope only: JSX, `createEffect`, `createMemo`. Never in plain function bodies called outside reactive context.
- Prefer `createMemo` over redundant reactive computations.
- No unnecessary `createEffect` — prefer derived signals.
- Route params via `useParams()`, not prop drilling.
- SolidStart server functions require `"use server"` directive.

Load the `building-with-solidjs` skill for full reference. Load `building-with-solidstart` for SSR/routing/server functions.
