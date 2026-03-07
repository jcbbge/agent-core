# SolidJS Performance Optimization

## Table of Contents
- [Performance Fundamentals](#performance-fundamentals)
- [Reactivity Optimization](#reactivity-optimization)
- [Component Optimization](#component-optimization)
- [List Rendering](#list-rendering)
- [Event Handlers](#event-handlers)
- [Asset Loading](#asset-loading)
- [Profiling](#profiling)

## Performance Fundamentals

### Why SolidJS is Fast

SolidJS achieves high performance through:

1. **Fine-grained reactivity** - Updates only affected DOM nodes
2. **No Virtual DOM** - Direct DOM manipulation, no diffing
3. **Compile-time optimization** - JSX compiles to optimized code
4. **Minimal overhead** - Small runtime, no framework tax
5. **Lazy evaluation** - Computations only run when needed

```typescript
// This JSX:
<div>{count()}</div>

// Compiles roughly to:
const div = document.createElement('div');
createRenderEffect(() => div.textContent = count());

// Only the textContent updates when count changes
// No component re-render, no Virtual DOM diff
```

### Performance Mental Model

**React (Virtual DOM):**
- State change → Re-run component → Create new Virtual DOM → Diff → Update real DOM

**SolidJS (Fine-Grained Reactivity):**
- State change → Update subscribed expressions → Update real DOM directly

**Result:** SolidJS skips component re-execution and diffing entirely.

## Reactivity Optimization

### Use createMemo for Expensive Computations

```typescript
import { createSignal, createMemo } from 'solid-js';

const [items, setItems] = createSignal([...1000 items...]);
const [filter, setFilter] = createSignal('');

// ❌ SLOW: Computation runs on every access
<div>
  {items().filter(item => item.name.includes(filter())).length} results
</div>
<For each={items().filter(item => item.name.includes(filter()))}>
  {(item) => <div>{item.name}</div>}
</For>

// ✅ FAST: Computation runs once, result cached
const filteredItems = createMemo(() => {
  return items().filter(item => item.name.includes(filter()));
});

<div>{filteredItems().length} results</div>
<For each={filteredItems()}>
  {(item) => <div>{item.name}</div>}
</For>
```

**When to memo:**
- Computation is expensive (filtering, sorting, transforming large arrays)
- Result is used multiple times
- Computation depends on reactive values

**When NOT to memo:**
- Simple expressions (`count() * 2`)
- Result used only once
- No reactive dependencies

### Use untrack to Prevent Dependencies

```typescript
import { createSignal, createEffect, untrack } from 'solid-js';

const [value, setValue] = createSignal(0);
const [log, setLog] = createSignal<string[]>([]);

// Effect only tracks 'value', not 'log'
createEffect(() => {
  const currentValue = value();
  const currentLog = untrack(log); // Don't track log
  
  setLog([...currentLog, `Value: ${currentValue}`]);
});

setValue(5); // Effect runs
setLog([]); // Effect does NOT run
```

**Use untrack for:**
- Logging in effects
- Reading state without creating dependency
- Breaking circular dependencies
- Performance optimization

### Use on() for Explicit Dependencies

```typescript
import { on } from 'solid-js';

const [a, setA] = createSignal(1);
const [b, setB] = createSignal(2);
const [c, setC] = createSignal(3);

// Only track 'a', ignore 'b' and 'c' even if read
createEffect(on(a, () => {
  console.log('a:', a());
  console.log('b:', b()); // Read but NOT tracked
  console.log('c:', c()); // Read but NOT tracked
}));

setB(10); // No execution
setC(15); // No execution
setA(5); // Executes
```

**Use on() for:**
- Limiting effect dependencies
- Performance optimization
- Avoiding unnecessary effect runs

### Batch Multiple Updates

```typescript
import { batch } from 'solid-js';

const [first, setFirst] = createSignal('');
const [last, setLast] = createSignal('');
const [email, setEmail] = createSignal('');

createEffect(() => {
  console.log(`${first()} ${last()} <${email()}>`);
});

// ❌ SLOW: Effect runs 3 times
setFirst('John');
setLast('Doe');
setEmail('john@example.com');

// ✅ FAST: Effect runs once
batch(() => {
  setFirst('John');
  setLast('Doe');
  setEmail('john@example.com');
});
```

**Automatic batching:**
Event handlers automatically batch updates:

```typescript
<button onClick={() => {
  setFirst('John'); // Batched automatically
  setLast('Doe');
  setEmail('john@example.com');
}}>
  Update Profile
</button>
```

### Lazy Signal Evaluation

```typescript
// Signals are lazy - only compute when accessed
const [items, setItems] = createSignal(heavyComputation());

// ❌ Computes immediately
const initial = heavyComputation();
const [items, setItems] = createSignal(initial);

// ✅ Computes only when items() is first called
const [items, setItems] = createSignal(undefined as any);
const getItems = () => {
  if (items() === undefined) {
    setItems(heavyComputation());
  }
  return items();
};
```

## Component Optimization

### Keep Event Handlers in Component Scope

```typescript
// ✅ GOOD: Handler defined once
const Component = () => {
  const handleClick = () => {
    console.log('Clicked');
  };
  
  return <button onClick={handleClick}>Click</button>;
};

// ❌ AVOID: New function on every render (but not as bad as React)
const Component = () => {
  return <button onClick={() => console.log('Clicked')}>Click</button>;
};
```

**Note:** SolidJS components run once, so inline handlers aren't as costly as React, but named handlers are still clearer and slightly more efficient.

### Use splitProps for Attribute Forwarding

```typescript
import { splitProps } from 'solid-js';

interface ButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  variant: 'primary' | 'secondary';
}

// ✅ Efficient prop splitting
const Button: Component<ButtonProps> = (props) => {
  const [local, others] = splitProps(props, ['variant']);
  
  return (
    <button 
      class={`btn-${local.variant}`}
      {...others}
    >
      {props.children}
    </button>
  );
};
```

### Avoid Unnecessary Component Wrappers

```typescript
// ❌ Unnecessary wrapper
const Wrapper = (props) => {
  return <>{props.children}</>;
};

// ✅ Just use children directly
<div>
  {props.children}
</div>
```

### Use Component for Type Safety (No Runtime Cost)

```typescript
import { Component } from 'solid-js';

// Type annotation - no runtime overhead
const MyComponent: Component<Props> = (props) => {
  return <div>{props.value}</div>;
};
```

## List Rendering

### For vs Index

**Use For when items can move:**

```typescript
import { For } from 'solid-js';

const [todos, setTodos] = createSignal([
  { id: '1', text: 'Buy milk', done: false },
  { id: '2', text: 'Walk dog', done: true }
]);

// ✅ For tracks by reference - efficient for reordering
<For each={todos()}>
  {(todo) => (
    <div>
      <input type="checkbox" checked={todo.done} />
      <span>{todo.text}</span>
    </div>
  )}
</For>

// When todos reorder, DOM elements move without recreation
```

**Use Index when position is stable:**

```typescript
import { Index } from 'solid-js';

const [colors, setColors] = createSignal(['#f00', '#0f0', '#00f']);

// ✅ Index tracks by position - efficient for value changes
<Index each={colors()}>
  {(color, index) => (
    <div style={{ background: color() }}>
      Color {index}
    </div>
  )}
</Index>

// When color values change, only content updates
```

**Performance comparison:**

| Scenario | Use | Why |
|----------|-----|-----|
| Todo list with drag/drop | `For` | Items reorder frequently |
| Fixed-size color palette | `Index` | Positions stable, values change |
| Dynamic shopping cart | `For` | Items added/removed |
| Pagination controls | `Index` | Fixed positions (1, 2, 3...) |

### Avoid .map() for Dynamic Lists

```typescript
// ❌ SLOW: Entire list recreates on every update
{todos().map(todo => <TodoItem {...todo} />)}

// ✅ FAST: Only changed items update
<For each={todos()}>
  {(todo) => <TodoItem {...todo} />}
</For>
```

**Exception:** Static lists that never change:

```typescript
// OK for static data
const MENU_ITEMS = ['Home', 'About', 'Contact'];

<ul>
  {MENU_ITEMS.map(item => <li>{item}</li>)}
</ul>
```

### Keying in For Component

**For automatically tracks by reference - no manual keys needed:**

```typescript
// ✅ No key needed - tracked by reference
<For each={todos()}>
  {(todo) => <TodoItem {...todo} />}
</For>

// React equivalent would need:
// {todos.map(todo => <TodoItem key={todo.id} {...todo} />)}
```

**Manual keying only needed for Index with objects:**

```typescript
// If using Index with objects, use fallback option
<Index each={todos()} fallback={<div>No items</div>}>
  {(todo, i) => <TodoItem {...todo()} />}
</Index>
```

## Event Handlers

### Event Handler Patterns

```typescript
// ✅ BEST: Named handler in component scope
const Component = () => {
  const handleClick = (e: MouseEvent) => {
    console.log('Clicked', e.target);
  };
  
  return <button onClick={handleClick}>Click</button>;
};

// ✅ GOOD: Handler with parameter
const handleItemClick = (id: string) => (e: MouseEvent) => {
  console.log('Item clicked:', id);
};

<button onClick={handleItemClick(item.id)}>Delete</button>

// ⚠️ OK but less clear: Inline handler
<button onClick={(e) => console.log('Clicked')}>Click</button>

// ❌ AVOID: Unnecessary arrow wrapper
<button onClick={() => handleClick()}>Click</button>

// ✅ PREFER: Direct reference
<button onClick={handleClick}>Click</button>
```

### Delegated vs Non-Delegated Events

**Delegated (default) - Most events:**

```typescript
// Automatically delegated
<button onClick={handleClick}>Click</button>
<div onMouseMove={handleMove}>Move</div>
```

**Non-delegated (on: prefix) - Special cases:**

```typescript
// Use on: for non-bubbling events
<div on:scroll={handleScroll}>Scrollable</div>

// Use on: for custom events
<custom-element on:custom-event={handleCustom} />

// Use on: when delegation causes issues
<div on:click={handleClickOutside}>Content</div>
```

**Performance impact:** Delegated events are slightly more efficient (one listener at root), but the difference is negligible in most apps.

## Asset Loading

### Font Loading (Based on your SOLIDJS_FONT-LOADING_GUIDE)

**Critical fonts (render-blocking):**

```typescript
// In entry-server.tsx or root component
<head>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link
    rel="stylesheet"
    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700"
    media="all"
  />
</head>
```

**Non-critical fonts (async):**

```typescript
<link
  rel="preload"
  as="style"
  href="https://fonts.googleapis.com/css2?family=Caveat"
  onload="this.onload=null;this.rel='stylesheet'"
/>
```

**Best practices:**
- Preconnect to font domains
- Load fonts before other assets
- Combine multiple font families in one request
- Only load needed weights
- Consider self-hosting for maximum control

### Code Splitting

```typescript
import { lazy } from 'solid-js';

// Lazy load components
const HeavyComponent = lazy(() => import('./HeavyComponent'));

// Use with Suspense
<Suspense fallback={<Loading />}>
  <HeavyComponent />
</Suspense>
```

### Image Optimization

```typescript
// Lazy load images
<img 
  src={imageSrc()} 
  loading="lazy"
  width="800"
  height="600"
  alt="Description"
/>

// Use srcset for responsive images
<img
  srcset="image-small.jpg 400w, image-large.jpg 800w"
  sizes="(max-width: 600px) 400px, 800px"
  src="image-large.jpg"
  alt="Description"
/>
```

## Profiling

### Browser DevTools

**Chrome/Edge DevTools:**

1. Open DevTools → Performance tab
2. Click Record
3. Interact with app
4. Stop recording
5. Analyze flame graph

**Look for:**
- Long tasks (yellow)
- Frequent updates
- Unnecessary computations

### SolidJS DevTools

**Install SolidJS DevTools extension:**

```bash
# Chrome/Edge
https://chrome.google.com/webstore → Search "Solid DevTools"

# Firefox
https://addons.mozilla.org → Search "Solid DevTools"
```

**Features:**
- Component tree
- Signal values
- Effect tracking
- Performance metrics

### Performance Monitoring

```typescript
// Custom performance tracking
const startTime = performance.now();

createEffect(() => {
  const endTime = performance.now();
  console.log(`Effect took ${endTime - startTime}ms`);
});

// Mark expensive operations
performance.mark('filter-start');
const filtered = items().filter(predicate);
performance.mark('filter-end');
performance.measure('filter', 'filter-start', 'filter-end');
```

### Identifying Bottlenecks

```typescript
// Log effect runs
createEffect(() => {
  console.count('Effect runs');
  expensiveOperation();
});

// Track signal accesses
const [count, setCount] = createSignal(0);
const countGetter = () => {
  console.log('Count accessed');
  return count();
};
```

## Performance Checklist

### Reactivity
- [ ] Use createMemo for expensive computations
- [ ] Use untrack to prevent unnecessary dependencies
- [ ] Use on() for explicit dependency control
- [ ] Batch related signal updates
- [ ] Avoid creating signals in loops or effects

### Components
- [ ] Event handlers in component scope (not inline)
- [ ] Use Show for conditionals (not ternaries)
- [ ] Use For/Index for lists (not .map())
- [ ] Choose For vs Index appropriately
- [ ] Avoid unnecessary component wrappers

### Assets
- [ ] Preconnect to external domains
- [ ] Load critical fonts early
- [ ] Lazy load non-critical components
- [ ] Optimize images (lazy loading, responsive)
- [ ] Code split large components

### Profiling
- [ ] Use browser DevTools Performance tab
- [ ] Install SolidJS DevTools
- [ ] Monitor effect runs in development
- [ ] Measure expensive operations
- [ ] Test on low-end devices

## Common Performance Pitfalls

### 1. Unnecessary Memos

```typescript
// ❌ Unnecessary memo for simple expression
const doubled = createMemo(() => count() * 2);

// ✅ Just use the expression
<div>{count() * 2}</div>
```

### 2. Over-Reactive Effects

```typescript
// ❌ Effect runs on every dependency
createEffect(() => {
  fetch(`/api/users/${userId()}`);
});

// ✅ Use createResource instead
const [user] = createResource(userId, async (id) => {
  const res = await fetch(`/api/users/${id}`);
  return res.json();
});
```

### 3. Expensive Inline Computations

```typescript
// ❌ Computation runs on every access
<For each={items().filter(i => i.active).sort((a, b) => a.name.localeCompare(b.name))}>
  {(item) => <div>{item.name}</div>}
</For>

// ✅ Memoize the computation
const sortedActiveItems = createMemo(() => 
  items()
    .filter(i => i.active)
    .sort((a, b) => a.name.localeCompare(b.name))
);

<For each={sortedActiveItems()}>
  {(item) => <div>{item.name}</div>}
</For>
```

### 4. Large Store Updates

```typescript
// ❌ Many individual updates
items.forEach((item, i) => {
  setState('items', i, 'processed', true);
});

// ✅ Batch with produce
setState('items', produce((items) => {
  items.forEach(item => {
    item.processed = true;
  });
}));
```

## Best Practices Summary

✅ **Do:**
- Memo expensive computations
- Use For/Index for lists
- Batch related updates
- Use Show for conditionals
- Profile in development
- Test on real devices

❌ **Avoid:**
- Unnecessary memos
- Inline computations in JSX
- .map() for dynamic lists
- Ternaries for conditionals
- Creating signals in effects
- Large unbatched updates

---

**Key Takeaway:** SolidJS is fast by default. Focus on using the right primitives (memos for derivations, For/Index for lists) and avoid anti-patterns. Profile to find actual bottlenecks before optimizing.
