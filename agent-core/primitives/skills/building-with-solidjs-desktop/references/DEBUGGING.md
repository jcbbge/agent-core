# SolidJS Debugging Guide

## Table of Contents
- [Debugging Tools](#debugging-tools)
- [Common Issues](#common-issues)
- [Debugging Techniques](#debugging-techniques)
- [Error Handling](#error-handling)
- [Dev Tools](#dev-tools)

## Debugging Tools

### console.log in Reactive Context

```typescript
import { createSignal, createEffect } from 'solid-js';

const [count, setCount] = createSignal(0);

// ✅ Use createEffect to log reactive changes
createEffect(() => {
  console.log('Count changed:', count());
});

// ❌ This only logs once (component runs once)
console.log('Count:', count());
```

### createEffect for Debugging

**Track when signals change:**

```typescript
const [user, setUser] = createSignal({ name: 'John', age: 30 });

createEffect(() => {
  console.log('User updated:', user());
});

setUser({ name: 'Jane', age: 31 });
// Logs: User updated: { name: 'Jane', age: 31 }
```

**Track with previous value:**

```typescript
createEffect((prev) => {
  const current = count();
  console.log(`Count: ${prev} → ${current}`);
  return current;
}, 0); // Initial value for prev
```

### createMemo for Debugging Computations

**Track when memos recompute:**

```typescript
const [items, setItems] = createSignal([...]);
const [filter, setFilter] = createSignal('');

const filteredItems = createMemo(() => {
  console.log('Filtering items...'); // Logs when recomputed
  return items().filter(item => item.name.includes(filter()));
});

console.log(filteredItems()); // Use memo result
setFilter('new'); // Logs: "Filtering items..."
console.log(filteredItems()); // Returns cached result (no log)
```

### untrack for Logging Without Tracking

```typescript
import { untrack } from 'solid-js';

createEffect(() => {
  console.log('Value:', value());
  
  // Log other signals without tracking them
  console.log('Debug info:', untrack(() => ({
    otherValue: otherValue(),
    timestamp: Date.now()
  })));
});
```

### on() for Targeted Debugging

**Debug specific dependencies:**

```typescript
import { on } from 'solid-js';

const [a, setA] = createSignal(1);
const [b, setB] = createSignal(2);
const [c, setC] = createSignal(3);

// Only log when 'a' changes
createEffect(on(a, (value, prev) => {
  console.log(`a changed: ${prev} → ${value}`);
  console.log('b:', b()); // Can read, but won't trigger on b changes
  console.log('c:', c());
}));

setB(10); // No log
setA(5); // Logs: "a changed: 1 → 5"
```

## Common Issues

### Issue: Props Not Updating

**Problem:** Destructured props don't update

```typescript
// ❌ WRONG: Destructuring breaks reactivity
const Button = ({ label, onClick }) => {
  return <button onClick={onClick}>{label}</button>;
};
```

**Solution:** Reference props directly

```typescript
// ✅ CORRECT: Reference props
const Button = (props) => {
  return <button onClick={props.onClick}>{props.label}</button>;
};
```

**Debugging:**

```typescript
const Button = (props) => {
  createEffect(() => {
    console.log('Label updated:', props.label);
  });
  
  return <button onClick={props.onClick}>{props.label}</button>;
};
```

### Issue: Effect Not Running

**Problem:** Effect doesn't run when expected

```typescript
const [count, setCount] = createSignal(0);

// ❌ Effect doesn't track count (not called as function)
createEffect(() => {
  console.log('Count:', count); // Missing ()
});
```

**Solution:** Call signals as functions

```typescript
// ✅ CORRECT: Call count as function
createEffect(() => {
  console.log('Count:', count()); // With ()
});
```

**Debugging:**

```typescript
createEffect(() => {
  console.log('Effect running');
  const value = count();
  console.log('Tracked value:', value);
});
```

### Issue: Effect Running Too Often

**Problem:** Effect runs more than expected

```typescript
const [a, setA] = createSignal(1);
const [b, setB] = createSignal(2);

// Tracks both a and b
createEffect(() => {
  console.log('a:', a());
  console.log('b:', b());
});

setB(3); // Effect runs (but we only care about 'a')
```

**Solution:** Use on() to limit dependencies

```typescript
// Only track 'a'
createEffect(on(a, () => {
  console.log('a:', a());
  console.log('b (untracked):', b());
}));

setB(3); // Effect doesn't run
setA(2); // Effect runs
```

### Issue: Infinite Effect Loop

**Problem:** Effect triggers itself

```typescript
const [value, setValue] = createSignal(0);

// ❌ INFINITE LOOP
createEffect(() => {
  setValue(value() + 1); // Reads value, updates value
});
```

**Solution:** Use untrack or fix logic

```typescript
// ✅ Option 1: untrack the read
createEffect(() => {
  const current = untrack(value);
  setValue(current + 1);
});

// ✅ Option 2: Fix logic (don't update in effect)
const increment = () => setValue(v => v + 1);
```

**Debugging:**

```typescript
let runCount = 0;

createEffect(() => {
  runCount++;
  console.log('Effect run #', runCount);
  
  if (runCount > 10) {
    throw new Error('Infinite loop detected!');
  }
  
  // Your effect logic
});
```

### Issue: Store Updates Not Reflecting

**Problem:** Store property updates don't trigger UI

```typescript
const [state, setState] = createStore({ count: 0 });

// ❌ Direct mutation doesn't work
state.count = 5;
```

**Solution:** Use setState

```typescript
// ✅ Use setState
setState('count', 5);

// Or with path
setState('user', 'profile', 'name', 'Jane');

// Or with produce
import { produce } from 'solid-js/store';
setState(produce((draft) => {
  draft.count = 5;
}));
```

**Debugging:**

```typescript
createEffect(() => {
  console.log('Store count:', state.count);
});

setState('count', 5); // Logs: "Store count: 5"
```

## Debugging Techniques

### Debugging Reactive Dependencies

**Find what an effect tracks:**

```typescript
const deps = [];

createEffect(() => {
  console.log('=== Effect Run ===');
  
  console.log('firstName:', firstName());
  deps.push('firstName');
  
  console.log('lastName:', lastName());
  deps.push('lastName');
  
  console.log('Tracked dependencies:', deps);
  deps.length = 0;
});
```

### Debugging Component Lifecycle

```typescript
function Component() {
  console.log('1. Component setup');
  
  onMount(() => {
    console.log('2. Component mounted');
  });
  
  createEffect(() => {
    console.log('3. Effect running');
  });
  
  onCleanup(() => {
    console.log('4. Component cleaning up');
  });
  
  return <div>Component</div>;
}
```

### Debugging Signal Updates

```typescript
// Wrapper to log signal updates
function createDebugSignal<T>(name: string, initialValue: T) {
  const [get, set] = createSignal<T>(initialValue);
  
  return [
    get,
    (value: T | ((prev: T) => T)) => {
      const prev = get();
      set(value);
      const next = get();
      console.log(`[${name}] ${JSON.stringify(prev)} → ${JSON.stringify(next)}`);
    }
  ] as const;
}

// Usage
const [count, setCount] = createDebugSignal('count', 0);

setCount(5);
// Logs: [count] 0 → 5
```

### Debugging Store Updates

```typescript
// Wrapper to log store updates
function createDebugStore<T extends object>(name: string, initialValue: T) {
  const [get, set] = createStore<T>(initialValue);
  
  return [
    get,
    (...args: any[]) => {
      console.log(`[${name}] setState called with:`, args);
      set(...args);
    }
  ] as const;
}

// Usage
const [state, setState] = createDebugStore('app', { count: 0 });

setState('count', 5);
// Logs: [app] setState called with: ['count', 5]
```

### Debugging Render Counts

```typescript
function Component() {
  const renderCount = { current: 0 };
  
  createRenderEffect(() => {
    renderCount.current++;
    console.log(`Component rendered ${renderCount.current} times`);
  });
  
  return <div>Component</div>;
}
```

### Conditional Breakpoints

```typescript
createEffect(() => {
  const value = count();
  
  // Breakpoint when value reaches 10
  if (value === 10) {
    debugger;
  }
  
  console.log('Value:', value);
});
```

## Error Handling

### ErrorBoundary Component

```typescript
import { ErrorBoundary } from 'solid-js';

function App() {
  return (
    <ErrorBoundary 
      fallback={(err, reset) => (
        <div>
          <h1>Something went wrong</h1>
          <pre>{err.toString()}</pre>
          <button onClick={reset}>Try again</button>
        </div>
      )}
    >
      <MyComponent />
    </ErrorBoundary>
  );
}
```

### Custom Error Logging

```typescript
<ErrorBoundary 
  fallback={(err, reset) => {
    // Log error to monitoring service
    console.error('App error:', err);
    logErrorToService(err);
    
    return (
      <div>
        <h1>Error occurred</h1>
        <button onClick={reset}>Retry</button>
      </div>
    );
  }}
>
  <App />
</ErrorBoundary>
```

### Nested Error Boundaries

```typescript
function App() {
  return (
    <ErrorBoundary fallback={<AppLevelError />}>
      <Header />
      
      <ErrorBoundary fallback={<ContentError />}>
        <Content />
      </ErrorBoundary>
      
      <Footer />
    </ErrorBoundary>
  );
}
```

### Resource Error Handling

```typescript
const [data, { refetch }] = createResource(fetchData);

<Show when={data.error}>
  <div>
    <p>Error: {data.error.message}</p>
    <button onClick={() => refetch()}>Retry</button>
  </div>
</Show>

<Suspense fallback={<Loading />}>
  <Show when={data()}>
    <DataDisplay data={data()} />
  </Show>
</Suspense>
```

### Try-Catch in Effects

```typescript
createEffect(() => {
  try {
    const result = dangerousOperation(value());
    console.log('Success:', result);
  } catch (err) {
    console.error('Effect error:', err);
    setError(err);
  }
});
```

## Dev Tools

### SolidJS DevTools Extension

**Installation:**

```bash
# Chrome/Edge
https://chrome.google.com/webstore → "Solid DevTools"

# Firefox
https://addons.mozilla.org → "Solid DevTools"
```

**Features:**
- Component tree inspection
- Signal values
- Effect tracking
- Performance profiling
- Time-travel debugging (experimental)

**Usage:**

1. Open browser DevTools
2. Click "Solid" tab
3. Inspect component tree
4. View signal values
5. Track effects

### Browser DevTools Integration

**Component names in DevTools:**

```typescript
// Named function (better DevTools display)
function MyComponent() {
  return <div>My Component</div>;
}

// vs anonymous (harder to debug)
const MyComponent = () => {
  return <div>My Component</div>;
};
```

**React DevTools (Limited Support):**

SolidJS can integrate with React DevTools:

```typescript
import { attachDevtools } from 'solid-devtools';

// In development only
if (import.meta.env.DEV) {
  attachDevtools();
}
```

### Development Mode Checks

```typescript
// DEV mode utilities
import { DEV } from 'solid-js';

if (DEV) {
  // Development-only code
  console.log('Running in development mode');
}
```

### Custom Debug Utilities

**Signal tracer:**

```typescript
function traceSignal<T>(name: string, signal: () => T) {
  createEffect(() => {
    console.log(`[${name}] →`, signal());
  });
}

const [count, setCount] = createSignal(0);
traceSignal('count', count);

setCount(5); // Logs: [count] → 5
```

**Effect counter:**

```typescript
function countEffectRuns(name: string, fn: () => void) {
  let runs = 0;
  createEffect(() => {
    runs++;
    console.log(`[${name}] Run #${runs}`);
    fn();
  });
}

countEffectRuns('myEffect', () => {
  console.log('Count:', count());
});
```

## Debugging Checklist

### Component Not Rendering

- [ ] Is component properly exported?
- [ ] Is component imported correctly?
- [ ] Are props being passed?
- [ ] Is parent component rendering?
- [ ] Check console for errors

### Signal Not Updating UI

- [ ] Are you calling signal as function? `count()`
- [ ] Is signal used in JSX expression? `{count()}`
- [ ] Did you destructure props/signals?
- [ ] Check effect is running with console.log

### Effect Not Running

- [ ] Are dependencies called as functions?
- [ ] Is effect actually created (not in conditional)?
- [ ] Check with console.log inside effect
- [ ] Use on() if dependencies unclear

### Store Not Updating

- [ ] Using setState (not direct mutation)?
- [ ] Correct path syntax?
- [ ] Using produce for complex updates?
- [ ] Check effect tracks store property

### Performance Issues

- [ ] Use createMemo for expensive computations
- [ ] Use For/Index for lists (not .map())
- [ ] Batch related updates
- [ ] Profile with DevTools
- [ ] Check for infinite effect loops

## Common Debugging Patterns

### Log Component Lifecycle

```typescript
function Component() {
  console.log('[Component] Setup');
  
  onMount(() => console.log('[Component] Mounted'));
  onCleanup(() => console.log('[Component] Cleanup'));
  
  return <div>Component</div>;
}
```

### Log All Signal Changes

```typescript
createEffect(() => {
  console.log('Signals:', {
    count: count(),
    name: name(),
    isOpen: isOpen()
  });
});
```

### Conditional Logging

```typescript
const [debugMode, setDebugMode] = createSignal(false);

createEffect(() => {
  if (debugMode()) {
    console.log('Debug info:', {
      value: value(),
      timestamp: Date.now()
    });
  }
});
```

### Stack Trace on Signal Change

```typescript
const [value, setValue] = createSignal(0);

const wrappedSet = (v: any) => {
  console.trace('Signal updated');
  setValue(v);
};
```

## Best Practices

### Development vs Production

```typescript
// Debug logging only in development
if (import.meta.env.DEV) {
  createEffect(() => {
    console.log('Count:', count());
  });
}

// Remove debug code in production builds
const DEBUG = import.meta.env.DEV;

if (DEBUG) {
  // Expensive debugging
}
```

### Informative Error Messages

```typescript
// ❌ Generic error
throw new Error('Invalid');

// ✅ Descriptive error
throw new Error(`Invalid user ID: expected string, got ${typeof userId}`);
```

### Type Safety

```typescript
// Use TypeScript for better errors
interface Props {
  count: number;
  onUpdate: (count: number) => void;
}

const Component: Component<Props> = (props) => {
  // TypeScript catches type errors
  props.onUpdate('5'); // Error: Argument of type 'string' not assignable to 'number'
  
  return <div>{props.count}</div>;
};
```

---

**Key Takeaway:** Use createEffect for debugging reactive changes, untrack for logging without tracking, and ErrorBoundary for graceful error handling. SolidJS DevTools provides powerful inspection capabilities.
