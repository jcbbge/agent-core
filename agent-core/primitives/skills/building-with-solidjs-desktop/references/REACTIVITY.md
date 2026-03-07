# SolidJS Reactivity System

## Table of Contents
- [Mental Model](#mental-model)
- [Reactive Primitives](#reactive-primitives)
- [Dependency Tracking](#dependency-tracking)
- [Execution Model](#execution-model)
- [Advanced Patterns](#advanced-patterns)

## Mental Model

### Fine-Grained Reactivity

SolidJS uses **fine-grained reactivity**, not a Virtual DOM:

1. **Components are setup functions** - They run ONCE to establish the reactive graph
2. **Reactivity happens in expressions** - JSX expressions create subscriptions
3. **Updates are surgical** - Only affected DOM nodes update, no re-rendering
4. **No diffing** - Direct DOM manipulation based on reactive changes

```typescript
function Counter() {
  const [count, setCount] = createSignal(0);
  
  console.log('Component setup - runs ONCE');
  
  return (
    <div>
      {/* This expression creates a reactive subscription */}
      <p>Count: {count()}</p>
      
      {/* Only this <p> updates when count changes */}
      <p>Doubled: {count() * 2}</p>
    </div>
  );
}
```

**What happens:**
1. Component function runs once
2. Each `{count()}` in JSX creates a subscription
3. When `setCount()` is called, only subscribed expressions update
4. No component re-execution, no reconciliation

### React vs Solid Execution

```typescript
// React (Virtual DOM)
function ReactCounter() {
  const [count, setCount] = useState(0);
  
  console.log('Re-renders on every state change'); // Runs repeatedly
  
  return <div>Count: {count}</div>; // Entire JSX recreated
}

// SolidJS (Fine-Grained Reactivity)
function SolidCounter() {
  const [count, setCount] = createSignal(0);
  
  console.log('Runs ONCE on component creation'); // Runs once
  
  return <div>Count: {count()}</div>; // Only {count()} updates
}
```

**Key difference:** React re-runs the function; Solid subscribes to expressions.

## Reactive Primitives

### createSignal

**Signature:**
```typescript
function createSignal<T>(
  initialValue: T
): [get: () => T, set: (value: T | ((prev: T) => T)) => T]
```

**Core primitive for reactive values:**

```typescript
import { createSignal } from 'solid-js';

// Create signal
const [count, setCount] = createSignal(0);

// Read: call as function
console.log(count()); // 0

// Write: direct value
setCount(5);
console.log(count()); // 5

// Write: updater function
setCount(c => c + 1);
console.log(count()); // 6

// Write returns the new value
const newValue = setCount(10);
console.log(newValue); // 10
```

**Signal options:**

```typescript
// Equality check (prevents unnecessary updates)
const [value, setValue] = createSignal(0, { 
  equals: (prev, next) => prev === next 
});

// Custom equality (for objects)
const [user, setUser] = createSignal(
  { name: 'John' },
  { equals: (a, b) => a.name === b.name }
);
```

**Naming convention:**

```typescript
// ✅ Descriptive names
const [count, setCount] = createSignal(0);
const [isOpen, setIsOpen] = createSignal(false);
const [userName, setUserName] = createSignal('');

// ❌ Generic names
const [value, setValue] = createSignal(0);
const [open, setOpen] = createSignal(false);
```

### createEffect

**Signature:**
```typescript
function createEffect<T>(
  fn: (prev: T) => T,
  value?: T
): void
```

**Reactive side effects that run when dependencies change:**

```typescript
import { createSignal, createEffect } from 'solid-js';

const [count, setCount] = createSignal(0);

// Effect runs immediately and when count changes
createEffect(() => {
  console.log('Count is:', count());
});

// Effect with previous value
createEffect((prev) => {
  console.log(`Count changed from ${prev} to ${count()}`);
  return count(); // Return value becomes next "prev"
}, 0); // Initial value for prev

setCount(5); // Logs: "Count changed from 0 to 5"
```

**Automatic dependency tracking:**

```typescript
const [firstName, setFirstName] = createSignal('John');
const [lastName, setLastName] = createSignal('Doe');
const [age, setAge] = createSignal(30);

createEffect(() => {
  // Automatically tracks firstName and lastName, NOT age
  console.log(`Name: ${firstName()} ${lastName()}`);
});

setAge(31); // No effect execution (age not tracked)
setFirstName('Jane'); // Effect executes
```

**Effect cleanup:**

```typescript
import { onCleanup } from 'solid-js';

createEffect(() => {
  const id = setInterval(() => {
    console.log('Tick');
  }, 1000);
  
  // Cleanup runs before next effect or component unmount
  onCleanup(() => clearInterval(id));
});
```

**When to use:**
- Logging/debugging reactive changes
- Side effects (API calls, subscriptions)
- Synchronizing with external systems
- DOM manipulation (rare)

**When NOT to use:**
- Deriving values (use `createMemo`)
- One-time setup (use `onMount`)
- Event handlers (use regular functions)

### createMemo

**Signature:**
```typescript
function createMemo<T>(
  fn: (prev: T) => T,
  value?: T,
  options?: { equals?: (prev: T, next: T) => boolean }
): () => T
```

**Cached computed values:**

```typescript
import { createSignal, createMemo } from 'solid-js';

const [items, setItems] = createSignal([...]);
const [filter, setFilter] = createSignal('');

// Memo: only recalculates when items or filter changes
const filteredItems = createMemo(() => {
  console.log('Computing filtered items'); // Logs only on change
  return items().filter(item => 
    item.name.includes(filter())
  );
});

// Access memo result
console.log(filteredItems()); // Returns cached result
```

**Memo vs inline computation:**

```typescript
// ❌ AVOID: Inline computation (runs on every access)
<For each={items().filter(item => item.active)}>
  {(item) => <div>{item.name}</div>}
</For>

// ✅ GOOD: Memo (cached, only recomputes when dependencies change)
const activeItems = createMemo(() => items().filter(item => item.active));

<For each={activeItems()}>
  {(item) => <div>{item.name}</div>}
</For>
```

**Memo with previous value:**

```typescript
const sum = createMemo((prev = 0) => {
  const current = numbers().reduce((a, b) => a + b, 0);
  console.log(`Sum changed from ${prev} to ${current}`);
  return current;
});
```

**When to use:**
- Expensive computations
- Derived state used multiple times
- Values that should cache between accesses

**When NOT to use:**
- Simple expressions (overhead not worth it)
- Values used only once
- Values that change on every dependency change

### createResource

**Signature:**
```typescript
function createResource<T, U>(
  source: U | (() => U),
  fetcher: (source: U, info: { value: T | undefined, refetching: boolean }) => Promise<T>,
  options?: ResourceOptions<T>
): [
  resource: () => T | undefined,
  { refetch, mutate, loading, error, latest }
]
```

**Async data fetching with reactive refetching:**

```typescript
import { createSignal, createResource } from 'solid-js';

async function fetchUser(id: number) {
  const res = await fetch(`/api/users/${id}`);
  return res.json();
}

const [userId, setUserId] = createSignal(1);

// Resource refetches when userId changes
const [user, { refetch, mutate }] = createResource(userId, fetchUser);

// Access data
user(); // undefined while loading, data when loaded
user.loading; // boolean
user.error; // error object or undefined
user.latest; // previous data while refetching

// Manual refetch
refetch();

// Optimistic update
mutate({ name: 'New Name' });
```

**Resource without source (manual refetch):**

```typescript
const [data, { refetch }] = createResource(async () => {
  const res = await fetch('/api/data');
  return res.json();
});

// Fetch on mount and manual refetch
refetch();
```

**Resource options:**

```typescript
const [user] = createResource(userId, fetchUser, {
  // Initial value before first fetch
  initialValue: { name: 'Loading...' },
  
  // Only refetch if source actually changed
  ssrLoadFrom: 'initial',
  
  // Custom equality for source
  deferStream: true
});
```

**Usage with Suspense:**

```typescript
import { Suspense } from 'solid-js';

<Suspense fallback={<p>Loading...</p>}>
  <Show when={user()}>
    {(u) => <div>{u().name}</div>}
  </Show>
</Suspense>
```

## Dependency Tracking

### How Tracking Works

SolidJS automatically tracks reactive reads:

```typescript
const [a, setA] = createSignal(1);
const [b, setB] = createSignal(2);

createEffect(() => {
  console.log(a()); // Tracks 'a'
  // Does NOT track 'b' - not read in effect
});

setB(3); // No effect execution
setA(2); // Effect executes
```

### Conditional Tracking

```typescript
const [showDetails, setShowDetails] = createSignal(false);
const [name, setName] = createSignal('John');
const [email, setEmail] = createSignal('john@example.com');

createEffect(() => {
  console.log('Name:', name());
  
  if (showDetails()) {
    console.log('Email:', email()); // Only tracks email when showDetails is true
  }
});

setEmail('new@example.com'); // No effect (showDetails is false)
setShowDetails(true); // Effect runs, now tracks email
setEmail('newer@example.com'); // Effect runs (email now tracked)
```

### untrack

**Prevent dependency tracking:**

```typescript
import { untrack } from 'solid-js';

const [count, setCount] = createSignal(0);
const [name, setName] = createSignal('John');

createEffect(() => {
  console.log('Name:', name()); // Tracks name
  console.log('Count:', untrack(count)); // Does NOT track count
});

setCount(5); // No effect execution
setName('Jane'); // Effect executes
```

**Use cases:**
- Reading signal without creating dependency
- Logging in effects without tracking
- Breaking circular dependencies

### on()

**Explicit dependency control:**

```typescript
import { on } from 'solid-js';

const [a, setA] = createSignal(1);
const [b, setB] = createSignal(2);

// Only track 'a', ignore 'b' even if read
createEffect(on(a, () => {
  console.log('a:', a());
  console.log('b:', b()); // Read but NOT tracked
}));

setB(3); // No execution
setA(2); // Executes
```

**Multiple dependencies:**

```typescript
createEffect(on([a, b], () => {
  console.log('a or b changed');
}));
```

**With previous values:**

```typescript
createEffect(on(count, (value, prev) => {
  console.log(`Count: ${prev} → ${value}`);
}));
```

## Execution Model

### Component Execution Flow

```typescript
function Component() {
  console.log('1. Component setup starts');
  
  const [signal, setSignal] = createSignal(0);
  console.log('2. Signal created');
  
  createEffect(() => {
    console.log('3. Effect runs (and on signal changes)');
  });
  
  onMount(() => {
    console.log('4. onMount runs after initial render');
  });
  
  console.log('5. Component setup ends');
  
  return <div>{signal()}</div>;
}

// Output:
// 1. Component setup starts
// 2. Signal created
// 5. Component setup ends
// 3. Effect runs (and on signal changes)
// 4. onMount runs after initial render
```

**Execution order:**
1. Component function runs (once)
2. Signals/memos created
3. JSX expressions create subscriptions
4. Effects run (initial execution)
5. `onMount` callbacks run
6. Future: Only effects/subscriptions update

### Effect Timing

```typescript
import { createEffect, createRenderEffect } from 'solid-js';

const [count, setCount] = createSignal(0);

// createEffect: Runs asynchronously after render
createEffect(() => {
  console.log('Effect:', count());
});

// createRenderEffect: Runs synchronously during render
createRenderEffect(() => {
  console.log('Render effect:', count());
});

setCount(1);
// Output:
// Render effect: 1
// Effect: 1
```

**When to use:**
- `createEffect` - Most side effects (default)
- `createRenderEffect` - DOM measurements, synchronous updates
- `createComputed` - Internal computations (rarely needed)

### batch()

**Group multiple updates:**

```typescript
import { batch } from 'solid-js';

const [firstName, setFirstName] = createSignal('John');
const [lastName, setLastName] = createSignal('Doe');

createEffect(() => {
  console.log(`Name: ${firstName()} ${lastName()}`);
});

// Without batch: effect runs twice
setFirstName('Jane');
setLastName('Smith');

// With batch: effect runs once
batch(() => {
  setFirstName('Jane');
  setLastName('Smith');
});
```

**Automatic batching:**

```typescript
// Event handlers automatically batch
<button onClick={() => {
  setFirstName('Jane'); // Batched automatically
  setLastName('Smith');
}}>
  Update Name
</button>
```

## Advanced Patterns

### Custom Reactive Primitives

```typescript
import { createSignal, createEffect, onCleanup } from 'solid-js';

// Custom primitive: localStorage sync
function createLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = createSignal<T>(
    JSON.parse(localStorage.getItem(key) || JSON.stringify(initialValue))
  );
  
  createEffect(() => {
    localStorage.setItem(key, JSON.stringify(value()));
  });
  
  return [value, setValue] as const;
}

// Usage
const [theme, setTheme] = createLocalStorage('theme', 'light');
```

### Reactive Derivations

```typescript
// Derive multiple values
const [count, setCount] = createSignal(0);

const doubled = createMemo(() => count() * 2);
const tripled = createMemo(() => count() * 3);
const sum = createMemo(() => doubled() + tripled());

console.log(sum()); // 0
setCount(2);
console.log(sum()); // 10 (4 + 6)
```

### Conditional Memos

```typescript
const [enabled, setEnabled] = createSignal(false);
const [value, setValue] = createSignal(0);

// Memo only computes when enabled
const result = createMemo(() => {
  if (!enabled()) return null;
  
  // Expensive computation
  return value() * 1000;
});
```

### Effect Dependencies

```typescript
// Effect with explicit dependencies using on()
const [a, setA] = createSignal(1);
const [b, setB] = createSignal(2);
const [c, setC] = createSignal(3);

createEffect(on([a, b], ([aVal, bVal]) => {
  // Tracks a and b, ignores c
  console.log(aVal + bVal + c());
}));
```

### Lazy Evaluation

```typescript
// Signals are lazy - memo doesn't compute until accessed
const expensive = createMemo(() => {
  console.log('Computing...');
  return heavyComputation();
});

// No computation yet
console.log('Created memo');

// Computes now
console.log(expensive());

// Returns cached value
console.log(expensive());
```

## Best Practices

### Do's

✅ Call signals as functions: `count()` not `count`  
✅ Use memos for expensive computations  
✅ Use effects for side effects only  
✅ Use `on()` for explicit dependencies  
✅ Use `batch()` for multiple related updates  
✅ Use `untrack()` to prevent tracking  
✅ Return cleanup functions from effects  
✅ Use `onMount` for one-time setup  

### Don'ts

❌ Don't compute derived state in effects (use memos)  
❌ Don't destructure signals: `const { count } = signals`  
❌ Don't use effects for data transformation  
❌ Don't create signals in loops or conditions  
❌ Don't forget cleanup in effects with subscriptions  
❌ Don't use effects for initialization (use `onMount`)  

---

**Key Takeaway:** SolidJS reactivity is based on subscriptions, not re-execution. Understanding this mental model is critical for writing efficient, idiomatic SolidJS code.
