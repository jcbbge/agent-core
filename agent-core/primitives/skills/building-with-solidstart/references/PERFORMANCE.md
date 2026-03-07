# SolidStart Performance Optimization Reference

Complete guide to optimizing SolidStart applications for production.

## Table of Contents

- [Bundle Optimization](#bundle-optimization)
- [Code Splitting](#code-splitting)
- [Caching Strategies](#caching-strategies)
- [Image Optimization](#image-optimization)
- [SSR/SSG Optimization](#ssrssg-optimization)
- [Database Optimization](#database-optimization)
- [Monitoring](#monitoring)

## Bundle Optimization

### Tree shaking

Import only what you need:

```tsx
// ✅ Good: Import specific components
import { Router, Route } from "@solidjs/router";

// ❌ Bad: Import entire library
import * as SolidRouter from "@solidjs/router";
```

### Bundle analysis

Install and run bundle analyzer:

```bash
npm install -D vite-bundle-visualizer

# Add to vite.config.ts
import { visualizer } from "vite-bundle-visualizer";

export default defineConfig({
  plugins: [
    solid(),
    visualizer({ open: true })
  ]
});
```

### Vite configuration

```tsx
// app.config.ts
import { defineConfig } from "@solidjs/start/config";

export default defineConfig({
  vite: {
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ["solid-js", "@solidjs/router"],
            ui: ["./src/components/ui"]
          }
        }
      },
      chunkSizeWarningLimit: 1000
    }
  }
});
```

## Code Splitting

### Route-based splitting

Routes are automatically code-split by SolidStart:

```tsx
// Each route is a separate chunk
routes/index.tsx     → chunk-index.js
routes/about.tsx     → chunk-about.js
routes/blog/[id].tsx → chunk-blog-id.js
```

### Component-level lazy loading

```tsx
import { lazy } from "solid-js";

// Heavy component loaded on demand
const HeavyChart = lazy(() => import("./components/HeavyChart"));

export default function Dashboard() {
  return (
    <Suspense fallback={<div>Loading chart...</div>}>
      <HeavyChart />
    </Suspense>
  );
}
```

### Preloading critical routes

```tsx
// Preload on hover
function Navigation() {
  const preloadDashboard = () => {
    import("./routes/dashboard");
  };
  
  return (
    <nav>
      <a 
        href="/dashboard" 
        onMouseEnter={preloadDashboard}
        onFocus={preloadDashboard}
      >
        Dashboard
      </a>
    </nav>
  );
}
```

### Dynamic imports

```tsx
export default function App() {
  const [showModal, setShowModal] = createSignal(false);
  const [Modal, setModal] = createSignal<any>(null);
  
  const loadModal = async () => {
    const module = await import("./components/Modal");
    setModal(() => module.default);
    setShowModal(true);
  };
  
  return (
    <div>
      <button onClick={loadModal}>Open Modal</button>
      <Show when={showModal() && Modal()}>
        {(ModalComponent) => <ModalComponent() />}
      </Show>
    </div>
  );
}
```

## Caching Strategies

### HTTP caching headers

```tsx
// In API routes
export function GET() {
  return new Response(JSON.stringify(data), {
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
      "Expires": new Date(Date.now() + 3600000).toUTCString()
    }
  });
}
```

### Query caching

```tsx
import { query } from "@solidjs/router";

const getPostsQuery = query(
  async () => {
    "use server";
    return await db.posts.findMany();
  },
  "posts",
  {
    ttl: 1000 * 60 * 5, // 5 minutes
    staleWhileRevalidate: 1000 * 60 * 10 // 10 minutes
  }
);
```

### In-memory caching

```tsx
// lib/cache.ts
const cache = new Map<string, { data: any; expires: number }>();

export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl = 300000 // 5 minutes
): Promise<T> {
  const cached = cache.get(key);
  
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }
  
  const data = await fetcher();
  cache.set(key, { data, expires: Date.now() + ttl });
  
  return data;
}

// Usage
const getUsersQuery = query(async () => {
  "use server";
  return cachedFetch("users", () => db.users.findMany());
}, "users");
```

### Browser caching (service worker)

```tsx
// public/sw.js
const CACHE_NAME = "v1";
const ASSETS = ["/", "/styles/main.css", "/scripts/main.js"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
```

## Image Optimization

### Native lazy loading

```tsx
<img 
  src="/images/hero.jpg"
  alt="Hero"
  loading="lazy"
  decoding="async"
  width="800"
  height="400"
/>
```

### Responsive images

```tsx
<picture>
  <source 
    srcSet="/images/hero-small.webp 400w, /images/hero-medium.webp 800w"
    type="image/webp"
    sizes="(max-width: 768px) 100vw, 50vw"
  />
  <source 
    srcSet="/images/hero-small.jpg 400w, /images/hero-medium.jpg 800w"
    type="image/jpeg"
  />
  <img 
    src="/images/hero-medium.jpg"
    alt="Hero"
    loading="lazy"
  />
</picture>
```

### Optimized image component

```tsx
interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
}

export function OptimizedImage(props: OptimizedImageProps) {
  return (
    <img 
      src={props.src}
      alt={props.alt}
      width={props.width}
      height={props.height}
      loading={props.priority ? "eager" : "lazy"}
      decoding="async"
      style={{
        "content-visibility": props.priority ? undefined : "auto"
      }}
    />
  );
}
```

### Intersection Observer

```tsx
import { createSignal, onMount, onCleanup } from "solid-js";

export function LazyImage(props: { src: string; alt: string }) {
  let imgRef: HTMLImageElement | undefined;
  const [isVisible, setIsVisible] = createSignal(false);
  
  onMount(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    
    if (imgRef) {
      observer.observe(imgRef);
    }
    
    onCleanup(() => observer.disconnect());
  });
  
  return (
    <img 
      ref={imgRef}
      src={isVisible() ? props.src : ""}
      alt={props.alt}
    />
  );
}
```

## SSR/SSG Optimization

### Streaming SSR

```tsx
// entry-server.tsx
import { createHandler, StartServer } from "@solidjs/start/server";

export default createHandler(
  () => <StartServer document={/* ... */} />,
  {
    mode: "stream" // Enable streaming
  }
);
```

### Strategic suspense boundaries

```tsx
export default function App() {
  return (
    <div>
      {/* Critical content - renders immediately */}
      <Header />
      
      {/* Non-critical - streams when ready */}
      <Suspense fallback={<Skeleton />}>
        <DashboardData />
      </Suspense>
      
      {/* Footer - can render last */}
      <Footer />
    </div>
  );
}
```

### ISR (Incremental Static Regeneration)

```tsx
// routes/blog/[slug].tsx
export async function GET({ params }: PageProps) {
  const post = await getPost(params.slug);
  
  return json(post, {
    headers: {
      "Cache-Control": "s-maxage=86400, stale-while-revalidate=3600"
    }
  });
}
```

### Static generation

```tsx
// app.config.ts
export default defineConfig({
  ssr: true,
  prerender: {
    routes: ["/", "/about", "/contact"]
  }
});
```

## Database Optimization

### Connection pooling

```tsx
// lib/db.ts
import { createPool } from "@vercel/postgres";

const pool = createPool({
  connectionString: process.env.DATABASE_URL,
  max: 10 // Connection pool size
});

export async function query<T>(sql: string, params?: any[]) {
  const start = Date.now();
  try {
    const result = await pool.query(sql, params);
    console.log(`Query took ${Date.now() - start}ms`);
    return result.rows as T[];
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  }
}
```

### Query optimization

```tsx
// ✅ Good: Select only needed fields
const getUsersQuery = query(async () => {
  "use server";
  return await db.users.findMany({
    select: { id: true, name: true, email: true }
  });
}, "users");

// ❌ Bad: Select all fields
const getUsersQuery = query(async () => {
  "use server";
  return await db.users.findMany(); // Returns all fields
}, "users");
```

### Pagination

```tsx
const getPostsQuery = query(
  async (page: number = 1, limit: number = 10) => {
    "use server";
    const offset = (page - 1) * limit;
    
    const [posts, total] = await Promise.all([
      db.posts.findMany({ skip: offset, take: limit }),
      db.posts.count()
    ]);
    
    return { posts, total, page, limit };
  },
  "posts"
);
```

### Batch queries

```tsx
const getBatchDataQuery = query(async (userId: string) => {
  "use server";
  
  // Parallel queries
  const [user, posts, comments] = await Promise.all([
    db.users.findOne({ id: userId }),
    db.posts.findMany({ authorId: userId }),
    db.comments.findMany({ authorId: userId })
  ]);
  
  return { user, posts, comments };
}, "batchData");
```

## Monitoring

### Web Vitals tracking

```tsx
// hooks/useWebVitals.ts
import { onMount } from "solid-js";

export function useWebVitals() {
  onMount(async () => {
    if (typeof window !== "undefined") {
      const { getCLS, getFID, getFCP, getLCP, getTTFB } = await import("web-vitals");
      
      getCLS((metric) => console.log("CLS:", metric));
      getFID((metric) => console.log("FID:", metric));
      getFCP((metric) => console.log("FCP:", metric));
      getLCP((metric) => console.log("LCP:", metric));
      getTTFB((metric) => console.log("TTFB:", metric));
    }
  });
}
```

### Performance monitoring

```tsx
// lib/monitoring.ts
export function measurePerformance(name: string) {
  const start = performance.now();
  
  return {
    end: () => {
      const duration = performance.now() - start;
      console.log(`${name} took ${duration.toFixed(2)}ms`);
      
      // Send to analytics
      if (typeof window !== "undefined") {
        window.gtag?.("event", "timing_complete", {
          name,
          value: Math.round(duration)
        });
      }
    }
  };
}

// Usage
const measure = measurePerformance("loadPosts");
const posts = await getPostsQuery();
measure.end();
```

### Bundle size tracking

```tsx
// vite.config.ts
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      plugins: [
        {
          name: "bundle-size-monitor",
          generateBundle(options, bundle) {
            const size = Object.values(bundle).reduce((acc, chunk) => {
              return acc + (chunk.type === "chunk" ? chunk.code.length : 0);
            }, 0);
            
            const sizeKB = (size / 1024).toFixed(2);
            console.log(`Total bundle size: ${sizeKB} KB`);
            
            if (size > 500000) { // 500KB
              console.warn("⚠️ Bundle size exceeds 500KB!");
            }
          }
        }
      ]
    }
  }
});
```

## Best Practices Checklist

- [ ] Implement route-based code splitting
- [ ] Use lazy loading for heavy components
- [ ] Optimize images with proper formats and lazy loading
- [ ] Configure HTTP caching headers
- [ ] Use streaming SSR for better TTFB
- [ ] Implement service worker for asset caching
- [ ] Monitor Core Web Vitals
- [ ] Use database connection pooling
- [ ] Implement pagination for large datasets
- [ ] Preload critical resources
- [ ] Configure proper bundle analysis
- [ ] Track bundle sizes in CI/CD
- [ ] Use ISR for dynamic but cacheable content
- [ ] Optimize database queries
- [ ] Implement proper error tracking

## Tools

- **Lighthouse** - Web performance auditing
- **WebPageTest** - Detailed performance testing
- **Chrome DevTools** - Runtime performance analysis
- **vite-bundle-visualizer** - Bundle composition
- **web-vitals** - Core Web Vitals tracking
- **Sentry** - Error and performance monitoring
