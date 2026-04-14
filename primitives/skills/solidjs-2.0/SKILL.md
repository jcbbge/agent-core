---
name: solidjs-2.0
description: SolidJS 2.0 divergences from 1.x — covers only what changed. Load alongside building-with-solidjs when working in any Solid 2.0 project. Covers async primitives, temporal tuple mental model, hydration, owner graph, and test patterns.
license: MIT
metadata:
  author: jrg | claude
  version: "1.0"
  tags: solidjs, frontend, reactivity, async, hydration, solid2
---

# SolidJS 2.0 — Divergences from 1.x

**Scope:** Only what changed. For foundational Solid patterns (signals, stores, props, control flow, effects), see `building-with-solidjs`. Those still apply.

**Trigger:** Any project with `solid-js` ^2.x in `package.json`, or any import from `@solidjs/web`.

---

## The Mental Model Shift: Temporal Tuple

This is the foundational idea behind every 2.0 change. Get this right and everything else follows.

In 1.x, async was a side effect. A promise resolved somewhere, a boolean flipped somewhere else, and the UI was expected to stay in sync via effects and loading flags.

In 2.0, **every reactive value carries both a Now and a Future**. Async is part of the value's identity — not something you manually wire to the UI. The runtime owns the timeline. The UI is a pure projection of a value's temporal state.

This means:
- No more loading booleans
- No more null-checking data while loading
- No more cleanup heuristics for async effects
- `<Suspense>` is the only surface where async loading state belongs

If you find yourself writing `if (data())` before using async data, you've missed the mental model.

---

## 1. Import Changes

| 1.x | 2.0 |
|-----|-----|
| `import { render } from 'solid-js/web'` | `import { render } from '@solidjs/web'` |
| `import { createRouteData } from '@solidjs/router'` | removed — use `createAsync` |
| `solid-js/store` | still `solid-js/store` (unchanged) |

Both `solid-js/web` and `@solidjs/web` exist. Only `@solidjs/web` is the 2.0 renderer. Using the old path gives you a blank screen with no error.

---

## 2. Async Primitive: `createAsync` Replaces `createResource`

```tsx
// ❌ 1.x — nullable while loading, requires null guard
import { createResource } from 'solid-js'
const [quote] = createResource(id, fetchQuote)
// quote() is undefined while loading — you must check

// ✅ 2.0 — never nullable, Suspense handles loading
import { createAsync } from '@solidjs/router'
const quote = createAsync(() => fetchQuote(id()))
// quote() is ALWAYS defined inside a Suspense boundary — never null-check it
```

**The non-nullable contract is the point.** Wrapping with `<Suspense>` is what makes it work. If you null-check `createAsync` data, you've broken the temporal tuple model and likely introduced a subtle bug.

```tsx
// ✅ Correct pattern
export default function QuotePage() {
  const params = useParams()
  const quote = createAsync(() => api.getQuote(params.id))

  return (
    <Suspense fallback={<QuoteLoading />}>
      <QuoteDetail quote={quote()} />  {/* quote() is never undefined here */}
    </Suspense>
  )
}
```

`createResource` still exists for backwards compatibility. `createAsync` is idiomatic 2.0 for all new code.

---

## 3. `createEffect` Signature Change

In 2.0, tracked signals move to an options argument:

```tsx
// 1.x — implicit dependency tracking
createEffect(() => {
  doSomething(count())
})

// 2.0 — tracked signals declared explicitly
createEffect(() => doSomething(), { inside: count })
```

This is primarily relevant during migration. For new code, the explicit form makes dependencies visible and avoids the stale-closure ambiguities that plagued 1.x async effects.

---

## 4. Track Before Await (Async Memos)

Reactive tracking does not cross `await` boundaries. Signal access after an `await` is not tracked.

```tsx
// ❌ count() accessed after await — will NOT retrack when count changes
const double = createMemo(async () => {
  await delay(2000)
  return count() * 2  // Not tracked!
})

// ✅ Read the signal before the await
const double = createMemo(async () => {
  const c = count()          // Track here
  await delay(2000)
  return c * 2               // Use the captured value
})
```

This is the most common subtle bug in async Solid 2.0 code. When something stops reacting to a change, check for this pattern first.

---

## 5. Automatic Batching

2.0 automatically batches signal writes in async handlers. `batch()` still works but is rarely needed in new code.

```tsx
// 1.x — manual batch required for multiple updates in async context
batch(() => {
  setA(x)
  setB(y)
})

// 2.0 — batched automatically
setA(x)
setB(y)  // no batch() needed
```

---

## 6. Owner vs Component (Important for Context and Cleanup)

