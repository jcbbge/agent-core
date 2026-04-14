---
name: building-with-solidjs
description: Build SolidJS applications using fine-grained reactivity, reactive primitives (signals, effects, memos, stores), and component patterns. Use when creating SolidJS components, working with reactive state, implementing JSX patterns, optimizing performance, or debugging SolidJS apps. Critical for avoiding React-trained LLM patterns that don't apply to SolidJS.
metadata:
  author: JR
  version: "1.0"
---

# Building with SolidJS

## Version Notice

**If the project has `solid-js ^2.x` in `package.json`, or imports from `@solidjs/web`, also load the `solidjs-2.0` skill.** It covers breaking changes and new primitives — everything in this skill is still valid in 2.0 where not explicitly overridden there.

## When to use this skill

Use this skill for ANY JavaScript/TypeScript front-end development work in SolidJS projects:
- Creating components with reactive primitives
- Implementing fine-grained reactivity with signals, effects, and memos
- Working with JSX in SolidJS (fundamentally different from React)
- Managing state with signals, stores, context, and resources
- Optimizing component performance
- Debugging reactive flows
- Avoiding React patterns that don't apply

**Trigger contexts:** Component creation, reactive state management, JSX patterns, performance optimization, debugging reactive systems.

## Critical Foundation: SolidJS ≠ React

**SolidJS uses fine-grained reactivity, NOT a Virtual DOM.** This fundamental difference means:

1. **Components execute EXACTLY ONCE** - they are NOT functions that re-run on state changes
2. **Reactivity happens through reactive primitives** - signals, effects, memos create subscriptions
3. **JSX compiles to real DOM operations** - no diffing, no reconciliation
4. **Props must be referenced, never destructured** - destructuring breaks reactivity
5. **No `useState`, `useEffect`, or other React hooks** - completely different primitives

> **For LLMs trained on React:** See [REACT_VS_SOLID.md](references/REACT_VS_SOLID.md) for critical differences.

## Quick Start: Core Patterns

### Reactive Primitives

```typescript
import { createSignal, createEffect, createMemo } from 'solid-js';

function Counter() {
  // Signal: [getter, setter] - both are FUNCTIONS
  const [count, setCount] = createSignal(0);
  
  // Access with count(), update with setCount()
  const increment = () => setCount(count() + 1);
  
  // Memo: cached computed value
  const doubled = createMemo(() => count() * 2);
  
  // Effect: runs when dependencies change
  createEffect(() => {
    console.log('Count changed:', count());
  });
  
  // JSX: expressions create subscriptions
  return (
    <div>
      <p>Count: {count()}</p>
      <p>Doubled: {doubled()}</p>
      <button onClick={increment}>+1</button>
    </div>
  );
}
```

**Key points:**
- Signal getters/setters are functions: `count()` not `count`
- Component body runs once - reactivity in JSX expressions
- Memos cache expensive computations
- Effects track dependencies automatically

### Props Reference Pattern

```typescript
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

// ✅ CORRECT: Reference props
function Button(props: ButtonProps) {
  return (
    <button 
      onClick={props.onClick}
      disabled={props.disabled}
    >
      {props.label}
    </button>
  );
}

// ❌ WRONG: Destructuring breaks reactivity
function Button({ label, onClick, disabled }: ButtonProps) {
  // This breaks reactivity - don't do this!
  return <button onClick={onClick}>{label}</button>;
}
```

**Why:** Props are reactive getters. Destructuring reads the value once and breaks tracking.

### Control Flow Components

Use SolidJS control flow components, NOT ternaries or `.map()`:

```typescript
import { Show, For, Switch, Match, Index } from 'solid-js';

function TodoList() {
  const [todos, setTodos] = createSignal([
    { id: 1, text: 'Learn SolidJS', done: false },
    { id: 2, text: 'Build app', done: false }
  ]);
  
  return (
    <div>
      {/* Conditional rendering */}
      <Show when={todos().length > 0} fallback={<p>No todos</p>}>
        <ul>
          {/* List rendering - use For for objects */}
          <For each={todos()}>
            {(todo) => (
              <li>
                <Show when={todo.done}>✓</Show>
                {todo.text}
              </li>
            )}
          </For>
        </ul>
      </Show>
      
      {/* Multiple conditions */}
      <Switch fallback={<p>Unknown state</p>}>
        <Match when={todos().every(t => t.done)}>
          <p>All done!</p>
        </Match>
        <Match when={todos().some(t => t.done)}>
          <p>In progress</p>
        </Match>
      </Switch>
    </div>
  );
}
```

