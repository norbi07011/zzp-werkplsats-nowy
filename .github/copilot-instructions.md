# ZZP Werkplaats - AI Coding Agent Instructions

## Project Overview

**Platform:** Dutch freelancer (ZZP) marketplace with certification system, job board, and invoicing  
**Stack:** React 19 + TypeScript + Vite + Supabase (PostgreSQL + Auth + Storage)  
**UI:** TailwindCSS, Sonner (toasts), React Router v6, Lucide icons  
**State:** Context API (AuthContext, NotificationContext, ThemeContext, ToastContext)

### Directory Structure (Critical Paths)

```
.
├── App.tsx                    # Route definitions with lazy loading strategy
├── src/
│   ├── lib/
│   │   ├── supabase.ts       # **SINGLETON** Supabase client (NEVER duplicate)
│   │   └── database.types.ts # Generated types (regenerate after schema changes)
│   ├── services/             # Service layer wrapping Supabase calls
│   │   ├── workers.ts        # Example: fetchWorkers(), verifyWorker()
│   │   ├── auth/             # Authentication services
│   │   └── payment/          # Stripe integration
│   └── contexts/             # Global state management
│       ├── AuthContext.tsx   # User auth with 5-min cache
│       └── RealTimeNotificationContext.tsx
├── pages/
│   ├── public/               # Eagerly loaded (LoginPage, HomePage)
│   ├── Admin/                # Lazy loaded admin panels
│   ├── employer/             # Employer dashboard & features
│   ├── worker/               # Worker profiles & job applications
│   └── accountant/           # Invoicing & client management
├── components/
│   ├── ProtectedRoute.tsx    # Role-based route guards
│   └── ToastProvider.tsx     # Sonner toast wrapper
├── database/
│   ├── FINAL_SCHEMA.sql      # Source of truth (2654 lines, includes RLS)
│   └── migrations/           # Incremental schema changes
└── layouts/
    └── AuthenticatedLayout.tsx  # Wraps authenticated pages
```

## Critical Architecture Patterns

### 1. Lazy Loading Strategy (Bundle Optimization)

**Rule:** Admin/dashboard pages = lazy loaded, public pages = eager loaded

```tsx
// ✅ CORRECT: Admin pages lazy loaded in App.tsx
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const WorkersManager = lazy(() => import("./pages/Admin/WorkersManager"));

// ✅ CORRECT: Public pages eager loaded (first paint critical)
import { HomePage } from "./pages/public/HomePage";
import { LoginPage } from "./pages/public/LoginPage";
```

**WHY:** Reduces initial bundle by 70%, improves First Contentful Paint.

**Pitfall:** Adding non-lazy admin imports breaks bundle optimization - verify with `npm run build` and check `dist/stats.html`.

---

### 2. Supabase Client Pattern (SINGLETON)

**Critical:** Use ONLY the singleton client from `src/lib/supabase.ts`:

```typescript
// filepath: src/lib/supabase.ts
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storageKey: "zzp-werkplaats-auth", // Prevents GoTrue session conflicts
    autoRefreshToken: true,
    persistSession: true,
  },
});
```

**NEVER:**

```typescript
// ❌ DON'T create new clients anywhere
const newClient = createClient(...);
```

**WHY:** Multiple clients cause auth desync (duplicate sessions in localStorage). Stable `storageKey` prevents conflicts with other Supabase apps.

---

### 3. Authentication Flow & Role-Based Access

**5-layer security:**

1. **AuthContext** (`contexts/AuthContext.tsx`): Manages `user` state with 5-minute cache
2. **ProtectedRoute** (`components/ProtectedRoute.tsx`): Route guards
3. **RLS Policies** (database): Row-level security (admins bypass RLS)
4. **Subscription Whitelist**: Payment callback paths bypass checks
5. **Loading State**: ALWAYS check `isLoading` before rendering protected content

**Pattern:**

```tsx
// components/ProtectedRoute.tsx usage in App.tsx
<ProtectedRoute requiredRole="admin">
  <AdminDashboard />
</ProtectedRoute>

<ProtectedRoute requiredRole="employer" requireSubscription={true}>
  <PremiumFeature />
</ProtectedRoute>
```

**Payment Return Whitelist:**

