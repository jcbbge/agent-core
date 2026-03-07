# SolidJS State Management

## Table of Contents
- [Signals vs Stores](#signals-vs-stores)
- [Store Patterns](#store-patterns)
- [Context](#context)
- [Resources](#resources)
- [Derived State](#derived-state)
- [State Patterns](#state-patterns)

## Signals vs Stores

### When to Use Signals

**Use signals for primitive values and simple state:**

```typescript
import { createSignal } from 'solid-js';

// Primitives
const [count, setCount] = createSignal(0);
const [name, setName] = createSignal('');
const [isOpen, setIsOpen] = createSignal(false);

// Arrays (if replacing entirely)
const [items, setItems] = createSignal<string[]>([]);
setItems([...items(), 'new item']); // Replace array

// Simple objects (if replacing entirely)
const [point, setPoint] = createSignal({ x: 0, y: 0 });
setPoint({ x: 10, y: 20 }); // Replace object
```

**Signal characteristics:**
- Lightweight and fast
- Immutable updates (replace entire value)
- No nested tracking
- Best for primitive values
- Simple to use

### When to Use Stores

**Use stores for nested objects with granular updates:**

```typescript
import { createStore } from 'solid-js/store';

// Nested object state
const [user, setUser] = createStore({
  profile: {
    name: 'John',
    email: 'john@example.com',
    settings: {
      theme: 'dark',
      notifications: true
    }
  },
  friends: ['Alice', 'Bob'],
  posts: []
});
```

**Store characteristics:**
- Tracks nested properties
- Mutable-style updates (immutable under the hood)
- Fine-grained reactivity
- Best for complex nested state
- Path-based updates

### Comparison

```typescript
// SIGNAL: Replace entire object
const [state, setState] = createSignal({
  name: 'John',
  email: 'john@example.com'
});

// Update requires spreading
setState({ ...state(), name: 'Jane' });

// ---

// STORE: Update nested properties
const [state, setState] = createStore({
  name: 'John',
  email: 'john@example.com'
});

// Direct property update
setState('name', 'Jane');
```

## Store Patterns

### Creating Stores

```typescript
import { createStore } from 'solid-js/store';

interface AppState {
  user: {
    name: string;
    email: string;
  };
  todos: Array<{
    id: string;
    text: string;
    done: boolean;
  }>;
  settings: {
    theme: 'light' | 'dark';
  };
}

const [state, setState] = createStore<AppState>({
  user: {
    name: '',
    email: ''
  },
  todos: [],
  settings: {
    theme: 'light'
  }
});
```

### Reading Store Values

```typescript
// Direct property access (auto-tracks)
console.log(state.user.name);

// In JSX (creates subscription)
<p>Name: {state.user.name}</p>

// In effects (tracks accessed properties)
createEffect(() => {
  console.log(state.user.name); // Tracks user.name
});
```

### Updating Stores: Path Syntax

```typescript
// Update single property
setState('user', 'name', 'Jane');

// Update nested property
setState('user', 'email', 'jane@example.com');

// Update deep nested
setState('settings', 'theme', 'dark');

// Update multiple levels
setState('todos', 0, 'done', true);

// Function updater
setState('user', 'name', (prev) => prev.toUpperCase());
```

### Array Updates

```typescript
const [state, setState] = createStore({
  todos: [
    { id: '1', text: 'Buy milk', done: false },
    { id: '2', text: 'Walk dog', done: true }
  ]
});

// Add item
setState('todos', state.todos.length, {
  id: '3',
  text: 'New task',
  done: false
});

// Update by index
setState('todos', 0, 'done', true);

// Update by condition
setState('todos', (todo) => todo.id === '1', 'done', true);

// Update all matching
setState('todos', (todo) => !todo.done, 'done', true);

// Remove item
setState('todos', (todos) => 
  todos.filter(todo => todo.id !== '1')
);
```

### produce() for Complex Updates

```typescript
import { produce } from 'solid-js/store';

// Complex updates with produce
setState(produce((draft) => {
  draft.user.name = 'Jane';
  draft.user.email = 'jane@example.com';
  draft.settings.theme = 'dark';
  draft.todos.push({
    id: '3',
    text: 'New task',
    done: false
  });
}));

// Nested array updates
setState('todos', produce((todos) => {
  const todo = todos.find(t => t.id === '1');
  if (todo) {
    todo.done = true;
  }
}));
```

### reconcile() for Data Merging

```typescript
import { reconcile } from 'solid-js/store';

// Merge new data (useful for API responses)
const newData = await fetchUserData();

setState('user', reconcile(newData));

// With options
setState('user', reconcile(newData, {
  key: 'id', // Key to match objects
  merge: true // Merge or replace
}));
```

### unwrap() for Plain Objects

```typescript
import { unwrap } from 'solid-js/store';

// Get plain JavaScript object
const plainState = unwrap(state);
console.log(plainState); // Regular object, not reactive

// Useful for logging or external APIs
localStorage.setItem('state', JSON.stringify(unwrap(state)));
```

## Context

### Creating Context

```typescript
import { createContext, useContext, ParentComponent } from 'solid-js';

// Define context type
interface ThemeContextType {
  theme: () => string;
  setTheme: (theme: string) => void;
}

// Create context
const ThemeContext = createContext<ThemeContextType>();

// Provider component
export const ThemeProvider: ParentComponent = (props) => {
  const [theme, setTheme] = createSignal('light');
  
  const value: ThemeContextType = {
    theme,
    setTheme
  };
  
  return (
    <ThemeContext.Provider value={value}>
      {props.children}
    </ThemeContext.Provider>
  );
};

// Hook for consuming context
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
```

### Using Context

```typescript
// Provide context at app level
function App() {
  return (
    <ThemeProvider>
      <Header />
      <Content />
    </ThemeProvider>
  );
}

// Consume context in child components
function Header() {
  const { theme, setTheme } = useTheme();
  
  return (
    <header>
      <p>Current theme: {theme()}</p>
      <button onClick={() => setTheme('dark')}>
        Toggle Theme
      </button>
    </header>
  );
}
```

### Context with Store

```typescript
interface AppStore {
  user: { name: string; email: string };
  isLoggedIn: boolean;
}

type AppContextType = [
  state: AppStore,
  actions: {
    login: (user: { name: string; email: string }) => void;
    logout: () => void;
  }
];

const AppContext = createContext<AppContextType>();

export const AppProvider: ParentComponent = (props) => {
  const [state, setState] = createStore<AppStore>({
    user: { name: '', email: '' },
    isLoggedIn: false
  });
  
  const actions = {
    login: (user: { name: string; email: string }) => {
      setState('user', user);
      setState('isLoggedIn', true);
    },
    logout: () => {
      setState('user', { name: '', email: '' });
      setState('isLoggedIn', false);
    }
  };
  
  return (
    <AppContext.Provider value={[state, actions]}>
      {props.children}
    </AppContext.Provider>
  );
};

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be within AppProvider');
  return context;
}
```

### Nested Contexts

```typescript
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <Content />
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

function Content() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { data } = useData();
  
  return <div>App content</div>;
}
```

## Resources

### Basic Resource

```typescript
import { createResource } from 'solid-js';

async function fetchUser(id: number) {
  const res = await fetch(`/api/users/${id}`);
  return res.json();
}

function UserProfile() {
  const [userId] = createSignal(1);
  const [user] = createResource(userId, fetchUser);
  
  return (
    <Show when={user()}>
      <div>{user().name}</div>
    </Show>
  );
}
```

### Resource State

```typescript
const [data, { refetch, mutate }] = createResource(source, fetcher);

// Resource properties
data(); // Current data (undefined while loading)
data.loading; // Boolean: is loading
data.error; // Error object if failed
data.latest; // Previous data while refetching
data.state; // 'unresolved' | 'pending' | 'ready' | 'refreshing' | 'errored'

// Methods
refetch(); // Manually refetch
mutate(newData); // Optimistically update
```

### Multiple Resources

```typescript
function Dashboard() {
  const [user] = createResource(fetchUser);
  const [posts] = createResource(fetchPosts);
  const [comments] = createResource(fetchComments);
  
  return (
    <Suspense fallback={<Loading />}>
      <Show when={user() && posts() && comments()}>
        {(data) => (
          <div>
            <UserInfo user={data().user} />
            <Posts posts={data().posts} />
            <Comments comments={data().comments} />
          </div>
        )}
      </Show>
    </Suspense>
  );
}
```

### Dependent Resources

```typescript
function UserPosts() {
  const [userId] = createSignal(1);
  const [user] = createResource(userId, fetchUser);
  
  // Depends on user being loaded
  const [posts] = createResource(
    () => user()?.id,
    async (id) => {
      const res = await fetch(`/api/users/${id}/posts`);
      return res.json();
    }
  );
  
  return (
    <Suspense fallback={<Loading />}>
      <Show when={user() && posts()}>
        <div>
          <h1>{user().name}'s Posts</h1>
          <For each={posts()}>
            {(post) => <Post {...post} />}
          </For>
        </div>
      </Show>
    </Suspense>
  );
}
```

### Resource Options

```typescript
const [data] = createResource(source, fetcher, {
  // Initial value before first fetch
  initialValue: { name: 'Loading...' },
  
  // How to handle SSR
  ssrLoadFrom: 'initial',
  
  // Custom name for debugging
  name: 'user-data',
  
  // Defer streaming (SSR optimization)
  deferStream: true
});
```

### Manual Refetch

```typescript
function RefreshableData() {
  const [data, { refetch }] = createResource(fetchData);
  
  return (
    <div>
      <button onClick={() => refetch()}>Refresh</button>
      <Suspense fallback={<Loading />}>
        <Show when={data()}>
          <DataDisplay data={data()} />
        </Show>
      </Suspense>
    </div>
  );
}
```

### Optimistic Updates

```typescript
function TodoList() {
  const [todos, { mutate, refetch }] = createResource(fetchTodos);
  
  const addTodo = async (text: string) => {
    const optimisticTodo = {
      id: Date.now().toString(),
      text,
      done: false
    };
    
    // Optimistically update UI
    mutate([...(todos() || []), optimisticTodo]);
    
    try {
      await createTodo(optimisticTodo);
      refetch(); // Sync with server
    } catch (err) {
      refetch(); // Revert on error
    }
  };
  
  return <div>...</div>;
}
```

## Derived State

### createMemo for Derivations

```typescript
const [items, setItems] = createSignal([...]);
const [filter, setFilter] = createSignal('');

// ✅ GOOD: Memo caches computation
const filteredItems = createMemo(() => {
  return items().filter(item => 
    item.name.includes(filter())
  );
});

// ❌ AVOID: Inline computation (runs on every access)
<For each={items().filter(item => item.name.includes(filter()))}>
  {(item) => <div>{item.name}</div>}
</For>
```

### Chained Memos

```typescript
const [numbers, setNumbers] = createSignal([1, 2, 3, 4, 5]);

const doubled = createMemo(() => 
  numbers().map(n => n * 2)
);

const sum = createMemo(() => 
  doubled().reduce((a, b) => a + b, 0)
);

const average = createMemo(() => 
  sum() / doubled().length
);

console.log(average()); // Cached result
```

### Computed Properties in Stores

```typescript
const [state, setState] = createStore({
  todos: [...]
});

// Computed value outside store
const completedCount = createMemo(() => 
  state.todos.filter(t => t.done).length
);

const totalCount = createMemo(() => 
  state.todos.length
);

const progress = createMemo(() => 
  totalCount() === 0 ? 0 : (completedCount() / totalCount()) * 100
);
```

## State Patterns

### Form State

```typescript
interface FormState {
  values: {
    name: string;
    email: string;
    message: string;
  };
  errors: {
    name?: string;
    email?: string;
    message?: string;
  };
  touched: {
    name: boolean;
    email: boolean;
    message: boolean;
  };
}

const [form, setForm] = createStore<FormState>({
  values: { name: '', email: '', message: '' },
  errors: {},
  touched: { name: false, email: false, message: false }
});

const handleChange = (field: keyof FormState['values']) => (e: Event) => {
  const value = (e.target as HTMLInputElement).value;
  setForm('values', field, value);
  setForm('touched', field, true);
};

const validate = () => {
  const errors: FormState['errors'] = {};
  if (!form.values.name) errors.name = 'Name required';
  if (!form.values.email) errors.email = 'Email required';
  setForm('errors', errors);
  return Object.keys(errors).length === 0;
};
```

### Pagination State

```typescript
interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  items: any[];
}

const [pagination, setPagination] = createStore<PaginationState>({
  page: 1,
  pageSize: 10,
  total: 0,
  items: []
});

const pageCount = createMemo(() => 
  Math.ceil(pagination.total / pagination.pageSize)
);

const nextPage = () => {
  if (pagination.page < pageCount()) {
    setPagination('page', p => p + 1);
  }
};

const prevPage = () => {
  if (pagination.page > 1) {
    setPagination('page', p => p - 1);
  }
};
```

### Undo/Redo State

```typescript
interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

function createHistory<T>(initialState: T) {
  const [state, setState] = createStore<HistoryState<T>>({
    past: [],
    present: initialState,
    future: []
  });
  
  const canUndo = createMemo(() => state.past.length > 0);
  const canRedo = createMemo(() => state.future.length > 0);
  
  const update = (newState: T) => {
    setState(produce((draft) => {
      draft.past.push(draft.present);
      draft.present = newState;
      draft.future = [];
    }));
  };
  
  const undo = () => {
    if (!canUndo()) return;
    setState(produce((draft) => {
      draft.future.unshift(draft.present);
      draft.present = draft.past.pop()!;
    }));
  };
  
  const redo = () => {
    if (!canRedo()) return;
    setState(produce((draft) => {
      draft.past.push(draft.present);
      draft.present = draft.future.shift()!;
    }));
  };
  
  return { state, update, undo, redo, canUndo, canRedo };
}
```

### Normalized State

```typescript
interface NormalizedState {
  users: Record<string, User>;
  posts: Record<string, Post>;
  comments: Record<string, Comment>;
  userIds: string[];
  postIds: string[];
}

const [state, setState] = createStore<NormalizedState>({
  users: {},
  posts: {},
  comments: {},
  userIds: [],
  postIds: []
});

// Add user
const addUser = (user: User) => {
  setState('users', user.id, user);
  setState('userIds', (ids) => [...ids, user.id]);
};

// Get user with posts
const getUserWithPosts = (userId: string) => {
  return createMemo(() => {
    const user = state.users[userId];
    const posts = state.postIds
      .map(id => state.posts[id])
      .filter(post => post.userId === userId);
    return { user, posts };
  });
};
```

## Best Practices

### State Organization

✅ Use signals for primitives  
✅ Use stores for nested objects  
✅ Use context for cross-component state  
✅ Use resources for async data  
✅ Use memos for derived state  
✅ Keep state close to where it's used  
✅ Normalize complex relational data  

### Performance

✅ Batch related updates  
✅ Use produce for complex store updates  
✅ Memoize expensive derivations  
✅ Use reconcile for API data merging  
✅ Unwrap stores for non-reactive operations  

### Patterns to Avoid

❌ Don't use signals for nested objects  
❌ Don't destructure store values  
❌ Don't create unnecessary memos  
❌ Don't use effects for derivations  
❌ Don't forget to handle loading/error states  
❌ Don't mutate store values directly  

---

**Key Takeaway:** Choose the right primitive for your state (signals for primitives, stores for objects, context for sharing, resources for async). Understanding when to use each primitive is critical for efficient SolidJS applications.