**Component choice:**
- `<Show>` - conditional rendering (boolean condition)
- `<For>` - list rendering when items can move (tracks by reference)
- `<Index>` - list rendering when index is stable (tracks by index)
- `<Switch>/<Match>` - multiple conditions (like switch statement)

### State Management: Signals vs Stores

**Use signals for primitive values:**
```typescript
const [count, setCount] = createSignal(0);
const [name, setName] = createSignal('');
const [isOpen, setIsOpen] = createSignal(false);

// Update: direct value or function
setCount(5);
setCount(c => c + 1);
```

**Use stores for nested objects:**
```typescript
import { createStore } from 'solid-js/store';

const [user, setUser] = createStore({
  profile: {
    name: 'John',
    email: 'john@example.com'
  },
  settings: {
    theme: 'dark'
  }
});

// Access: direct property access (auto-tracks)
console.log(user.profile.name);

// Update: path syntax
setUser('profile', 'name', 'Jane');

// Update: produce for complex changes
import { produce } from 'solid-js/store';
setUser(produce(u => {
  u.profile.name = 'Jane';
  u.profile.email = 'jane@example.com';
}));
```

**Key difference:** Stores track nested property access; signals don't.

### Async Data with Resources

```typescript
import { createResource, Suspense } from 'solid-js';

async function fetchUser(id: number) {
  const res = await fetch(`/api/users/${id}`);
  return res.json();
}

function UserProfile() {
  const [userId, setUserId] = createSignal(1);
  
  // Resource automatically refetches when userId changes
  const [user] = createResource(userId, fetchUser);
  
  return (
    <div>
      <button onClick={() => setUserId(userId() + 1)}>Next User</button>
      
      {/* Suspense handles loading state */}
      <Suspense fallback={<p>Loading...</p>}>
        <Show when={user()}>
          <h1>{user().name}</h1>
          <p>{user().email}</p>
        </Show>
      </Suspense>
      
      {/* Resource state */}
      <Show when={user.error}>
        <p>Error: {user.error}</p>
      </Show>
    </div>
  );
}
```

**Resource features:**
- `user()` - latest data (undefined while loading)
- `user.loading` - boolean loading state
- `user.error` - error if fetch failed
- `user.latest` - previous data while refetching

## Component Patterns

### Component Structure

```typescript
// Component file: TodoItem.tsx
import { Component, Show } from 'solid-js';
import styles from './TodoItem.module.css';

interface TodoItemProps {
  id: string;
  text: string;
  done: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

// Use Component type for better inference
const TodoItem: Component<TodoItemProps> = (props) => {
  // Event handlers in component scope
  const handleToggle = () => props.onToggle(props.id);
  const handleDelete = () => props.onDelete(props.id);
  
  return (
    <div class={styles.item} classList={{ [styles.done]: props.done }}>
      <input 
        type="checkbox" 
        checked={props.done}
        onChange={handleToggle}
      />
      <span>{props.text}</span>
      <button onClick={handleDelete}>Delete</button>
    </div>
  );
};

export default TodoItem;
```

**Patterns:**
- TypeScript interface for props
- Event handlers as named functions in component scope
- Pass handlers as references: `onClick={handleClick}` not `onClick={() => handleClick()}`
- Use `class` not `className`
- Use `classList` for conditional classes

### Lifecycle & Effects

```typescript
import { onMount, onCleanup, createEffect } from 'solid-js';

function Component() {
  // onMount: runs once after initial render
  onMount(() => {
    console.log('Component mounted');
    // No return, use onCleanup separately
  });
  
  // onCleanup: cleanup function
  onCleanup(() => {
    console.log('Component will unmount');
  });
  
  // createEffect: reactive side effect
  const [data, setData] = createSignal(null);
  createEffect(() => {
    console.log('Data changed:', data());
  });
  
  return <div>Component</div>;
}
```

