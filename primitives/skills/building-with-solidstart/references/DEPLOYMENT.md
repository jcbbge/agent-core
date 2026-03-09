# SolidStart Deployment Reference

Complete platform-specific deployment guides for SolidStart applications.

## Table of Contents

- [Cloudflare Pages](#cloudflare-pages)
- [Vercel](#vercel)
- [Netlify](#netlify)
- [AWS with SST](#aws-with-sst)
- [Node.js](#nodejs)
- [General Configuration](#general-configuration)

## Cloudflare Pages

Excellent performance with global CDN and edge computing.

### Quick setup with C3

```bash
npm create cloudflare@latest my-app -- framework=solid

# Follow prompts:
# - Select starter template
# - Enable SSR: yes
# - TypeScript: yes/no
```

### Manual configuration

Configure in `app.config.ts`:

```tsx
import { defineConfig } from "@solidjs/start/config";

export default defineConfig({
  server: {
    preset: "cloudflare-pages",
    rollupConfig: {
      external: ["node:async_hooks"]
    }
  }
});
```

Add to `wrangler.toml`:

```toml
compatibility_flags = ["nodejs_compat"]
```

### Deploy via dashboard

1. Go to Cloudflare Dashboard → Workers & Pages
2. Select **Create application** → **Pages** tab
3. Choose **Import an existing Git repository**
4. Configure build settings:
   - **Production branch**: `main`
   - **Build command**: `npm run build`
   - **Build directory**: `dist`
5. Click **Deploy**

### Features

- Global CDN with 200+ edge locations
- Automatic preview deployments for PRs
- Instant rollbacks
- Environment variables support
- Zero-config framework detection

### Environment variables

Set in Cloudflare dashboard or `wrangler.toml`:

```toml
[env.production]
vars = { API_KEY = "your-key" }
```

## Vercel

Zero-configuration deployment with automatic framework detection.

### Quick deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from project root
vercel
```

### From template

Deploy directly from Vercel's templates:

```
https://vercel.com/new/clone?repository-url=https://github.com/solidjs/solid-start
```

### Using Git integration

1. Push code to GitHub/GitLab/Bitbucket
2. Import project to Vercel
3. Vercel auto-detects SolidStart
4. Deploy automatically

### Configuration

Optional `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".vercel/output",
  "installCommand": "npm install",
  "framework": "vite"
}
```

### Features

- Automatic CI/CD
- Preview deployments for PRs
- Custom domains
- Edge functions
- Performance checks
- Analytics

### Environment variables

Add in Vercel dashboard under Settings → Environment Variables.

## Netlify

Simple deployment with excellent Git workflow.

### Web interface deployment

1. Navigate to [Netlify](https://app.netlify.com/)
2. Click **New site from Git**
3. Connect to Git provider
4. Select repository
5. Configure build settings:
   - **Publish directory**: `dist`
   - **Build command**: `npm run build`
6. Click **Deploy**

### CLI deployment

```bash
# Install Netlify CLI
npm install netlify-cli -g

# Deploy
netlify deploy --prod
```

### Configuration

Create `netlify.toml`:

```toml
[build]
  publish = "dist"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Features

- Git-based CI/CD
- Split testing capabilities
- Forms handling
- Edge functions
- Instant rollbacks

### Environment variables

Add in Netlify dashboard under Site settings → Environment variables.

## AWS with SST

Infrastructure as code deployment to AWS.

### Serverless deployment

#### Setup

```bash
# Create SolidStart project
npm init solid@latest aws-solid-start
cd aws-solid-start

# Initialize SST
npx sst@latest init
npm install
```

#### Configure

```tsx
// app.config.ts
import { defineConfig } from "@solidjs/start/config";

export default defineConfig({
  server: {
    preset: "aws-lambda",
    awsLambda: {
      streaming: true
    }
  }
});
```

#### SST configuration

```tsx
// sst.config.ts
export default {
  config(input) {
    return {
      name: "my-solid-app",
      region: "us-east-1"
    };
  },
  stacks(app) {
    app.stack(function Site({ stack }) {
      const site = new SolidStart(stack, "site");
      stack.addOutputs({
        url: site.url
      });
    });
  }
};
```

#### Deploy

```bash
npx sst deploy --stage production
```

### Container deployment

#### Setup

```bash
npm init solid@latest aws-solid-container
cd aws-solid-container
npx sst@latest init
npm install
```

#### Configuration

```tsx
// sst.config.ts
async run() {
  const vpc = new sst.aws.Vpc("MyVpc", { bastion: true });
  const cluster = new sst.aws.Cluster("MyCluster", { vpc });
  
  new sst.aws.Service("MyService", {
    cluster,
    loadBalancer: {
      ports: [{ listen: "80/http", forward: "3000/http" }]
    },
    dev: {
      command: "npm run dev"
    }
  });
}
```

#### Dockerfile

```dockerfile
FROM node:lts AS base
WORKDIR /src

# Build
FROM base as build
COPY --link package.json package-lock.json ./
RUN npm install
COPY --link . .
RUN npm run build

# Run
FROM base
ENV PORT=3000
ENV NODE_ENV=production
COPY --from=build /src/.output /src/.output
CMD ["node", ".output/server/index.mjs"]
```

### Features

- Serverless or container deployment
- Infrastructure as code
- Local development mode
- Multi-stage environments
- AWS native integration

## Node.js

Traditional server deployment.

### Configuration

```tsx
// app.config.ts
import { defineConfig } from "@solidjs/start/config";

export default defineConfig({
  server: {
    preset: "node"
  }
});
```

### Build and run

```bash
# Build
npm run build

# Start production server
npm start
```

### Process manager

Use PM2 for production:

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start npm --name "solid-app" -- start

# Save configuration
pm2 save

# Setup startup script
pm2 startup
```

### Reverse proxy (nginx)

```nginx
server {
  listen 80;
  server_name example.com;

  location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
```

### Docker

```dockerfile
FROM node:18-alpine AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package*.json ./
RUN npm ci

# Build application
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image
FROM base AS runner
ENV NODE_ENV=production

COPY --from=builder /app/.output ./.output
COPY --from=deps /app/node_modules ./node_modules

EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
```

## General Configuration

### Environment variables

#### Development (.env.local)

```bash
DATABASE_URL="postgresql://user:pass@localhost:5432/db"
API_KEY="dev-key"
SESSION_SECRET="dev-secret-min-32-chars"
```

#### Production

Set via platform dashboard or deployment config:

```bash
# Cloudflare
wrangler secret put API_KEY

# Vercel
vercel env add API_KEY production

# Netlify
netlify env:set API_KEY value
```

### Build configuration

#### Package.json scripts

```json
{
  "scripts": {
    "dev": "vinxi dev",
    "build": "vinxi build",
    "start": "vinxi start"
  }
}
```

#### Custom build output

```tsx
// app.config.ts
export default defineConfig({
  server: {
    preset: "node",
    output: {
      dir: "./build"
    }
  }
});
```

### Static assets

Place in `public/` directory:

```
public/
├── favicon.ico
├── images/
│   └── logo.png
└── fonts/
    └── custom.woff2
```

Access with absolute paths:

```tsx
<img src="/images/logo.png" alt="Logo" />
```

### Custom headers

```tsx
// app.config.ts
export default defineConfig({
  server: {
    preset: "cloudflare-pages",
    headers: {
      "/*": {
        "X-Frame-Options": "DENY",
        "X-Content-Type-Options": "nosniff"
      }
    }
  }
});
```

### Error pages

Create custom error pages:

```tsx
// routes/[...404].tsx
export default function NotFound() {
  return (
    <div>
      <h1>404 - Page Not Found</h1>
      <a href="/">Go Home</a>
    </div>
  );
}
```

## Platform Comparison

| Platform | Best For | Pricing | Edge Computing |
|----------|----------|---------|----------------|
| **Cloudflare Pages** | Global apps, high performance | Free tier + usage | Yes (Workers) |
| **Vercel** | Quick deployment, previews | Free tier + usage | Yes (Edge Functions) |
| **Netlify** | Jamstack, rapid prototyping | Free tier + usage | Yes (Edge Functions) |
| **AWS (SST)** | Enterprise, AWS integration | AWS usage costs | Lambda@Edge |
| **Node.js** | Full control, self-hosted | Server costs | No (requires setup) |

## Best Practices

1. **Use environment variables** - Never hardcode secrets
2. **Configure proper presets** - Each platform has optimized settings
3. **Test deployments** - Use preview/staging environments
4. **Monitor performance** - Use platform analytics
5. **Set up CI/CD** - Automate deployments
6. **Configure error tracking** - Sentry, LogRocket, etc.
7. **Enable caching** - Use platform CDN capabilities
8. **Optimize assets** - Compress images, use modern formats
9. **Use HTTPS** - Most platforms provide free SSL
10. **Document deployment process** - For team consistency

## Troubleshooting

### Build failures

```bash
# Clear build cache
rm -rf .output dist node_modules
npm install
npm run build
```

### Environment variable issues

```bash
# Check variables are set
echo $API_KEY

# Verify in code
console.log(process.env.API_KEY);
```

### Port conflicts

```bash
# Change port in development
PORT=3001 npm run dev

# Or configure in app.config.ts
export default defineConfig({
  server: {
    port: 3001
  }
});
```

### SSR hydration errors

- Ensure consistent HTML between server and client
- Check for browser-only APIs in server code
- Verify environment variables are available

### Memory issues

```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```
