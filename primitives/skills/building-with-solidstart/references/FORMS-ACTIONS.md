# SolidStart Forms and Actions Reference

Complete guide to form handling, actions, and progressive enhancement.

## Table of Contents

- [Overview](#overview)
- [Creating Actions](#creating-actions)
- [Form Submission](#form-submission)
- [Submission State](#submission-state)
- [Error Handling](#error-handling)
- [Progressive Enhancement](#progressive-enhancement)
- [Advanced Patterns](#advanced-patterns)

## Overview

Actions simplify data mutations with:
- **Integrated state management** - Automatic submission tracking
- **Automatic revalidation** - Queries revalidate after successful actions
- **Progressive enhancement** - Forms work without JavaScript

## Creating Actions

### Basic action

```tsx
import { action } from "@solidjs/router";

const createPostAction = action(async (formData: FormData) => {
  "use server";
  
  const title = formData.get("title")?.toString();
  const post = await db.posts.create({ title });
  
  return { ok: true, post };
}, "createPost");
```

**Requirements:**
- Unique name (second argument) for SSR
- Must be async or return promise
- First parameter is always `FormData` when used with forms

### With additional arguments

```tsx
const updatePostAction = action(
  async (id: string, formData: FormData) => {
    "use server";
    
    const title = formData.get("title")?.toString();
    await db.posts.update({ id }, { title });
    
    return { ok: true };
  },
  "updatePost"
);
```

### Without forms (programmatic)

```tsx
const deletePostAction = action(
  async (id: string) => {
    "use server";
    await db.posts.delete({ id });
    return { ok: true };
  },
  "deletePost"
);
```

## Form Submission

### Basic form usage

```tsx
const createPostAction = action(async (formData: FormData) => {
  "use server";
  const title = formData.get("title")?.toString();
  await db.posts.create({ title });
}, "createPost");

export default function CreatePost() {
  return (
    <form action={createPostAction} method="post">
      <input name="title" placeholder="Post title" />
      <button type="submit">Create</button>
    </form>
  );
}
```

**Critical**: Form must have `method="post"`.

### File uploads

Include `enctype="multipart/form-data"`:

```tsx
const uploadFileAction = action(async (formData: FormData) => {
  "use server";
  
  const file = formData.get("file") as File;
  const buffer = await file.arrayBuffer();
  
  // Process file...
  
  return { ok: true };
}, "uploadFile");

export default function UploadForm() {
  return (
    <form action={uploadFileAction} method="post" enctype="multipart/form-data">
      <input type="file" name="file" />
      <button type="submit">Upload</button>
    </form>
  );
}
```

### With additional arguments

Use `.with()` method:

```tsx
export default function EditPost(props: { postId: string }) {
  return (
    <form action={updatePostAction.with(props.postId)} method="post">
      <input name="title" />
      <button type="submit">Update</button>
    </form>
  );
}
```

## Submission State

### Using useSubmission

```tsx
import { useSubmission } from "@solidjs/router";

export default function CreatePost() {
  const submission = useSubmission(createPostAction);
  
  return (
    <form action={createPostAction} method="post">
      <input name="title" />
      <button disabled={submission.pending}>
        {submission.pending ? "Creating..." : "Create"}
      </button>
      
      <Show when={submission.result}>
        <p>Post created successfully!</p>
      </Show>
    </form>
  );
}
```

### Submission properties

```tsx
const submission = useSubmission(someAction);

submission.pending  // boolean - action is running
submission.result   // action return value
submission.error    // error if action threw
submission.input    // input data passed to action
```

### Multiple submissions

Track different actions separately:

```tsx
export default function PostForm() {
  const createSubmission = useSubmission(createPostAction);
  const updateSubmission = useSubmission(updatePostAction);
  
  return (
    <div>
      <form action={createPostAction} method="post">
        <button disabled={createSubmission.pending}>
          {createSubmission.pending ? "Creating..." : "Create"}
        </button>
      </form>
      
      <form action={updatePostAction.with("123")} method="post">
        <button disabled={updateSubmission.pending}>
          {updateSubmission.pending ? "Updating..." : "Update"}
        </button>
      </form>
    </div>
  );
}
```

## Error Handling

### Returning error states (recommended)

```tsx
const createPostAction = action(async (formData: FormData) => {
  "use server";
  
  const title = formData.get("title")?.toString();
  
  if (!title || title.length < 3) {
    return {
      ok: false,
      errors: { title: "Title must be at least 3 characters" }
    };
  }
  
  const post = await db.posts.create({ title });
  return { ok: true, post };
}, "createPost");

export default function CreatePost() {
  const submission = useSubmission(createPostAction);
  
  const errors = () => {
    const result = submission.result;
    return result && !result.ok ? result.errors : undefined;
  };
  
  return (
    <form action={createPostAction} method="post">
      <div>
        <input name="title" />
        <Show when={errors()?.title}>
          <p class="error">{errors()!.title}</p>
        </Show>
      </div>
      <button type="submit">Create</button>
    </form>
  );
}
```

### Field-level validation

```tsx
type FormErrors = {
  title?: string;
  content?: string;
  category?: string;
};

const createPostAction = action(async (formData: FormData) => {
  "use server";
  
  const title = formData.get("title")?.toString();
  const content = formData.get("content")?.toString();
  const category = formData.get("category")?.toString();
  
  const errors: FormErrors = {};
  
  if (!title || title.length < 3) {
    errors.title = "Title must be at least 3 characters";
  }
  
  if (!content || content.length < 10) {
    errors.content = "Content must be at least 10 characters";
  }
  
  if (!category) {
    errors.category = "Category is required";
  }
  
  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }
  
  const post = await db.posts.create({ title, content, category });
  return { ok: true, post };
}, "createPost");
```

### Server-side validation with Zod

```tsx
import { z } from "zod";

const postSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  content: z.string().min(10, "Content must be at least 10 characters"),
  category: z.string().min(1, "Category is required")
});

const createPostAction = action(async (formData: FormData) => {
  "use server";
  
  const data = {
    title: formData.get("title")?.toString(),
    content: formData.get("content")?.toString(),
    category: formData.get("category")?.toString()
  };
  
  const result = postSchema.safeParse(data);
  
  if (!result.success) {
    return {
      ok: false,
      errors: result.error.flatten().fieldErrors
    };
  }
  
  const post = await db.posts.create(result.data);
  return { ok: true, post };
}, "createPost");
```

## Progressive Enhancement

Forms work without JavaScript using standard HTTP POST:

```tsx
const loginAction = action(async (formData: FormData) => {
  "use server";
  
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  
  // Authenticate user
  const user = await authenticate(email, password);
  
  if (!user) {
    return { ok: false, error: "Invalid credentials" };
  }
  
  // Set session
  const session = await getSession({
    password: process.env.SESSION_SECRET as string
  });
  await session.update({ userId: user.id });
  
  // Redirect
  throw redirect("/dashboard");
}, "login");

export default function LoginPage() {
  return (
    <form action={loginAction} method="post">
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      <button type="submit">Login</button>
    </form>
  );
}
```

Form submits to server even without JavaScript, then:
1. Server processes action
2. Sets session cookie
3. Redirects to dashboard
4. Page loads with user logged in

## Advanced Patterns

### Optimistic UI

```tsx
const addToCartAction = action(async (formData: FormData) => {
  "use server";
  const productId = formData.get("productId")?.toString();
  await db.cart.add({ productId });
}, "addToCart");

export default function Cart() {
  const cart = createAsync(() => getCartQuery());
  const submission = useSubmission(addToCartAction);
  
  const optimisticCart = () => {
    const items = cart() ?? [];
    
    if (submission.pending) {
      const formData = submission.input[0] as FormData;
      const productId = formData.get("productId")?.toString();
      const name = formData.get("name")?.toString();
      
      if (productId && name) {
        return [...items, { id: "temp", productId, name }];
      }
    }
    
    return items;
  };
  
  return (
    <div>
      <For each={optimisticCart()}>
        {(item) => <div>{item.name}</div>}
      </For>
      
      <form action={addToCartAction} method="post">
        <input type="hidden" name="productId" value="123" />
        <input type="hidden" name="name" value="Product Name" />
        <button type="submit">Add to Cart</button>
      </form>
    </div>
  );
}
```

### Redirect after success

```tsx
import { redirect } from "@solidjs/router";

const createPostAction = action(async (formData: FormData) => {
  "use server";
  
  const title = formData.get("title")?.toString();
  const post = await db.posts.create({ title });
  
  // Redirect to the new post
  throw redirect(`/posts/${post.id}`);
}, "createPost");
```

### Revalidation control

```tsx
import { reload, json } from "@solidjs/router";

// Revalidate specific queries
const updateSettingsAction = action(async (formData: FormData) => {
  "use server";
  await db.settings.update(/* ... */);
  throw reload({ revalidate: ["settings"] });
}, "updateSettings");

// Disable revalidation
const logActivityAction = action(async (formData: FormData) => {
  "use server";
  await db.activity.log(/* ... */);
  return json({ ok: true }, { revalidate: [] });
}, "logActivity");
```

### Programmatic actions

Use `useAction` for non-form scenarios:

```tsx
import { useAction } from "@solidjs/router";

const deletePostAction = action(async (id: string) => {
  "use server";
  await db.posts.delete({ id });
}, "deletePost");

export default function PostItem(props: { post: Post }) {
  const deletePost = useAction(deletePostAction);
  
  const handleDelete = async () => {
    if (confirm("Are you sure?")) {
      await deletePost(props.post.id);
    }
  };
  
  return (
    <div>
      <h2>{props.post.title}</h2>
      <button onClick={handleDelete}>Delete</button>
    </div>
  );
}
```

### Multi-step forms

```tsx
const multiStepAction = action(async (formData: FormData) => {
  "use server";
  
  const step = formData.get("step")?.toString();
  
  if (step === "1") {
    // Validate step 1
    const name = formData.get("name")?.toString();
    if (!name) {
      return { ok: false, step: 1, errors: { name: "Required" } };
    }
    return { ok: true, step: 2 };
  }
  
  if (step === "2") {
    // Validate step 2
    const email = formData.get("email")?.toString();
    if (!email) {
      return { ok: false, step: 2, errors: { email: "Required" } };
    }
    return { ok: true, step: 3 };
  }
  
  // Final step - create user
  const name = formData.get("name")?.toString();
  const email = formData.get("email")?.toString();
  const user = await db.users.create({ name, email });
  
  throw redirect("/success");
}, "multiStep");

export default function MultiStepForm() {
  const submission = useSubmission(multiStepAction);
  const [step, setStep] = createSignal(1);
  
  createEffect(() => {
    const result = submission.result;
    if (result?.ok && result.step) {
      setStep(result.step);
    }
  });
  
  return (
    <form action={multiStepAction} method="post">
      <input type="hidden" name="step" value={step()} />
      
      <Show when={step() === 1}>
        <input name="name" placeholder="Name" />
      </Show>
      
      <Show when={step() === 2}>
        <input name="email" placeholder="Email" />
      </Show>
      
      <button type="submit">
        {step() === 2 ? "Complete" : "Next"}
      </button>
    </form>
  );
}
```

### Debounced actions

```tsx
import { debounce } from "@solid-primitives/scheduled";

const searchAction = action(async (query: string) => {
  "use server";
  return await db.posts.search(query);
}, "search");

export default function SearchForm() {
  const search = useAction(searchAction);
  const [results, setResults] = createSignal([]);
  
  const debouncedSearch = debounce(async (query: string) => {
    const data = await search(query);
    setResults(data);
  }, 300);
  
  return (
    <div>
      <input 
        onInput={(e) => debouncedSearch(e.currentTarget.value)}
        placeholder="Search..."
      />
      <For each={results()}>
        {(result) => <div>{result.title}</div>}
      </For>
    </div>
  );
}
```

## Best Practices

1. **Use HTML forms** for progressive enhancement
2. **Return structured objects** for errors, not throw
3. **Always return a value** from all code paths
4. **Use unique action names** for SSR
5. **Validate server-side** - never trust client data
6. **Use Zod or similar** for schema validation
7. **Implement optimistic UI** for better UX
8. **Handle file uploads properly** - use multipart/form-data
9. **Disable buttons during submission** - prevent double submits
10. **Provide clear error messages** - field-level feedback
