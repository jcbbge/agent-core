# React vs SolidJS: Critical Differences

## Why This Matters

**Most LLMs are heavily trained on React code.** This creates a contamination problem where React patterns are incorrectly applied to SolidJS. This reference exists to explicitly counter that training and highlight the fundamental differences.

## Table of Contents
- [Fundamental Architecture](#fundamental-architecture)
- [React Hooks Do Not Exist](#react-hooks-do-not-exist)
- [Component Execution](#component-execution)
- [Props Handling](#props-handling)
- [State Management](#state-management)
- [JSX Differences](#jsx-differences)
- [Lifecycle](#lifecycle)
- [Migration Patterns](#migration-patterns)

## Fundamental Architecture

### React: Virtual DOM

```jsx
// React
function Counter() {
  const [count, setCount] = useState(0);
  
  // This function RE-RUNS on every state change
  console.log('Render'); // Logs on every count update
  
  return <div>Count: {count}</div>;
  // Entire JSX recreated, Virtual DOM diff, then real DOM update
}
```

**Flow:** State change → Re-run component → Create Virtual DOM → Diff → Update real DOM

### SolidJS: Fine-Grained Reactivity

```tsx
// SolidJS
function Counter() {
  const [count, setCount] = createSignal(0);
  
  // This function runs EXACTLY ONCE
  console.log('Setup'); // Logs only once
  
  return <div>Count: {count()}</div>;
  // JSX compiles to real DOM, only {count()} updates
}
```

**Flow:** State change → Update subscribed expressions → Update real DOM directly

### Key Differences

| Aspect | React | SolidJS |
|--------|-------|---------|
| Updates | Component re-runs | Expressions update |
| DOM | Virtual DOM + Diff | Direct DOM updates |
| Tracking | Dependency array | Automatic tracking |
| Performance | Good (optimized diffing) | Excellent (no diffing) |

## React Hooks Do Not Exist

### ❌ NO useState

```tsx
// ❌ REACT - Does not exist in SolidJS
import { useState } from 'react';

function Component() {
  const [count, setCount] = useState(0);
  return <div>{count}</div>;
}
```

```tsx
// ✅ SOLIDJS - Use createSignal
import { createSignal } from 'solid-js';

function Component() {
  const [count, setCount] = createSignal(0);
  return <div>{count()}</div>; // Note: count()
}
```

**Critical differences:**
- `count()` is a function call (getter)
- No dependency arrays needed
- No stale closures

### ❌ NO useEffect

```tsx
// ❌ REACT - Does not exist in SolidJS
import { useEffect } from 'react';

function Component() {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    console.log('Count:', count);
  }, [count]); // Dependency array required
  
  return <div>{count}</div>;
}
```

```tsx
// ✅ SOLIDJS - Use createEffect
import { createEffect } from 'solid-js';

function Component() {
  const [count, setCount] = createSignal(0);
  
  createEffect(() => {
    console.log('Count:', count());
    // No dependency array - automatic tracking
  });
  
  return <div>{count()}</div>;
}
```

**Critical differences:**
- No dependency array (automatic tracking)
- Must call `count()` to track
- Runs synchronously on creation

### ❌ NO useMemo / useCallback

```tsx
// ❌ REACT
const memoized = useMemo(() => expensive(value), [value]);
const callback = useCallback(() => handleClick(id), [id]);
```

```tsx
// ✅ SOLIDJS
const memoized = createMemo(() => expensive(value()));
const callback = () => handleClick(id); // No useCallback needed
```

**Why no useCallback:**
- Component runs once in SolidJS
- Functions defined in component scope persist
- No need to memoize callbacks

### ❌ NO useRef

```tsx
// ❌ REACT
const ref = useRef(null);
return <div ref={ref}>Content</div>;
```

```tsx
// ✅ SOLIDJS
let ref;
return <div ref={ref}>Content</div>;

// Or with type safety
let ref!: HTMLDivElement;
return <div ref={ref}>Content</div>;
```

### ❌ NO useContext (Different API)

```tsx
// ❌ REACT
const value = useContext(MyContext);
```

```tsx
// ✅ SOLIDJS
const value = useContext(MyContext);
// Same name, different behavior - no hook rules
```

### ❌ NO useReducer, useLayoutEffect, etc.

React hooks simply don't exist. Use SolidJS primitives instead.

## Component Execution

### React: Component is a Render Function

```jsx
// REACT
function Component() {
  // Runs on EVERY render
  const expensive = expensiveComputation();
  
  const [count, setCount] = useState(0);
  
  // New function every render
  const handleClick = () => setCount(count + 1);
  
  return <button onClick={handleClick}>{count}</button>;
}
```

**Problems:**
- `expensive` recomputes on every render
- `handleClick` is recreated every render
- Requires useMemo/useCallback optimization

### SolidJS: Component is a Setup Function

```tsx
// SOLIDJS
function Component() {
  // Runs EXACTLY ONCE
  const expensive = expensiveComputation(); // Only computes once
  
  const [count, setCount] = createSignal(0);
  
  // Function created once, persists
  const handleClick = () => setCount(count() + 1);
  
  return <button onClick={handleClick}>{count()}</button>;
}
```

**Benefits:**
- No useMemo needed (setup runs once)
- No useCallback needed (functions persist)
- No stale closures (always access current value via `count()`)

## Props Handling

### React: Props are Plain Objects

```jsx
// REACT - Destructuring is fine
function Button({ label, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
}
```

### SolidJS: Props are Reactive Getters

```tsx
// ❌ WRONG in SolidJS - Destructuring breaks reactivity
function Button({ label, onClick, disabled }) {
  // Values read ONCE during setup - no updates!
  return (
    <button onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
}

// ✅ CORRECT in SolidJS - Reference props
function Button(props) {
  return (
    <button onClick={props.onClick} disabled={props.disabled}>
      {props.label}
    </button>
  );
}
```

**Critical rule:** Never destructure props in SolidJS.

### splitProps vs Destructuring

```tsx
// ✅ Use splitProps to separate props while maintaining reactivity
import { splitProps } from 'solid-js';

function Button(props) {
  const [local, others] = splitProps(props, ['label']);
  
  return (
    <button {...others}>
      {local.label}
    </button>
  );
}
```

## State Management

### Simple State

```jsx
// REACT
const [items, setItems] = useState([]);

// Add item - creates new array
setItems([...items, newItem]);

// Update item - creates new array
setItems(items.map(item => 
  item.id === id ? { ...item, done: true } : item
));
```

```tsx
// SOLIDJS - Similar for simple arrays
const [items, setItems] = createSignal([]);

setItems([...items(), newItem]);

setItems(items().map(item => 
  item.id === id ? { ...item, done: true } : item
));
```

### Complex Nested State

```jsx
// REACT - Manual immutable updates
const [state, setState] = useState({
  user: { profile: { name: 'John' } }
});

setState({
  ...state,
  user: {
    ...state.user,
    profile: {
      ...state.user.profile,
      name: 'Jane'
    }
  }
});
```

```tsx
// SOLIDJS - Use stores for nested state
import { createStore } from 'solid-js/store';

const [state, setState] = createStore({
  user: { profile: { name: 'John' } }
});

// Path-based update (much simpler)
setState('user', 'profile', 'name', 'Jane');
```

**Key difference:** SolidJS stores track nested properties; React state doesn't.

## JSX Differences

### Attribute Names

```jsx
// REACT
<div className="container">
  <label htmlFor="input">Label</label>
  <input id="input" />
</div>
```

```tsx
// SOLIDJS
<div class="container">
  <label for="input">Label</label>
  <input id="input" />
</div>
```

**Critical:** `class` not `className`, `for` not `htmlFor`

### Event Handlers

```jsx
// REACT - camelCase
<button onClick={handleClick}>Click</button>
```

```tsx
// SOLIDJS - lowercase (delegated)
<button onclick={handleClick}>Click</button>

// Or camelCase (also works)
<button onClick={handleClick}>Click</button>

// Non-delegated events use on: prefix
<div on:scroll={handleScroll}>Scrollable</div>
```

### Conditional Rendering

```jsx
// REACT - Ternary or &&
{isLoggedIn ? <Profile /> : <Login />}
{isLoggedIn && <Profile />}
```

```tsx
// SOLIDJS - Use Show component
import { Show } from 'solid-js';

<Show when={isLoggedIn()} fallback={<Login />}>
  <Profile />
</Show>
```

**Why:** More efficient, type-safe, better ergonomics

### List Rendering

```jsx
// REACT
{items.map(item => (
  <div key={item.id}>{item.name}</div>
))}
```

```tsx
// SOLIDJS - Use For component
import { For } from 'solid-js';

<For each={items()}>
  {(item) => <div>{item.name}</div>}
</For>
```

**Key differences:**
- No `key` prop needed (tracks by reference)
- Only creates/destroys changed elements
- More efficient than `.map()`

## Lifecycle

### Mounting

```jsx
// REACT
useEffect(() => {
  console.log('Mounted');
  
  return () => {
    console.log('Unmounting');
  };
}, []); // Empty array for mount only
```

```tsx
// SOLIDJS
import { onMount, onCleanup } from 'solid-js';

onMount(() => {
  console.log('Mounted');
});

onCleanup(() => {
  console.log('Unmounting');
});
```

**Key differences:**
- No dependency array
- Separate functions for mount and cleanup
- `onMount` runs after initial render

### Effects with Dependencies

```jsx
// REACT
useEffect(() => {
  console.log('Count:', count);
}, [count]); // Manual dependency array
```

```tsx
// SOLIDJS
createEffect(() => {
  console.log('Count:', count());
  // Automatic dependency tracking
});
```

### Layout Effects

```jsx
// REACT
useLayoutEffect(() => {
  // Runs synchronously after DOM mutations
}, []);
```

```tsx
// SOLIDJS
import { createRenderEffect } from 'solid-js';

createRenderEffect(() => {
  // Runs synchronously during render
});
```

## Migration Patterns

### useState → createSignal

```jsx
// Before (React)
const [count, setCount] = useState(0);
<div>{count}</div>

// After (SolidJS)
const [count, setCount] = createSignal(0);
<div>{count()}</div> // Don't forget ()
```

### useEffect → createEffect

```jsx
// Before (React)
useEffect(() => {
  console.log('Count:', count);
}, [count]);

// After (SolidJS)
createEffect(() => {
  console.log('Count:', count()); // Call as function
});
```

### useMemo → createMemo

```jsx
// Before (React)
const doubled = useMemo(() => count * 2, [count]);

// After (SolidJS)
const doubled = createMemo(() => count() * 2);
```

### Context Migration

```jsx
// Before (React)
const MyContext = React.createContext();

function Provider({ children }) {
  const [value, setValue] = useState(0);
  return (
    <MyContext.Provider value={{ value, setValue }}>
      {children}
    </MyContext.Provider>
  );
}

function Consumer() {
  const { value } = useContext(MyContext);
  return <div>{value}</div>;
}
```

```tsx
// After (SolidJS)
const MyContext = createContext();

function Provider(props) {
  const [value, setValue] = createSignal(0);
  return (
    <MyContext.Provider value={{ value, setValue }}>
      {props.children}
    </MyContext.Provider>
  );
}

function Consumer() {
  const ctx = useContext(MyContext);
  return <div>{ctx.value()}</div>; // Call as function
}
```

## Anti-Patterns Checklist

### ❌ React Patterns to NEVER Use in SolidJS

- [ ] useState, useEffect, useMemo, useCallback
- [ ] Dependency arrays
- [ ] className instead of class
- [ ] htmlFor instead of for
- [ ] Destructuring props
- [ ] Ternaries for conditional rendering
- [ ] .map() for dynamic lists
- [ ] Assuming component re-runs on state change
- [ ] Using keys on For components
- [ ] Treating signals as values (not functions)

### ✅ SolidJS Patterns to ALWAYS Use

- [ ] createSignal, createEffect, createMemo
- [ ] Automatic dependency tracking
- [ ] class and for attributes
- [ ] Referencing props (not destructuring)
- [ ] Show/For/Index components
- [ ] Calling signals as functions
- [ ] Component runs once (setup function)
- [ ] Direct DOM manipulation via reactivity

## Quick Reference

| Concept | React | SolidJS |
|---------|-------|---------|
| State | `useState` | `createSignal` |
| Effect | `useEffect` | `createEffect` |
| Memo | `useMemo` | `createMemo` |
| Callback | `useCallback` | Not needed |
| Ref | `useRef` | `let ref` |
| Context | `useContext` | `useContext` |
| Mounting | `useEffect(() => {}, [])` | `onMount` |
| Cleanup | Return from useEffect | `onCleanup` |
| Props | Plain object | Reactive getters |
| Execution | Re-runs on state change | Runs once |
| Conditionals | Ternary/&& | `<Show>` |
| Lists | `.map()` | `<For>`/`<Index>` |
| Class | `className` | `class` |
| For | `htmlFor` | `for` |

## Common Mistakes

### 1. Forgetting to Call Signals

```tsx
// ❌ WRONG
<div>{count}</div>

// ✅ CORRECT
<div>{count()}</div>
```

### 2. Using React Hooks

```tsx
// ❌ WRONG
import { useState } from 'react';

// ✅ CORRECT
import { createSignal } from 'solid-js';
```

### 3. Destructuring Props

```tsx
// ❌ WRONG
function Button({ label }) {
  return <button>{label}</button>;
}

// ✅ CORRECT
function Button(props) {
  return <button>{props.label}</button>;
}
```

### 4. Using className

```tsx
// ❌ WRONG
<div className="container" />

// ✅ CORRECT
<div class="container" />
```

### 5. Assuming Component Re-runs

```tsx
// ❌ WRONG assumption
function Component() {
  console.log('This runs on every state change'); // NO!
  return <div>Content</div>;
}

// ✅ CORRECT understanding
function Component() {
  console.log('This runs ONCE on setup'); // YES!
  
  createEffect(() => {
    console.log('This runs on state changes'); // YES!
  });
  
  return <div>Content</div>;
}
```

---

**Critical Takeaway:** SolidJS is NOT React. The fundamental execution model, reactivity system, and patterns are completely different. Applying React patterns to SolidJS will result in broken reactivity and poor performance. Always use SolidJS primitives and patterns.