```typescript
// Paths where users returning from Stripe have temporary session loss
const SUBSCRIPTION_WHITELIST_PATHS = [
  "/employer/subscription",
  "/payment-success",
  "/cleaning-company/subscription",
  "/accountant/subscription",
];
```

**Context Usage:**

```typescript
const { user, isAuthenticated, isLoading } = useAuth();

// ❌ DON'T render before checking isLoading
if (!isAuthenticated) return <Navigate to="/login" />;

// ✅ DO check isLoading first
if (isLoading) return <LoadingOverlay />;
if (!isAuthenticated) return <Navigate to="/login" />;
```

---

### 4. Multi-Role System

**6 user roles:**

| Role               | Dashboard           | Key Features                                           |
| ------------------ | ------------------- | ------------------------------------------------------ |
| `admin`            | `/admin`            | Full access, bypasses RLS, analytics                   |
| `employer`         | `/employer`         | Job posting, team management, subscriptions            |
| `worker`           | `/worker`           | Profile, portfolio, test scheduling                    |
| `accountant`       | `/accountant`       | Client management, invoicing (`src/modules/invoices/`) |
| `cleaning_company` | `/cleaning-company` | Project-based workflow                                 |
| `regular_user`     | `/regular-user`     | Service requests, basic profile                        |

**Role enforcement:** Checked in `ProtectedRoute` AND database RLS policies.

---

### 5. Notification System (Dual Architecture)

**Two independent systems:**

1. **Sonner Toasts** (`components/ToastProvider.tsx`):

   - UI-only, ephemeral feedback
   - Use for: Save success, validation errors, form submissions

   ```typescript
   import { toast } from "sonner";
   toast.success("✅ Saved successfully");
   toast.error("❌ Failed to save");
   ```

2. **Real-time Database Notifications** (`contexts/RealTimeNotificationContext.tsx`):
   - Persistent, stored in `notifications` table
   - Use for: Appointment reminders, system announcements, async events
   ```typescript
   // Created via Supabase function or service layer
   ```

**❌ DON'T:** Mix both systems for the same action. Sonner is mounted in `App.tsx` - never create duplicate `<Toaster />`.

---

### 6. Service Layer Pattern

**All database calls go through service functions:**

```typescript
// filepath: src/services/workers.ts
export async function fetchWorkers(): Promise<WorkerWithProfile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*, worker_profiles(*)")
    .eq("role", "worker");

  if (error) throw error;
  return data;
}
```

**WHY:**

- Centralizes error handling and type safety
- Enables testing without mocking Supabase
- Consistent response shapes across components

**❌ DON'T:** Call `supabase.from()` directly in components (except simple reads).

## Development Workflows

### Running the Project

```powershell
npm run dev          # Start dev server (port 3005, host 0.0.0.0)
npm run build        # Production build with cache clear
npm run test         # Run vitest tests
npm run test:ui      # Interactive test UI
```

**Build Process:** Clears `dist/` cache before each build. Check bundle with `dist/stats.html` after build.

---

### Database Type Generation (CRITICAL)

**MUST regenerate after ANY schema changes:**

```powershell
# Method 1: Supabase CLI (preferred)
supabase gen types typescript --project-id <PROJECT_ID> > src/lib/database.types.ts

# Method 2: Manual script (uses MCP)
.\generate-types-split.ps1

# Method 3: Using Supabase MCP tools
# 1. list_tables - verify tables exist
# 2. get_table_structure <table_name> - check columns
# 3. Update src/lib/database.types.ts manually
```

**WHY:** `src/lib/database.types.ts` enables TypeScript autocomplete for Supabase queries. Outdated types cause `never` type errors and false compilation errors.

**Signs you need to regenerate:**

- TypeScript complains about missing columns
- `data` from Supabase query typed as `never`
- New table not showing in autocomplete

---

### Debugging Protocol

#### 1. TypeScript Errors

```powershell
# Check errors before committing
npm run build  # or use get_errors tool

# Rule: >5 errors = STOP and fix before proceeding
```

#### 2. Runtime Issues

- Use **Console Ninja** extension (`activate_application_logging_tools`)
- Capture logs at specific `file:line` combinations
- Check browser DevTools for network errors

#### 3. Database Issues

**Common causes:**

- **RLS Policies:** Admin bypasses RLS, regular users don't. Test with both roles.
  - Check live: `mcp_supabase_execute_sql "SELECT * FROM pg_policies WHERE tablename='<table>'"`
