# BeeVelt Halls — Next.js 16 Reimplementation

## Context

BeeVelt Halls is a premium event venue booking platform originally built with Vite + React + Hono/tRPC, then partially converted to Next.js. The conversion left style issues (CSS classes not rendering correctly after Vite) and outdated patterns (all pages `"use client"`, no route groups, no middleware, no `loading.tsx`, no `generateMetadata`).

## Goals

1. Fix style issues from the Vite-to-Next.js conversion
2. Adopt Next.js 16 canonical patterns: proxy.ts, route groups, Server Components, metadata, async params
3. Eliminate `"use client"` from page-level components
4. Add proper auth guard via proxy.ts
5. Add loading states per route segment
6. Add SEO metadata to all pages
7. Organize routes with (marketing)/(auth)/(app) groups

## Architecture

### Route Groups

```
src/
  proxy.ts                                   ← auth guard (Next.js 16)
  app/
    layout.tsx                               ← root layout (Providers, fonts)
    globals.css
    loading.tsx                              ← root loading state
    not-found.tsx
    (marketing)/
      layout.tsx                             ← landing layout (Navbar + Footer)
      page.tsx                               ← home (Server Component)
    (auth)/
      layout.tsx                             ← centered layout for auth pages
      login/page.tsx                         ← Server Component > LoginForm (client)
      signup/page.tsx                        ← Server Component > SignupForm (client)
    (app)/
      layout.tsx                             ← authenticated layout (sidebar, protected)
      dashboard/page.tsx                     ← Server Component > DashboardClient
      book/page.tsx                          ← Server Component > BookingWizard (client)
    api/
      venue/...
      booking/...
      admin/...
      payment/...
      calendar/...
```

### Server Component Strategy

| Page | Shell | Client Islands |
|------|-------|---------------|
| `/` | Server (no `"use client"`) | `Navbar`, `Hero`, `CalendarPreview` |
| `/login` | Server (no `"use client"`) | `LoginForm` |
| `/signup` | Server (no `"use client"`) | `SignupForm` |
| `/dashboard` | Server (data fetch + metadata) | `DashboardClient` (interactive parts) |
| `/book` | Server (data fetch + metadata) | `BookingWizard` (multi-step form) |

### Auth Flow

- `proxy.ts` checks session cookie on `/dashboard` and `/book`
- Redirects to `/login` if no cookie
- Server Components use `getAuthUser()` from `@/lib/server/auth`
- Client components use `useAuth()` hook (react-query to `/api/auth/me`)

### Style System

- Remove raw CSS utility classes from `globals.css` component layer
- Use existing `primitives.tsx` components (`GlassCard`, `PillButton`, etc.)
- All styles via Tailwind utility classes
- Google Fonts via CSS `@import` in globals.css
- Custom CSS only for base reset and CSS variables

### Data Fetching

- **Reads:** API routes for client data, Server Component direct DB calls for page data
- **Mutations:** Server Actions (existing pattern, keep)
- **Cache:** `revalidatePath` / `revalidateTag` after mutations
- **Parallel:** `Promise.all` for independent fetches

## Files to Modify

### Structural (new/rename)
- `src/proxy.ts` — auth guard (new)
- `src/app/(marketing)/layout.tsx` — landing layout (new)
- `src/app/(marketing)/page.tsx` — home page (moved from `src/app/page.tsx`)
- `src/app/(auth)/layout.tsx` — auth layout (new)
- `src/app/(auth)/login/page.tsx` — login page (moved)
- `src/app/(auth)/signup/page.tsx` — signup page (moved)
- `src/app/(app)/layout.tsx` — authenticated layout (new)
- `src/app/(app)/dashboard/page.tsx` — dashboard page (moved)
- `src/app/(app)/book/page.tsx` — booking page (moved)
- `src/app/api/venue/packages/route.ts` — async params fix
- `src/app/api/booking/[id]/route.ts` — async params fix
- `src/app/loading.tsx` — root loading (new)

### Style/Design
- `src/app/globals.css` — strip component class layer
- `src/design/primitives.tsx` — add `TextGradient`, `BtnPill` components
- `src/components/sections/Hero.tsx` — use primitives instead of CSS classes
- `src/components/sections/VenueSection.tsx` — use primitives
- `src/components/sections/PackagesSection.tsx` — use primitives
- `src/components/sections/CalendarPreview.tsx` — use primitives
- `src/components/layout/Navbar.tsx` — use primitives

### Data Layer
- `db/relations.ts` — add Drizzle relations

## Dependencies

All existing dependencies in `package.json` remain unchanged. No new packages needed.

## Verification

- `npm run check` — TypeScript passes
- `npm run build` — production build succeeds
- Pages load with correct styles
- Auth flow works (login → dashboard, redirect on unauthenticated)
- Metadata shows in page head
