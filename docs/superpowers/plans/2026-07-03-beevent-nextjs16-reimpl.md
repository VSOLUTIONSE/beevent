# BeeVelt Halls Next.js 16 Reimplementation Plan

> **For agentic workers:** Inline execution recommended — tasks are interconnected (moves, imports, cross-file refs).

**Goal:** Convert the BeeVelt Halls app from its Vite-originated Next.js setup to proper Next.js 16 patterns: route groups, proxy.ts, Server Components by default, proper style system, metadata, loading states.

**Architecture:** Route groups `(marketing)/(auth)/(app)` separate landing, auth, and protected routes. Pages become Server Components with isolated client islands. CSS utility classes replaced by React components from `primitives.tsx`. Auth guard via `proxy.ts`.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 3, Drizzle ORM, Framer Motion, shadcn/ui

---

### Task 1: Clean globals.css — Move component layer to React components

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/design/primitives.tsx`

- [ ] **Step 1: Update globals.css — strip component classes, keep base layer**

Remove `@layer components` block (`.liquid-glass`, `.liquid-glass-strong`, `.btn-pill`, `.btn-pill-primary`, `.btn-pill-secondary`, `.text-gradient`, `.text-gradient-teal`). These will be replaced by components.

```css
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@300;400;500;600;700&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 240 7% 1%;
    --foreground: 0 0% 100%;
    --card: 240 5% 6%;
    --card-foreground: 0 0% 100%;
    --popover: 240 5% 6%;
    --popover-foreground: 0 0% 100%;
    --primary: 1 74% 55%;
    --primary-foreground: 0 0% 100%;
    --secondary: 174 10% 55%;
    --secondary-foreground: 0 0% 100%;
    --muted: 240 4% 12%;
    --muted-foreground: 0 5% 69%;
    --accent: 174 10% 55%;
    --accent-foreground: 0 0% 100%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 0 0% 100% / 0.15;
    --input: 0 0% 100% / 0.15;
    --ring: 1 74% 55%;
    --radius: 0.5rem;
  }

  * {
    border-color: hsl(var(--border));
  }

  body {
    background-color: #030305;
    color: hsl(var(--foreground));
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    font-family: 'Inter', system-ui, sans-serif;
  }

  h1, h2, h3, .font-serif {
    font-family: 'Instrument Serif', Georgia, serif;
  }
}