**Key points:**
- `onMount` for one-time setup (NOT `createEffect`)
- `onCleanup` for cleanup (subscriptions, timers, etc.)
- `createEffect` for reactive side effects

### Context for Cross-Component State

```typescript
import { createContext, useContext, ParentComponent } from 'solid-js';

// Create context
const ThemeContext = createContext<() => string>();

// Provider component
export const ThemeProvider: ParentComponent = (props) => {
  const [theme, setTheme] = createSignal('light');
  
  return (
    <ThemeContext.Provider value={theme}>
      {props.children}
    </ThemeContext.Provider>
  );
};

// Consumer component
function ThemedButton() {
  const theme = useContext(ThemeContext);
  
  return (
    <button style={{ background: theme() === 'dark' ? '#000' : '#fff' }}>
      Button
    </button>
  );
}
```

**Context pattern:**
1. Create context with `createContext()`
2. Provide value with `<Context.Provider>`
3. Consume with `useContext(Context)`

## Performance Optimization

### Memoization

```typescript
import { createMemo, untrack } from 'solid-js';

function ExpensiveList() {
  const [items, setItems] = createSignal([...]);
  const [filter, setFilter] = createSignal('');
  
  // Memo: only recomputes when dependencies change
  const filteredItems = createMemo(() => {
    const filterValue = filter().toLowerCase();
    return items().filter(item => 
      item.name.toLowerCase().includes(filterValue)
    );
  });
  
  // untrack: access without creating dependency
  createEffect(() => {
    console.log('Filter changed:', filter());
    console.log('Items count (untracked):', untrack(items).length);
  });
  
  return (
    <For each={filteredItems()}>
      {(item) => <div>{item.name}</div>}
    </For>
  );
}
```

**Use `createMemo` when:**
- Computation is expensive
- Result is used in multiple places
- Want to avoid redundant calculations

### Batching Updates

```typescript
import { batch } from 'solid-js';

function UserProfile() {
  const [name, setName] = createSignal('');
  const [email, setEmail] = createSignal('');
  const [phone, setPhone] = createSignal('');
  
  const updateProfile = (data) => {
    // Batch: only triggers one update
    batch(() => {
      setName(data.name);
      setEmail(data.email);
      setPhone(data.phone);
    });
  };
  
  return <div>...</div>;
}
```

**Use `batch` when:** Multiple related signals update together.

### Event Handler Performance

```typescript
// ✅ GOOD: Handler in component scope
function Component() {
  const handleClick = (e) => {
    console.log('Clicked', e.target);
  };
  
  return <button onClick={handleClick}>Click</button>;
}

// ❌ AVOID: Inline arrow function (creates new function each time)
function Component() {
  return <button onClick={(e) => console.log('Clicked')}>Click</button>;
}
```

### For vs Index

```typescript
import { For, Index } from 'solid-js';

// Use For when items can move positions
function TodoList() {
  const [todos, setTodos] = createSignal([...]);
  
  return (
    <For each={todos()}>
      {(todo) => <TodoItem {...todo} />}
    </For>
  );
}

// Use Index when index is stable but values change
function ColorPalette() {
  const [colors, setColors] = createSignal(['#f00', '#0f0', '#00f']);
  
  return (
    <Index each={colors()}>
      {(color, index) => (
        <div style={{ background: color() }}>
          Color {index}
        </div>
      )}
    </Index>
  );
}
```

**Key difference:**
- `<For>` - tracks by reference, best for objects that move
- `<Index>` - tracks by index, best for stable positions

## Styling

### CSS Modules

```typescript
import styles from './Button.module.css';

function Button() {
  const [isActive, setIsActive] = createSignal(false);
  
  return (
    <button 
      class={styles.button}
      classList={{ 
        [styles.active]: isActive(),
        [styles.disabled]: false
      }}
    >
      Click me
    </button>
  );
}
```

**Styling patterns:**
- `class` - static classes (NOT `className`)
- `classList` - dynamic classes (object with boolean values)
- `style` - inline styles (object with camelCase or "dash-case" properties)

## Common Patterns

### Derived State

```typescript
// ✅ GOOD: Use createMemo for derived state
const doubled = createMemo(() => count() * 2);

// ❌ AVOID: Computing in JSX (recomputes on every access)
return <div>{count() * 2}</div>;
```