**This is a 2.0 conceptual shift that affects how you reason about the reactive graph.**

In 2.0, **owners are created by reactive computations, not by components**:
- `createEffect`, `createMemo`, async computations, boundary roots → each creates an owner
- Components execute *inside* an owner but do not create one themselves

Why this matters:
- `onCleanup` runs when the owner is disposed, not when the component unmounts
- Context is tied to the owner graph, not the component tree
- Async closures in SSR are tied to owner identity for hydration
- When debugging reactive cleanup or context issues, think "which computation owns this?" not "which component mounted this?"

```tsx
// This component does NOT own its effects
function MyComponent() {
  // The createEffect below creates an owner inside the component's scope
  // When the component unmounts, it's because the owner that ran this
  // component gets disposed — which disposes the effect's owner too
  createEffect(() => {
    console.log('reactive side effect')
  })

  return <div />
}
```

In practice: write components normally. This matters when debugging or reasoning about cleanup ordering and SSR hydration.

---

## 7. Hydration Model (SSR / SolidStart)

2.0 hydration is structural and deterministic. No hydration IDs. No DOM scanning heuristics.

### How it works

**Pseudo nodes + slot-based matching:** The server and client both generate the same DOM structure. The client matches nodes by position (slot index), not by marker attributes.

```tsx
<div>
  <span/>   {/* slot 0 */}
  <button/> {/* slot 1 */}
</div>
// Client matches: root.child[0] → span, root.child[1] → button
// No hydration ID needed
```

**Async boundaries:** Every `<Suspense>` boundary has deterministic owner IDs. Fallback branch gets key `"F"`, success gets `"S"`. This ensures the client recreates the exact same owner graph as the server.

### Signal writes during hydration

**Critical:** If user code writes to a signal during hydration, Solid **automatically cancels hydration for not-yet-hydrated boundaries**. The signal write goes through — signals are never blocked. Only the hydration of pending boundaries stops.

This is the only sound behavior without serializing the full signal graph. Accept it rather than fighting it. Design event handlers that either:
1. Buffer writes until `onHydrationEnd`
2. Write immediately and accept boundary cancellation

### Hydration phase API

```tsx
import { isHydrating, onHydrationEnd } from '@solidjs/web'

// Non-reactive boolean — true during hydration, false after
// NOT visible during SSR — only for event handlers
if (isHydrating()) {
  // Defer this write, or buffer it
}

// Fires once when hydration is fully complete
onHydrationEnd(() => {
  // Flush buffered events
  // Apply deferred writes
  // Start client-only logic
})
```

**When to use:**
- `isHydrating()` — inside event handlers that fire during the hydration window
- `onHydrationEnd` — to flush buffered state or start client-only subscriptions

---

## 8. Test Patterns

Signal writes are batched — immediate reads won't see updates without flushing:

```tsx
import { createSignal, flush } from 'solid-js'

const [a, setA] = createSignal(1)
setA(10)
// a() is still 1 here — batch hasn't flushed

flush()
// Now a() is 10
```

Add `flush()` after signal writes in unit tests before asserting on state.

---

## 9. Dev Warnings Are Signals

Do not suppress or ignore Solid 2.0 dev warnings. They are early signs of structural reactive issues:

| Warning | Means |
|---------|-------|
| `"reactive read in owned scope"` | Signal accessed outside reactive context — won't track |
| `"reactive written in owned scope"` | Signal written in a computation — likely a modeling mistake |

Stop and understand these. Working around them produces bugs that are extremely hard to trace later.

---

## V1 Patterns That Still Apply Unchanged

- Components execute once — never on re-render
- Never destructure props
- Signals are functions: `count()` not `count`
- Signal access must be in reactive scope (JSX, `createEffect`, `createMemo`)
- `createStore` / `produce` — unchanged
- `Show`, `For`, `Index`, `Switch/Match` — unchanged
- `class` not `className`
- `classList` for conditional classes
- `onMount`, `onCleanup` — unchanged
- `ErrorBoundary` — unchanged (though reset callback is now `(err, reset) => ...`)

---

## Quick Decision Table

| Situation | 1.x | 2.0 |
|-----------|-----|-----|
| Render to DOM | `solid-js/web` | `@solidjs/web` |
| Async data | `createResource` | `createAsync` (non-nullable) |
| Loading state | `resource.loading` boolean | `<Suspense fallback>` |
| Multiple signal updates | `batch()` | Automatic (batch still works) |
| Track async dependency | anywhere in async fn | Before the `await` |
| Event during hydration | — | Check `isHydrating()` |
| After hydration complete | — | `onHydrationEnd()` |
| Unit test state changes | — | `flush()` after writes |