@layer utilities {
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
}
```

- [ ] **Step 2: Add TextGradient component to primitives.tsx**

Add before the final export in `src/design/primitives.tsx`:

```tsx
export function TextGradient({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "bg-gradient-to-br from-white to-[#B0A8A8] bg-clip-text text-transparent",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function TealGradient({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "bg-gradient-to-br from-[#829796] to-[#5a6e6d] bg-clip-text text-transparent",
        className,
      )}
    >
      {children}
    </span>
  );
}
```

- [ ] **Step 3: Add LiquidGlass component to primitives.tsx**

```tsx
interface LiquidGlassProps {
  strong?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function LiquidGlass({ strong, className, children }: LiquidGlassProps) {
  return (
    <div
      className={cn(
        strong
          ? "bg-gradient-to-b from-white/[0.18] to-white/[0.08] backdrop-blur-[12px] saturate-[150%] border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_8px_32px_rgba(0,0,0,0.4)]"
          : "bg-gradient-to-b from-white/[0.12] to-white/[0.05] backdrop-blur-[6px] saturate-[140%] border border-white/15 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_8px_32px_rgba(0,0,0,0.3)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css src/design/primitives.tsx
git commit -m "refactor: move CSS component classes to React primitives"
```

---

### Task 2: Create proxy.ts (auth guard)

**Files:**
- Create: `src/proxy.ts`
- Test via dev server

- [ ] **Step 1: Create src/proxy.ts**

```ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "session";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get(COOKIE_NAME)?.value;

  const protectedPaths = ["/dashboard", "/book"];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  if (isProtected && !sessionToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const authPaths = ["/login", "/signup"];
  const isAuthPage = authPaths.some((p) => pathname.startsWith(p));

  if (isAuthPage && sessionToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/book/:path*", "/login", "/signup"],
};
```

- [ ] **Step 2: Disable old middleware if exists**

Check no `middleware.ts` exists (only one of `proxy.ts` or `middleware.ts` can exist in Next.js 16).

- [ ] **Step 3: Commit**

```bash
git add src/proxy.ts
git commit -m "feat: add proxy.ts auth guard (Next.js 16 middleware)"
```

---

### Task 3: Create route groups and rehome pages

**Files:**
- Create: `src/app/(marketing)/layout.tsx`
- Create: `src/app/(marketing)/page.tsx`
- Create: `src/app/(auth)/layout.tsx`
- Create: `src/app/(auth)/login/page.tsx`
- Create: `src/app/(auth)/signup/page.tsx`
- Create: `src/app/(app)/layout.tsx`
- Create: `src/app/(app)/dashboard/page.tsx`
- Create: `src/app/(app)/book/page.tsx`
- Create: `src/app/loading.tsx`
- Remove: `src/app/page.tsx`
- Remove: `src/app/login/page.tsx`
- Remove: `src/app/signup/page.tsx`
- Remove: `src/app/dashboard/page.tsx`
- Remove: `src/app/book/page.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Create (marketing) landing layout**

```tsx
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/sections/Footer";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="relative min-h-screen bg-[#030305]">{children}</main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 2: Create (marketing) home page (Server Component)**

```tsx
import Hero from "@/components/sections/Hero";
import VenueSection from "@/components/sections/VenueSection";
import PackagesSection from "@/components/sections/PackagesSection";
import CalendarPreview from "@/components/sections/CalendarPreview";

export default function HomePage() {
  return (
    <>
      <Hero />
      <VenueSection />
      <PackagesSection />
      <CalendarPreview />
    </>
  );
}
```

- [ ] **Step 3: Create (auth) centered layout**

```tsx
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-[#030305] flex items-center justify-center p-6">
      <div className="absolute top-8 left-8">
        <Link href="/" className="font-serif text-xl text-white hover:opacity-80 transition-opacity">
          BeeVelt Halls
        </Link>
      </div>
      {children}
    </div>
  );
}
```

- [ ] **Step 4: Create (auth)/login/page.tsx (Server Component shell)**

```tsx
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return <LoginForm />;
}
```

- [ ] **Step 5: Create (auth)/signup/page.tsx (Server Component shell)**

```tsx
import SignupForm from "@/components/auth/SignupForm";

export default function SignupPage() {
  return <SignupForm />;
}
```

- [ ] **Step 6: Create (app) protected layout**

```tsx
import { getAuthUser } from "@/lib/server/auth";
import { redirect } from "next/navigation";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-[#030305]">
      {children}
    </div>
  );
}
```

- [ ] **Step 7: Create (app)/dashboard/page.tsx (Server Component shell)**

```tsx
import DashboardClient from "@/components/dashboard/DashboardClient";

export default async function DashboardPage() {
  return <DashboardClient />;
}
```

- [ ] **Step 8: Create (app)/book/page.tsx (Server Component shell)**

```tsx
import BookingWizard from "@/components/booking/BookingWizard";

export default async function BookPage() {
  return <BookingWizard />;
}
```

- [ ] **Step 9: Create root loading.tsx**

```tsx
export default function Loading() {
  return (
    <div className="min-h-screen bg-[#030305] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#829796] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
```

- [ ] **Step 10: Clean up root layout.tsx**

Remove Navbar/Footer from root layout since they're now in `(marketing)/layout.tsx`.

Current root layout is fine since it only has `<Providers>` wrapper, but remove unused imports.

- [ ] **Step 11: Delete old page files**

Move content from old locations. No content loss — all moved to route groups.

```bash
git rm src/app/page.tsx src/app/login/page.tsx src/app/signup/page.tsx src/app/dashboard/page.tsx src/app/book/page.tsx
```

- [ ] **Step 12: Commit**

```bash
git add src/app/ src/design/
git commit -m "feat: add route groups (marketing)/(auth)/(app) with proper layouts"
```

---

### Task 4: Extract auth forms into client components

**Files:**
- Create: `src/components/auth/LoginForm.tsx`
- Create: `src/components/auth/SignupForm.tsx`
- Remove: old login/signup page content (already handled in Task 3)

- [ ] **Step 1: Create LoginForm client component**

```tsx
"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/server/actions/auth";
import { GlassCard } from "@/design/primitives";
import { FormInput, FormField, PillButton } from "@/design/primitives";

export default function LoginForm() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await login({
        email: form.get("email") as string,
        password: form.get("password") as string,
      });
      if (result.success) router.push("/dashboard");
    });
  }

  return (
    <GlassCard strong className="w-full max-w-md p-8">
      <h1 className="font-serif text-3xl text-white mb-2">Welcome back</h1>
      <p className="text-[#B0A8A8] text-sm mb-8">Sign in to your account</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <FormField label="Email">
          <FormInput name="email" type="email" required placeholder="you@example.com" />
        </FormField>
        <FormField label="Password">
          <FormInput name="password" type="password" required placeholder="••••••••" />
        </FormField>
        <PillButton type="submit" disabled={isPending} className="w-full">
          {isPending ? "Signing in..." : "Sign in"}
        </PillButton>
      </form>

      <p className="text-center text-sm text-[#B0A8A8] mt-6">
        Don&apos;t have an account?{" "}
        <a href="/signup" className="text-[#829796] hover:underline">Sign up</a>
      </p>
    </GlassCard>
  );
}
```

- [ ] **Step 2: Create SignupForm client component**

```tsx
"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { signup } from "@/lib/server/actions/auth";
import { GlassCard, FormInput, FormField, PillButton } from "@/design/primitives";

export default function SignupForm() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await signup({
        name: form.get("name") as string,
        email: form.get("email") as string,
        password: form.get("password") as string,
      });
      if (result.success) router.push("/dashboard");
    });
  }

  return (
    <GlassCard strong className="w-full max-w-md p-8">
      <h1 className="font-serif text-3xl text-white mb-2">Create account</h1>
      <p className="text-[#B0A8A8] text-sm mb-8">Start booking events at BeeVelt Halls</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <FormField label="Full name">
          <FormInput name="name" required placeholder="Your name" />
        </FormField>
        <FormField label="Email">
          <FormInput name="email" type="email" required placeholder="you@example.com" />
        </FormField>
        <FormField label="Password">
          <FormInput name="password" type="password" required placeholder="••••••••" minLength={8} />
        </FormField>
        <PillButton type="submit" disabled={isPending} className="w-full">
          {isPending ? "Creating account..." : "Create account"}
        </PillButton>
      </form>

      <p className="text-center text-sm text-[#B0A8A8] mt-6">
        Already have an account?{" "}
        <a href="/login" className="text-[#829796] hover:underline">Sign in</a>
      </p>
    </GlassCard>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/auth/
git commit -m "feat: extract LoginForm and SignupForm client components"
```

---

### Task 5: Create dashboard and booking client components

**Files:**
- Create: `src/components/dashboard/DashboardClient.tsx`
- Create: `src/components/booking/BookingWizard.tsx`

- [ ] **Step 1: Create DashboardClient.tsx**

This is the existing dashboard content from `src/app/dashboard/page.tsx` with `"use client"`. Move it as-is into this component file, preserving all logic.

```tsx
"use client";
// Move all existing dashboard page.tsx content here
```

- [ ] **Step 2: Create BookingWizard.tsx**

Same — move existing `src/app/book/page.tsx` content into this component.

```tsx
"use client";
// Move all existing book page.tsx content here
```

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/ src/components/booking/
git commit -m "feat: extract DashboardClient and BookingWizard client components"
```

---

### Task 6: Update section components to use primitives instead of CSS classes

**Files:**
- Modify: `src/components/sections/Hero.tsx`
- Modify: `src/components/sections/VenueSection.tsx`
- Modify: `src/components/sections/PackagesSection.tsx`
- Modify: `src/components/sections/CalendarPreview.tsx`
- Modify: `src/components/layout/Navbar.tsx`

- [ ] **Step 1: Update Hero.tsx — replace CSS classes with primitives**

Replace:
- `text-gradient` class → `<TextGradient>` component
- `btn-pill-primary` → `<PillButton variant="primary">` or `<Link>` styled as pill
- `btn-pill-secondary` → `<PillButton variant="secondary">`

```tsx
// In Hero.tsx, replace the gradient span with:
import { TextGradient, PillButton } from "@/design/primitives";

// Line 77: change "text-gradient" className to use TextGradient:
<TextGradient className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[1.05] tracking-tight">
  transcend time.
</TextGradient>

// Lines 102-116: replace btn-pill-primary and btn-pill-secondary:
<PillButton as="a" href="/book">
  View Availability
  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
</PillButton>
<button onClick={...} className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-medium text-sm transition-all duration-300 bg-white/10 text-white border border-white/20 hover:bg-white/20 hover:scale-[1.02]">
  Explore Venue
</button>
```

- [ ] **Step 2: Update Navbar.tsx — replace liquid-glass with LiquidGlass**

```tsx
import { LiquidGlass } from "@/design/primitives";

// Line 40: change className conditional to use LiquidGlass
<motion.nav ...>
  <LiquidGlass className="w-full">
    {/* nav content */}
  </LiquidGlass>
</motion.nav>
```

Wait, that won't work cleanly because of the motion animation. Let's keep the approach simpler: just use the Tailwind classes inline instead of the CSS class. The `liquid-glass` class is already defined as Tailwind-compatible classes in `GlassCard`. We can use the same approach inline:

Actually, looking at this more carefully, the simplest approach for the Navbar is to replace the `liquid-glass` class with the equivalent Tailwind classes inline:

```
scrolled ? "bg-gradient-to-b from-white/[0.12] to-white/[0.05] backdrop-blur-[6px] saturate-[140%] border-b border-white/15 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_8px_32px_rgba(0,0,0,0.3)]" : "bg-transparent"
```

- [ ] **Step 3: Update VenueSection, PackagesSection, CalendarPreview**

Replace any `btn-pill-primary`, `btn-pill-secondary`, `text-gradient`, `text-gradient-teal` class usage with primitives.

- [ ] **Step 4: Commit**

```bash
git add src/components/
git commit -m "refactor: replace CSS classes with React primitives in sections"
```

---

### Task 7: Add metadata to all pages

**Files:**
- Modify: `src/app/(marketing)/page.tsx`
- Modify: `src/app/(auth)/login/page.tsx`
- Modify: `src/app/(auth)/signup/page.tsx`
- Modify: `src/app/(app)/dashboard/page.tsx`
- Modify: `src/app/(app)/book/page.tsx`

- [ ] **Step 1: Add generateMetadata to (marketing) home page**

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BeeVelt Halls — Premium Event Venue in Lagos",
  description:
    "An architectural masterpiece in the heart of Lagos. Book BeeVelt Halls for weddings, galas, conferences, and celebrations.",
  openGraph: {
    title: "BeeVelt Halls",
    description: "Premium event venue booking platform in Lagos, Nigeria",
  },
};
```

- [ ] **Step 2: Add generateMetadata to login page**

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In — BeeVelt Halls",
  description: "Sign in to your BeeVelt Halls account to manage bookings",
};
```