### Conditional Effects

```typescript
import { on } from 'solid-js';

function Component() {
  const [count, setCount] = createSignal(0);
  const [name, setName] = createSignal('');
  
  // Effect runs when count changes (not name)
  createEffect(on(count, (value, prev) => {
    console.log(`Count: ${prev} → ${value}`);
  }));
  
  return <div>...</div>;
}
```

**Use `on()` to:** Limit effect dependencies to specific signals.

### Error Boundaries

```typescript
import { ErrorBoundary } from 'solid-js';

function App() {
  return (
    <ErrorBoundary fallback={(err) => (
      <div>
        <h1>Something went wrong</h1>
        <p>{err.toString()}</p>
      </div>
    )}>
      <MyComponent />
    </ErrorBoundary>
  );
}
```

## Detailed References

For in-depth coverage of specific topics:

- **[REACTIVITY.md](references/REACTIVITY.md)** - Fine-grained reactivity system, reactive primitives mental model, dependency tracking
- **[COMPONENTS.md](references/COMPONENTS.md)** - Component patterns, JSX compilation, control flow, lifecycle
- **[STATE.md](references/STATE.md)** - State management strategies, signals vs stores, context, resources
- **[PERFORMANCE.md](references/PERFORMANCE.md)** - Optimization techniques, profiling, best practices
- **[DEBUGGING.md](references/DEBUGGING.md)** - Debugging tools, patterns, common issues
- **[REACT_VS_SOLID.md](references/REACT_VS_SOLID.md)** - Critical differences, anti-patterns to avoid

## TypeScript Integration

SolidJS has excellent TypeScript support:

```typescript
import { Component, JSX } from 'solid-js';

// Component with typed props
interface Props {
  title: string;
  count: number;
  onUpdate?: (count: number) => void;
}

const MyComponent: Component<Props> = (props) => {
  return <div>{props.title}: {props.count}</div>;
};

// Generic component
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => JSX.Element;
}

function List<T>(props: ListProps<T>) {
  return (
    <For each={props.items}>
      {(item) => props.renderItem(item)}
    </For>
  );
}
```

**Key types:**
- `Component<Props>` - component type
- `JSX.Element` - JSX return type
- `ParentComponent` - component with children
- Generic components work naturally with TypeScript

## Code Organization

```
src/
├── components/
│   ├── ui/              # Reusable UI components
│   │   ├── Button.tsx
│   │   └── Button.module.css
│   └── features/        # Feature-specific components
│       └── TodoList/
│           ├── TodoList.tsx
│           ├── TodoItem.tsx
│           └── TodoList.module.css
├── primitives/          # Custom reactive primitives
│   ├── createLocalStorage.ts
│   └── createPagination.ts
├── contexts/            # Context providers
│   └── ThemeContext.tsx
└── utils/               # Utilities
    └── helpers.ts
```

**Organization principles:**
- Group related components
- CSS modules alongside components
- Custom primitives use `create` prefix
- Keep files focused (under 100 lines)

## Best Practices Checklist

- [ ] Components execute once - reactivity in JSX
- [ ] Signals called as functions: `count()` not `count`
- [ ] Props referenced, never destructured
- [ ] Control flow components instead of ternaries/map
- [ ] Memos for expensive computations
- [ ] Stores for nested objects, signals for primitives
- [ ] Event handlers in component scope
- [ ] `class` not `className`
- [ ] `createEffect` for side effects, `onMount` for setup
- [ ] Error boundaries around complex components
- [ ] Resources for async data with Suspense

## Next Steps

1. Review [REACTIVITY.md](references/REACTIVITY.md) for deep understanding of SolidJS's reactivity system
2. Check [REACT_VS_SOLID.md](references/REACT_VS_SOLID.md) to avoid React-trained patterns
3. Explore [PERFORMANCE.md](references/PERFORMANCE.md) for optimization strategies
4. Reference [DEBUGGING.md](references/DEBUGGING.md) when troubleshooting reactive flows

---

**Remember:** SolidJS is fundamentally different from React. The component executes once, reactivity happens through primitives, and JSX compiles to real DOM operations. Understanding this mental model is critical to writing idiomatic SolidJS code.