- **Foreign Keys:** Verify relationships with MCP tools live
- **Missing Data:** Test with actual records: `mcp_supabase_execute_sql "SELECT * FROM <table> LIMIT 5"`
- **Table Structure Changed:** Always verify with `mcp_supabase_get_table_structure <table>` - don't trust old docs!

**Admin RLS Pattern:**

```sql
-- Admin bypasses all RLS (example from FINAL_SCHEMA.sql)
CREATE POLICY "admin_full_access_workers"
  ON workers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
```

**Performance Issue:** 187 RLS policies use `auth.uid()` instead of `(select auth.uid())`. This causes per-row evaluation. See `database-migrations/20251117_optimize_rls_policies.sql` for fix pattern.

---

### Git Workflow

**Branch Strategy:**

- `main` - production
- Feature branches - `feature/description`
- Never commit directly to `main`

**Pre-commit Checklist:**

1. Run TypeScript check: `get_errors` on modified files
2. Test in browser: Verify no Console Ninja errors
3. Git diff review: Only related files changed (not >5 unrelated files)
4. Test routing: Direct URL access, navigation from other pages

---

### Import Aliases

Use `@/` for `src/` imports:

```typescript
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";
import { fetchWorkers } from "@/services/workers";
```

**Config:** Set in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

## Code Conventions & Patterns

### Toast Notifications

```typescript
import { toast } from "sonner";
toast.success("✅ Action completed");
toast.error("❌ Error message");
toast.warning("⚠️ Warning");
```

**CRITICAL:** Sonner's `<Toaster />` is mounted once in `App.tsx`. Never create duplicate instances.

---

### React Hooks Patterns

**Context Hook Usage:**

```typescript
// AuthContext - ALWAYS check isLoading first
const { user, isAuthenticated, isLoading } = useAuth();
if (isLoading) return <LoadingOverlay />;
if (!isAuthenticated) return <Navigate to="/login" />;

// NotificationContext - Real-time notifications
const { notifications, unreadCount, markAsRead } = useNotifications();

// ThemeContext - Dark/light mode
const { theme, toggleTheme } = useTheme();
```

**State Management:**

- Use Context API for global state (auth, notifications, theme)
- Use `useState` for component-local state
- Use `useEffect` with cleanup for subscriptions

---

### Component File Organization

**Typical structure:**

```tsx
// 1. Imports
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

// 2. Type definitions
interface MyComponentProps {
  userId: string;
}

// 3. Component
export const MyComponent = ({ userId }: MyComponentProps) => {
  // 3a. Hooks (contexts first, then state, then effects)
  const { user } = useAuth();
  const [data, setData] = useState<Data[]>([]);

  // 3b. Effects
  useEffect(() => {
    // Fetch data
  }, [userId]);

  // 3c. Event handlers
  const handleSubmit = async () => {
    // ...
  };

  // 3d. Render
  return <div>{/* ... */}</div>;
};
```

---

### Database Query Patterns

**❌ DON'T** (Direct component queries):

```typescript
function MyComponent() {
  const { data } = await supabase.from("workers").select("*"); // ❌
}
```

**✅ DO** (Service layer):

```typescript
// services/workers.ts
export async function fetchWorkers(): Promise<Worker[]> {
  const { data, error } = await supabase.from("workers").select("*");
  if (error) throw new Error(`Failed to fetch workers: ${error.message}`);
  return data;
}

// Component
function MyComponent() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  useEffect(() => {
    fetchWorkers().then(setWorkers);
  }, []);
}
```

**Complex Joins:**

```typescript
// ✅ Use Supabase relationships
const { data } = await supabase
  .from("workers")
  .select("*, profiles!worker_profiles_profile_id_fkey(*), reviews(*)")
  .eq("verified", true);
```

## Critical File Relationships

**Auth Flow:**

1. `pages/public/LoginPage.tsx` → calls AuthContext.login()
2. `contexts/AuthContext.tsx` → authenticates via `src/lib/supabase.ts`
3. `components/ProtectedRoute.tsx` → guards routes
4. `layouts/AuthenticatedLayout.tsx` → wraps authenticated pages

**Admin Panel:**

1. `App.tsx` → lazy loads admin pages
2. `pages/AdminDashboard.tsx` → admin home (NOT AdminDashboard.BACKUP.tsx)
3. `pages/Admin/*Manager.tsx` → feature-specific panels (WorkersManager, PaymentsManager, etc.)
4. Each manager uses `src/services/` functions