- [ ] **Step 3: Add generateMetadata to signup page**

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account — BeeVelt Halls",
  description: "Create a BeeVelt Halls account to book our premium event venue",
};
```

- [ ] **Step 4: Add generateMetadata to dashboard page**

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard — BeeVelt Halls",
  description: "Manage your bookings and venue schedule",
};
```

- [ ] **Step 5: Add generateMetadata to book page**

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book — BeeVelt Halls",
  description: "Book BeeVelt Halls for your next event",
};
```

- [ ] **Step 6: Commit**

```bash
git add src/app/
git commit -m "feat: add generateMetadata to all pages"
```

---

### Task 8: Fix API route params for Next.js 15+ (async)

**Files:**
- Modify: `src/app/api/booking/[id]/route.ts`

- [ ] **Step 1: Read and fix params to async**

In Next.js 15+, route handler params are `Promise<...>`. Check current implementation and wrap with `await`.

```ts
// Before:
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;

// After:
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/booking/[id]/route.ts
git commit -m "fix: await route params for Next.js 15+ async params"
```

---

### Task 9: Add Drizzle relations

**Files:**
- Modify: `db/relations.ts`

- [ ] **Step 1: Define Drizzle relations for all tables**

```ts
import { relations } from "drizzle-orm";
import {
  users,
  venue,
  packages,
  addons,
  bookings,
  bookingAddons,
  blockedDates,
  payments,
} from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  bookings: many(bookings),
  blockedDates: many(blockedDates),
}));

