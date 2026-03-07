# SolidJS Component Patterns

## Table of Contents
- [Component Fundamentals](#component-fundamentals)
- [Props Patterns](#props-patterns)
- [JSX Compilation](#jsx-compilation)
- [Control Flow](#control-flow)
- [Lifecycle](#lifecycle)
- [Composition](#composition)
- [Advanced Patterns](#advanced-patterns)

## Component Fundamentals

### Component Definition

```typescript
import { Component } from 'solid-js';

// Functional component (preferred)
function MyComponent() {
  return <div>Hello</div>;
}

// With TypeScript type
const MyComponent: Component = () => {
  return <div>Hello</div>;
};

// With props
interface Props {
  name: string;
}

const Greeting: Component<Props> = (props) => {
  return <div>Hello, {props.name}</div>;
};
```

### Component Execution Model

**CRITICAL:** Component functions execute **EXACTLY ONCE**:

```typescript
function Counter() {
  console.log('This runs ONCE when component is created');
  
  const [count, setCount] = createSignal(0);
  
  // This is NOT re-executed when count changes
  console.log('Setup code runs once');
  
  return (
    <div>
      {/* Only this expression updates when count changes */}
      <p>{count()}</p>
      <button onClick={() => setCount(c => c + 1)}>+</button>
    </div>
  );
}
```

**Why this matters:**
- No expensive setup on every render
- Refs/variables persist across updates
- Event handlers don't need useCallback
- Component body is for setup, JSX is for rendering

### Component Types

```typescript
import { Component, ParentComponent, FlowComponent, VoidComponent } from 'solid-js';

// Component with any props
const MyComponent: Component<Props> = (props) => {
  return <div>{props.value}</div>;
};

// Component with children
const Container: ParentComponent<Props> = (props) => {
  return <div class="container">{props.children}</div>;
};

// Component that manipulates children flow
const Flow: FlowComponent<Props> = (props) => {
  return <>{props.children}</>;
};

// Component without children
const Icon: VoidComponent<Props> = (props) => {
  return <svg>{/* ... */}</svg>;
};
```

## Props Patterns

### Props Reference (CRITICAL)

**✅ CORRECT: Reference props directly**

```typescript
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

const Button: Component<ButtonProps> = (props) => {
  // Reference props - maintains reactivity
  return (
    <button 
      onClick={props.onClick}
      disabled={props.disabled}
    >
      {props.label}
    </button>
  );
};
```

**❌ WRONG: Destructuring breaks reactivity**

```typescript
const Button: Component<ButtonProps> = ({ label, onClick, disabled }) => {
  // Destructuring reads values ONCE - breaks reactivity!
  return <button onClick={onClick}>{label}</button>;
};
```

**Why:** Props are getters. Destructuring reads the value once during setup, breaking reactive tracking.

### splitProps for Separation

```typescript
import { splitProps } from 'solid-js';

interface CustomButtonProps {
  variant: 'primary' | 'secondary';
  size: 'small' | 'large';
}

const Button: Component<CustomButtonProps & JSX.ButtonHTMLAttributes<HTMLButtonElement>> = (props) => {
  // Split custom props from HTML attributes
  const [local, others] = splitProps(props, ['variant', 'size']);
  
  return (
    <button 
      class={`btn-${local.variant} btn-${local.size}`}
      {...others}
    >
      {props.children}
    </button>
  );
};
```

**Use `splitProps` for:**
- Forwarding HTML attributes
- Separating custom props from built-in props
- Maintaining reactivity while organizing props

### Optional Props and Defaults

```typescript
import { mergeProps } from 'solid-js';

interface Props {
  title: string;
  count?: number;
  enabled?: boolean;
}

const Component: Component<Props> = (props) => {
  // Merge with defaults (maintains reactivity)
  const merged = mergeProps({ count: 0, enabled: true }, props);
  
  return (
    <div>
      <h1>{merged.title}</h1>
      <p>Count: {merged.count}</p>
      <p>Enabled: {merged.enabled}</p>
    </div>
  );
};
```

### Children Patterns

```typescript
import { children } from 'solid-js';

const Wrapper: ParentComponent = (props) => {
  // Resolve children to an accessor
  const c = children(() => props.children);
  
  return (
    <div>
      <div class="header">Header</div>
      {c()}
      <div class="footer">Footer</div>
    </div>
  );
};

// Usage
<Wrapper>
  <p>Content</p>
</Wrapper>
```

**Advanced children manipulation:**

```typescript
const List: ParentComponent = (props) => {
  const c = children(() => props.children);
  
  createEffect(() => {
    const items = c.toArray(); // Convert to array
    console.log('Number of children:', items.length);
  });
  
  return <ul>{c()}</ul>;
};
```

## JSX Compilation

### JSX is NOT React JSX

**SolidJS JSX compiles to real DOM operations, not a Virtual DOM:**

```tsx
// This JSX:
<div class="container">
  <h1>{title()}</h1>
  <p>{count()}</p>
</div>

// Compiles roughly to:
const div = document.createElement('div');
div.className = 'container';

const h1 = document.createElement('h1');
h1.textContent = title();
createEffect(() => h1.textContent = title());

const p = document.createElement('p');
p.textContent = count();
createEffect(() => p.textContent = count());

div.append(h1, p);
```

**Key differences from React:**
- No Virtual DOM reconciliation
- Direct DOM manipulation
- Expressions create subscriptions
- No keys needed (except in lists)

### Attributes vs Properties

```tsx
// HTML Attributes
<div class="container" id="main" />

// DOM Properties
<input value={text()} />

// Custom Attributes
<div data-id={id()} />

// ARIA Attributes
<button aria-label="Close" />

// Boolean Attributes
<button disabled={isDisabled()} />

// Style Attribute (object or string)
<div style={{ color: textColor() }} />
<div style={`color: ${textColor()}`} />
```

### class vs className

```tsx
// ✅ CORRECT: Use 'class' in SolidJS
<div class="container" />

// ❌ WRONG: 'className' is React-specific
<div className="container" />
```

### classList for Dynamic Classes

```tsx
import { createSignal } from 'solid-js';

const Button: Component = () => {
  const [isActive, setIsActive] = createSignal(false);
  const [isDisabled, setIsDisabled] = createSignal(false);
  
  return (
    <button
      class="btn" // Static class
      classList={{
        active: isActive(), // Dynamic classes
        disabled: isDisabled(),
        'btn-primary': true
      }}
    >
      Click me
    </button>
  );
};
```

**classList patterns:**

```tsx
// Conditional class
classList={{ active: isActive() }}

// Multiple conditions
classList={{ 
  active: isActive(),
  disabled: isDisabled(),
  loading: isLoading()
}}

// Computed class names
classList={{ [computedClass()]: true }}
```

### Event Handlers

```tsx
// Native events (lowercase)
<button onClick={handleClick}>Click</button>

// Custom events (on: prefix)
<custom-element on:custom-event={handleCustom} />

// Synthetic events are delegated by default
<button onClick={(e) => console.log(e.target)}>Click</button>

// Non-delegated events (use on:)
<div on:scroll={handleScroll}>Scrollable</div>
```

**Event handler patterns:**

```tsx
const Component: Component = () => {
  // Handler in component scope (persistent)
  const handleClick = () => {
    console.log('Clicked');
  };
  
  // Handler with parameters
  const handleItemClick = (id: string) => () => {
    console.log('Item clicked:', id);
  };
  
  return (
    <>
      <button onClick={handleClick}>Click</button>
      <button onClick={handleItemClick('123')}>Item</button>
    </>
  );
};
```

### Refs

```tsx
const Component: Component = () => {
  let buttonRef!: HTMLButtonElement;
  
  onMount(() => {
    // Access DOM element after mount
    buttonRef.focus();
  });
  
  return <button ref={buttonRef}>Click</button>;
};
```

**Ref callback pattern:**

```tsx
const Component: Component = () => {
  const setRef = (el: HTMLDivElement) => {
    // Called when element is created
    console.log('Element created:', el);
  };
  
  return <div ref={setRef}>Content</div>;
};
```

## Control Flow

### Show Component

**Conditional rendering:**

```tsx
import { Show } from 'solid-js';

// Basic usage
<Show when={isLoggedIn()}>
  <UserProfile />
</Show>

// With fallback
<Show when={user()} fallback={<p>Loading...</p>}>
  <UserProfile user={user()} />
</Show>

// With callback (type narrowing)
<Show when={user()}>
  {(u) => <UserProfile user={u()} />}
</Show>
```

**Why use Show:**
- Reactively shows/hides content
- Callback provides type narrowing
- Fallback for else case
- More efficient than ternary

**❌ Avoid ternary for conditional rendering:**

```tsx
// AVOID (works but less efficient)
{isLoggedIn() ? <UserProfile /> : <Login />}

// PREFER
<Show when={isLoggedIn()} fallback={<Login />}>
  <UserProfile />
</Show>
```

### For Component

**List rendering (tracks by reference):**

```tsx
import { For } from 'solid-js';

interface Todo {
  id: string;
  text: string;
  done: boolean;
}

const TodoList: Component = () => {
  const [todos, setTodos] = createSignal<Todo[]>([...]);
  
  return (
    <For each={todos()}>
      {(todo, index) => (
        <div>
          <input type="checkbox" checked={todo.done} />
          <span>{todo.text}</span>
          <span>#{index()}</span>
        </div>
      )}
    </For>
  );
};
```

**Key features:**
- `todo` - current item (not reactive)
- `index()` - reactive index (call as function)
- Tracks by reference (efficient for objects)
- Items can move positions

**❌ Avoid .map() for lists:**

```tsx
// AVOID (works but creates all elements every time)
{todos().map(todo => <TodoItem {...todo} />)}

// PREFER (only creates/destroys changed elements)
<For each={todos()}>
  {(todo) => <TodoItem {...todo} />}
</For>
```

### Index Component

**List rendering (tracks by index):**

```tsx
import { Index } from 'solid-js';

const ColorPalette: Component = () => {
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
};
```

**Key features:**
- `color()` - reactive color (call as function)
- `index` - static index (not a function)
- Tracks by index (efficient for primitives)
- Best when values change but positions don't

**For vs Index:**

```tsx
// Use For for objects (track by reference)
const [todos, setTodos] = createSignal([{ id: 1, text: 'Buy milk' }]);
<For each={todos()}>{(todo) => <TodoItem {...todo} />}</For>

// Use Index for primitives (track by index)
const [numbers, setNumbers] = createSignal([1, 2, 3, 4, 5]);
<Index each={numbers()}>{(num) => <div>{num()}</div>}</Index>
```

### Switch/Match Components

**Multiple conditional branches:**

```tsx
import { Switch, Match } from 'solid-js';

type Status = 'loading' | 'error' | 'success';

const DataView: Component = () => {
  const [status, setStatus] = createSignal<Status>('loading');
  
  return (
    <Switch fallback={<p>Unknown state</p>}>
      <Match when={status() === 'loading'}>
        <p>Loading...</p>
      </Match>
      <Match when={status() === 'error'}>
        <p>Error occurred</p>
      </Match>
      <Match when={status() === 'success'}>
        <p>Data loaded successfully</p>
      </Match>
    </Switch>
  );
};
```

**With type narrowing:**

```tsx
<Switch>
  <Match when={data.loading}>
    <Spinner />
  </Match>
  <Match when={data.error}>
    {(err) => <ErrorDisplay error={err()} />}
  </Match>
  <Match when={data()}>
    {(d) => <DataDisplay data={d()} />}
  </Match>
</Switch>
```

### ErrorBoundary

**Catch component errors:**

```tsx
import { ErrorBoundary } from 'solid-js';

<ErrorBoundary fallback={(err, reset) => (
  <div>
    <h1>Error occurred</h1>
    <p>{err.toString()}</p>
    <button onClick={reset}>Try again</button>
  </div>
)}>
  <MyComponent />
</ErrorBoundary>
```

**Nested error boundaries:**

```tsx
<ErrorBoundary fallback={<AppError />}>
  <Header />
  <ErrorBoundary fallback={<ContentError />}>
    <Content />
  </ErrorBoundary>
  <Footer />
</ErrorBoundary>
```

## Lifecycle

### onMount

**One-time setup after initial render:**

```tsx
import { onMount } from 'solid-js';

const Component: Component = () => {
  onMount(() => {
    console.log('Component mounted');
    // Initialize third-party libraries
    // Fetch initial data
    // Set up subscriptions
  });
  
  return <div>Content</div>;
};
```

**onMount vs createEffect:**

```tsx
// ✅ Use onMount for one-time setup
onMount(() => {
  fetchData(); // Runs once
});

// ❌ Don't use createEffect for initialization
createEffect(() => {
  fetchData(); // Runs on every dependency change
});
```

### onCleanup

**Cleanup before unmount or effect re-run:**

```tsx
import { onCleanup } from 'solid-js';

const Timer: Component = () => {
  onMount(() => {
    const id = setInterval(() => console.log('Tick'), 1000);
    
    onCleanup(() => {
      clearInterval(id);
      console.log('Cleanup');
    });
  });
  
  return <div>Timer</div>;
};
```

**Cleanup in effects:**

```tsx
createEffect(() => {
  const subscription = subscribe(topic());
  
  onCleanup(() => {
    subscription.unsubscribe();
  });
});
```

### Lifecycle Order

```tsx
function Component() {
  console.log('1. Component setup');
  
  createEffect(() => {
    console.log('2. Effect runs');
  });
  
  onMount(() => {
    console.log('3. Mount runs');
  });
  
  onCleanup(() => {
    console.log('4. Cleanup on unmount');
  });
  
  return <div>Component</div>;
}

// Output order:
// 1. Component setup
// 2. Effect runs
// 3. Mount runs
// ... component lifetime ...
// 4. Cleanup on unmount
```

## Composition

### Component Composition

```tsx
// Container component
const Card: ParentComponent<{ title: string }> = (props) => {
  return (
    <div class="card">
      <h2>{props.title}</h2>
      <div class="card-content">
        {props.children}
      </div>
    </div>
  );
};

// Usage
<Card title="My Card">
  <p>Card content here</p>
</Card>
```

### Render Props

```tsx
interface ListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => JSX.Element;
}

function List<T>(props: ListProps<T>) {
  return (
    <For each={props.items}>
      {(item, index) => props.renderItem(item, index())}
    </For>
  );
}

// Usage
<List
  items={users()}
  renderItem={(user, index) => (
    <div>
      {index}. {user.name}
    </div>
  )}
/>
```

### Slot Patterns

```tsx
interface LayoutProps {
  header: JSX.Element;
  sidebar: JSX.Element;
  main: JSX.Element;
}

const Layout: Component<LayoutProps> = (props) => {
  return (
    <div class="layout">
      <header>{props.header}</header>
      <aside>{props.sidebar}</aside>
      <main>{props.main}</main>
    </div>
  );
};

// Usage
<Layout
  header={<Header />}
  sidebar={<Sidebar />}
  main={<Content />}
/>
```

## Advanced Patterns

### Higher-Order Components

```tsx
function withLogging<P>(Component: Component<P>): Component<P> {
  return (props: P) => {
    onMount(() => console.log('Component mounted'));
    onCleanup(() => console.log('Component unmounted'));
    
    return <Component {...props} />;
  };
}

// Usage
const LoggedButton = withLogging(Button);
```

### Dynamic Components

```tsx
import { Dynamic } from 'solid-js/web';

const ComponentSelector: Component = () => {
  const [componentType, setComponentType] = createSignal<'button' | 'a'>('button');
  
  return (
    <Dynamic
      component={componentType()}
      onClick={() => console.log('Clicked')}
    >
      Click me
    </Dynamic>
  );
};
```

### Portal

```tsx
import { Portal } from 'solid-js/web';

const Modal: Component = () => {
  return (
    <Portal mount={document.getElementById('modal-root')}>
      <div class="modal">
        Modal content
      </div>
    </Portal>
  );
};
```

## Best Practices

### Component Design

✅ Keep components focused (single responsibility)  
✅ Extract complex logic to custom primitives  
✅ Use TypeScript for prop interfaces  
✅ Name event handlers descriptively  
✅ Keep components under 100 lines  
✅ Use control flow components  
✅ Reference props, never destructure  
✅ Use `class` not `className`  

### Performance

✅ Event handlers in component scope  
✅ Use For/Index for lists  
✅ Memoize expensive computations  
✅ Use Show for conditionals  
✅ Split large components  
✅ Batch related updates  

### Avoid

❌ Don't destructure props or signals  
❌ Don't use `.map()` for lists  
❌ Don't use ternaries for conditionals  
❌ Don't create signals in loops  
❌ Don't use effects for derivations  
❌ Don't forget cleanup in effects  
❌ Don't use React patterns  

---

**Key Takeaway:** SolidJS components execute once to set up the reactive graph. Understanding this execution model and using the right control flow components is essential for idiomatic SolidJS code.