**Accountant Module:**

1. `src/modules/invoices/` → Complete invoicing system
2. Services: `src/services/` + module-specific services
3. Integration with Stripe for payments

**Database Schema:**

- **ALWAYS verify live** using Supabase MCP tools:
  - `mcp_supabase_list_tables` - check what tables exist NOW
  - `mcp_supabase_get_table_structure <table>` - verify columns/types LIVE
  - `mcp_supabase_execute_sql` - test queries directly in database
- `database/FINAL_SCHEMA.sql` - reference only (may be outdated!)
- `database/migrations/` - history of changes
- **NEVER** hardcode table structure - always verify live first

---

## Environment Configuration

**Required `.env` variables:**

```env
# Supabase
VITE_SUPABASE_URL=https://[PROJECT_ID].supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...
VITE_SUPABASE_SERVICE_KEY=eyJhbG...  # Server-side only

# Stripe (for payments)
VITE_STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_SECRET_KEY=sk_...  # Server-side only
```

**Dev Server:** Port 3005, accessible at `http://0.0.0.0:3005` (network accessible)

---

## Common Data Flow Patterns

### 1. User Profile Loading (with cache)

```typescript
// contexts/AuthContext.tsx implements 5-minute cache
const userMappingCache = new Map<string, { user: User; timestamp: number }>();
const CACHE_DURATION = 300000; // 5 minutes

// Components just use the hook
const { user } = useAuth(); // Cached, won't refetch for 5 min
```

### 2. Real-time Subscriptions

```typescript
// contexts/RealTimeNotificationContext.tsx pattern
useEffect(() => {
  const channel = supabase
    .channel("notifications")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "notifications" },
      (payload) => {
        setNotifications((prev) => [payload.new, ...prev]);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [userId]);
```

### 3. Form Submissions with Toast Feedback

```typescript
const handleSubmit = async (formData: FormData) => {
  try {
    await createWorker(formData); // Service layer
    toast.success("✅ Worker created successfully");
    navigate("/admin/workers");
  } catch (error) {
    toast.error(`❌ Failed: ${error.message}`);
  }
};
```

## Pre-Coding Checklist

**Before implementing any feature:**

1. **Verify database LIVE** (CRITICAL - do this FIRST):

   - `mcp_supabase_list_tables` → Does table exist?
   - `mcp_supabase_get_table_structure <table>` → What columns are there NOW?
   - Check RLS policies: `mcp_supabase_execute_sql "SELECT * FROM pg_policies WHERE tablename='<table>'"`
     **After coding:**

1. Run TypeScript check: `get_errors` on modified files
1. **Verify database changes LIVE:**
   - `mcp_supabase_execute_sql "SELECT * FROM <table> LIMIT 5"` → Check new records exist
   - Verify RLS works: Test with different user roles
1. Test runtime: Use Console Ninja to verify no errors at interaction points
1. Git diff review: Ensure only related files changed (not >5 unrelated files)
1. Test routing: Direct URL access, navigation from other pages
1. Run TypeScript check: `get_errors` on modified files
1. Test runtime: Use Console Ninja to verify no errors at interaction points
1. Verify database: Check new records with SELECT queries
1. Git diff review: Ensure only related files changed (not >5 unrelated files)
1. Test routing: Direct URL access, navigation from other pages

## Post-Task Report Format

After completing work, provide structured report:

```
✅ Co zrobiłem: [concrete changes]
✅ Co działa: [verified functionality]
⚠️ Co poprawić: [known limitations]
🔜 Kolejne kroki: [next actions]
```

## Common Pitfalls

1. **Duplicate Route Definitions:** Check `App.tsx` for existing routes before adding new ones
2. **Multiple Supabase Clients:** Always use singleton from `src/lib/supabase.ts`
3. **Missing Lazy Import:** Admin pages MUST be lazy loaded (bundle size critical)
4. **Ignoring RLS:** Test with both admin and regular user roles
5. **Hardcoded IDs:** Use database queries, not assumed ID values
6. **Stale Types:** Regenerate `database.types.ts` after schema changes
7. **Toast Duplication:** Check if using Sonner OR ToastContext, not mixing both
8. **Session Loss on Payment Return:** Whitelist payment callback paths in ProtectedRoute