export const packagesRelations = relations(packages, ({ many }) => ({
  bookings: many(bookings),
}));

export const addonsRelations = relations(addons, ({ many }) => ({
  bookingAddons: many(bookingAddons),
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  user: one(users, { fields: [bookings.userId], references: [users.id] }),
  package: one(packages, { fields: [bookings.packageId], references: [packages.id] }),
  bookingAddons: many(bookingAddons),
  payments: many(payments),
}));

export const bookingAddonsRelations = relations(bookingAddons, ({ one }) => ({
  booking: one(bookings, { fields: [bookingAddons.bookingId], references: [bookings.id] }),
  addon: one(addons, { fields: [bookingAddons.addonId], references: [addons.id] }),
}));

export const blockedDatesRelations = relations(blockedDates, ({ one }) => ({
  createdByUser: one(users, { fields: [blockedDates.createdBy], references: [users.id] }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  booking: one(bookings, { fields: [payments.bookingId], references: [bookings.id] }),
}));
```

- [ ] **Step 2: Commit**

```bash
git add db/relations.ts
git commit -m "feat: add Drizzle table relations"
```

---

### Task 10: Verify build

- [ ] **Step 1: Run TypeScript check**

```bash
npm run check
```

Expected: No type errors.

- [ ] **Step 2: Build project**

```bash
npm run build
```

Expected: Successful production build.

- [ ] **Step 3: Fix any issues found**

- [ ] **Step 4: Final commit if fixes needed**

```bash
git add -A
git commit -m "fix: build and typecheck issues"
```
