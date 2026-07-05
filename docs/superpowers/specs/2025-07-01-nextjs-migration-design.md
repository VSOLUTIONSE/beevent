# Next.js Migration Design

## Overview

Migrate BeeVelt Halls from a Vite + Hono + tRPC stack to Next.js App Router with Route Handlers (queries) + Server Actions (mutations). Keep all existing UI components, visual design, database schema, and shared contracts unchanged.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Next.js App Router                                  │
│                                                      │
│  ┌──────────────┐  ┌──────────────────────────┐     │
│  │ Server        │  │ Route Handlers (GET)     │     │
│  │ Actions       │  │ /api/venue/*             │     │
│  │ (mutations)   │  │ /api/booking/*           │     │
│  │               │  │ /api/calendar/*          │     │
│  │ login/signup  │  │ /api/admin/*             │     │
│  │ createBooking │  │ /api/payment/*           │     │
│  │ approveBooking│  └──────────┬───────────────┘     │
│  │ cancelBooking │             │ React Query         │
│  │ blockDate     │             ▼                     │
│  │ initiatePay   │  ┌──────────────────────────┐     │
│  └───────┬───────┘  │  Client Components       │     │
│          │          │  (same pages, same UI)   │     │
│          │          └──────────────────────────┘     │
│          ▼                                           │
│  ┌────────────────────────────────────────────┐      │
│  │  Drizzle ORM → Neon Postgres               │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  Next.js Middleware: JWT cookie → request headers    │
└─────────────────────────────────────────────────────┘
```

## File Structure

```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                          ← Home (from src/pages/Home.tsx)
│   ├── book/page.tsx                     ← Booking (from src/pages/Booking.tsx)
│   ├── dashboard/page.tsx                ← Dashboard (from src/pages/Dashboard.tsx)
│   ├── login/page.tsx                    ← Login (from src/pages/Login.tsx)
│   ├── signup/page.tsx                   ← Signup (from src/pages/Signup.tsx)
│   ├── not-found.tsx                     ← NotFound (from src/pages/NotFound.tsx)
│   └── api/
│       ├── auth/me/route.ts              ← GET current user
│       ├── venue/
│       │   ├── route.ts                  ← GET venue info
│       │   ├── packages/route.ts         ← GET packages
│       │   ├── addons/route.ts           ← GET addons
│       │   └── availability/route.ts     ← GET checkAvailability
│       ├── booking/
│       │   ├── my/route.ts               ← GET myBookings
│       │   └── [id]/route.ts             ← GET single booking
│       ├── calendar/events/route.ts      ← GET calendar events
│       ├── admin/
│       │   ├── stats/route.ts            ← GET admin stats
│       │   ├── bookings/route.ts         ← GET all bookings
│       │   └── staff/route.ts            ← GET staff list
│       └── payment/verify/route.ts       ← GET verify payment
├── lib/
│   ├── api-client.ts                     ← typed fetch wrapper
│   └── server/
│       ├── db.ts                         ← Drizzle connection
│       ├── auth.ts                       ← cookie + session helpers
│       └── actions/
│           ├── auth.ts                   ← login, signup, logout
│           ├── booking.ts                ← create, cancel
│           ├── admin.ts                  ← approveBooking, rejectBooking, updateStaffRole
│           ├── calendar.ts               ← blockDate, unblockDate
│           └── payment.ts                ← initiate, mockCallback
├── middleware.ts                          ← auth cookie verification
├── components/                            ← unchanged
├── hooks/                                 ← unchanged (minus trpc)
└── providers/                             ← trpc.tsx deleted, QueryClient provider kept
```

## API Layer

### Route Handlers (GET queries)

Each Route Handler reads the session cookie, optionally reconstructs the user for role checks, calls Drizzle, and returns typed JSON.

```ts
// src/app/api/venue/packages/route.ts
export async function GET() {
  const db = getDb();
  const packages = await db.select().from(packagesTable).where(eq(packagesTable.isActive, true));
  return NextResponse.json(packages);
}
```

Protected Route Handlers call `getAuthUser()` which reads `cookies().get("session")` and verifies the JWT, returning `401` or `403` on failure.

### Server Actions (mutations)

Each Server Action is an `"use server"` function validated with Zod, calling Drizzle, and setting/clearing cookies where needed.

```ts
// src/lib/server/actions/auth.ts
"use server";
export async function login(data: { email: string; password: string }) {
  const parsed = loginSchema.parse(data);
  // ... validate password, sign JWT, set cookie
  cookies().set("session", token, { httpOnly: true, path: "/", sameSite: "lax", secure: true });
  return { user: sanitizedUser };
}
```

Mutations call `revalidatePath()` or `revalidateTag()` to refresh React Query caches.

### Client Data Access

A thin typed fetch wrapper replaces `trpc.*.useQuery()`:

```ts
// src/lib/api-client.ts
export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(path, { credentials: "include" });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
```

React Query usage in components:

```tsx
// Before (tRPC):
const { data } = trpc.venue.packages.useQuery();

// After (React Query + fetch):
const { data } = useQuery({
  queryKey: ["packages"],
  queryFn: () => apiGet<Package[]>("/api/venue/packages"),
});
```

Server Actions are called directly:

```tsx
// Before (tRPC):
const loginMutation = trpc.auth.login.useMutation({ onSuccess: () => navigate("/") });
loginMutation.mutate({ email, password });

// After (Server Action):
const [pending, startTransition] = useTransition();
startTransition(async () => {
  const result = await login({ email, password });
  if (result.error) setError(result.error);
  else redirect("/");
});
```

## Auth Flow

1. **Signup/Login Server Actions** set the `session` httpOnly cookie via `cookies().set()`
2. **Next.js Middleware** (`src/middleware.ts`) reads the cookie on every request. For protected routes (`/dashboard`, `/book`), it redirects to `/login` if the JWT is missing/invalid. For `/api/*` requests, it passes through but sets a header so Route Handlers don't re-verify.
3. **Route Handlers** use `getAuthUser()` which reads `cookies().get("session")` and verifies the JWT — returns the user or `null`
4. **Client components** use `useAuth()` hook (from `src/hooks/useAuth.ts`, modified) that calls a "me" Route Handler or reads from React Query
5. **Logout Server Action** clears the cookie

## What Stays Unchanged

- `db/schema.ts`, `db/relations.ts`, `db/migrations/`, `db/seed.ts`
- `contracts/*` (constants.ts, types.ts, errors.ts)
- All `src/components/` (Navbar, Hero, etc.)
- All `src/hooks/` (useAuth, useMobile — trpc import removed)
- All `src/design/` (design tokens)
- Tailwind config, PostCSS config, env vars

## What Gets Deleted

- `api/` entire directory
- `vite.config.ts`, `index.html`
- `src/main.tsx`, `src/App.tsx`
- `src/providers/trpc.tsx`
- `react-router`, `@trpc/*`, `@hono/*`, `vite`, `esbuild` (deps)

## Route Handler Mapping

| tRPC Procedure | Route Handler |
|---------------|---------------|
| `auth.me` | `GET /api/auth/me` |
| `venue.get` | `GET /api/venue` |
| `venue.packages` | `GET /api/venue/packages` |
| `venue.addons` | `GET /api/venue/addons` |
| `venue.checkAvailability` | `GET /api/venue/availability?start=...&end=...` |
| `booking.myBookings` | `GET /api/booking/my` |
| `booking.get` | `GET /api/booking/[id]` |
| `calendar.events` | `GET /api/calendar/events?month=...&year=...` |
| `admin.stats` | `GET /api/admin/stats` |
| `admin.bookings` | `GET /api/admin/bookings` |
| `admin.staff` | `GET /api/admin/staff` |
| `payment.verify` | `GET /api/payment/verify?reference=...` |

## Server Action Mapping

| tRPC Mutation | Server Action |
|--------------|---------------|
| `auth.login` | `login(data)` in `actions/auth.ts` |
| `auth.signup` | `signup(data)` in `actions/auth.ts` |
| `auth.logout` | `logout()` in `actions/auth.ts` |
| `booking.create` | `createBooking(data)` in `actions/booking.ts` |
| `booking.cancel` | `cancelBooking(id)` in `actions/booking.ts` |
| `admin.approveBooking` | `approveBooking(id)` in `actions/admin.ts` |
| `admin.rejectBooking` | `rejectBooking(id, reason?)` in `actions/admin.ts` |
| `admin.updateStaffRole` | `updateStaffRole(userId, role)` in `actions/admin.ts` |
| `calendar.blockDate` | `blockDate(data)` in `actions/calendar.ts` |
| `calendar.unblockDate` | `unblockDate(id)` in `actions/calendar.ts` |
| `payment.initiate` | `initiatePayment(bookingId)` in `actions/payment.ts` |
| `payment.mockCallback` | `mockPaymentCallback(ref)` in `actions/payment.ts` |
