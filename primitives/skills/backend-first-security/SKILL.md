---
name: backend-first-security
description: Zero-trust backend-first architecture for web apps. Use when building secure features, doing security reviews, or working with RLS and auth. Triggers on 'backend first', 'security review', 'RLS', or when building auth systems.
metadata:
  version: "1.0"
  source: promoted-from-command
---

---
title: "Backend-First Security"
category: quick
difficulty: intermediate
---

# Backend-First Security (Quick Use)

**When:** Building secure web apps, security reviews  
**Trigger:** "backend first" | "security review" | "RLS"

## The Rules

### 1. BACKEND-ONLY DATA ACCESS
- **NEVER** write business logic in Client Components
- **NEVER** use `supabase-js` client-side methods
- **ALWAYS** use Server Actions, API Routes, or Edge Functions
- Frontend is View Layer only

### 2. DATABASE & RLS - "ZERO POLICY"
- **RLS IS MANDATORY** on every table
- **NO POLICIES ALLOWED** (acts as "Deny All" firewall)
- **SERVICE ROLE ONLY** - all data access via service_role key

### 3. STORAGE SECURITY
- **NO PUBLIC BUCKETS**
- **UUID FILENAMES** (prevent enumeration)
- **SIGNED URLS** only

### 4. PAYMENTS & WEBHOOKS
- **VERIFY SIGNATURES** - never trust req.body directly
- Use provider SDK to verify (e.g., `stripe.webhooks.constructEvent`)
- Return 400 if verification fails

### 5. ENVIRONMENT VARIABLES
- **NEVER** hardcode secrets
- **VALIDATE** at build time (Zod)

### 6. INPUT VALIDATION & RATE LIMITING
- **TRUST NO ONE** - validate ALL inputs with Zod
- **RATE LIMITS** on all mutation endpoints

### 7. RPC LOCKDOWN
```sql
REVOKE EXECUTE ON FUNCTION function_name FROM public;
REVOKE EXECUTE ON FUNCTION function_name FROM anon;
```

## The Compliance Check

**Before generating code, ask:**
> "Is this code asking the Frontend to talk to the Database?"
> 
> **If YES → REJECT IT**

**Full version:** `skills/backend_first_security.md`
