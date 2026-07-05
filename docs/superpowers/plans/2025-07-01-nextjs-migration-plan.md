# Next.js Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate BeeVelt Halls from Vite + Hono + tRPC to Next.js App Router with Route Handlers + Server Actions.

**Architecture:** Route Handlers (`src/app/api/*/route.ts`) handle all GET queries. Server Actions (`src/lib/server/actions/*.ts`) handle all mutations (POST/PUT/DELETE). Shared types from `db/` and `contracts/` keep end-to-end type safety. React Query on the client calls Route Handlers. Next.js middleware handles auth cookie verification.

**Tech Stack:** Next.js 15 (App Router), Drizzle ORM, Neon Postgres, React Query, Tailwind CSS

---

### Task 1: Install Next.js and update package.json

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install Next.js and remove old deps**

Run:
```powershell
npm install next@latest react@rc react-dom@rc
npm uninstall @hono/node-server @hono/vite-dev-server @trpc/client @trpc/react-query @trpc/server @vitejs/plugin-react vite esbuild hono react-router
```

- [ ] **Step 2: Update package.json scripts**

Replace the `scripts` section:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "check": "tsc --noEmit",
    "format": "prettier --write .",
    "test": "vitest run",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push"
  }
}
```

Remove these dependencies from `dependencies`:
- `@hono/node-server`
- `@trpc/client`, `@trpc/react-query`, `@trpc/server`
- `hono`
- `cookie` (Next.js has built-in cookie handling via `next/headers`)

Keep these:
- `@tanstack/react-query` (still needed for query caching)
- `superjson` (for serialization if needed, or remove)
- `drizzle-orm`, `@neondatabase/serverless`
- `jose`, `zod`, `date-fns`, all Radix, shadcn, framer-motion, etc.

- [ ] **Step 3: Commit**

```powershell
git add package.json package-lock.json
git commit -m "chore: swap Vite/Hono/tRPC deps for Next.js"
```

---

### Task 2: Create Next.js config files

**Files:**
- Create: `next.config.ts`
- Modify: `tsconfig.json`

- [ ] **Step 1: Create next.config.ts**

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

export default nextConfig;
```

- [ ] **Step 2: Rewrite tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "preserve",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"],
      "@contracts/*": ["./contracts/*"],
      "@db/*": ["./db/*"]
    },
    "baseUrl": "."
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Commit**

```powershell
git add next.config.ts tsconfig.json
git commit -m "chore: add next.config.ts, rewrite tsconfig for Next.js"
```

---

### Task 3: Create app layout and root page

**Files:**
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/globals.css`

- [ ] **Step 1: Create src/app/globals.css** (copy from `src/index.css`)

Read `src/index.css` content and copy to `src/app/globals.css`.

- [ ] **Step 2: Create src/app/layout.tsx**

```tsx
import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/providers/providers";

export const metadata: Metadata = {
  title: "BeeVelt Halls",
  description: "Premium event venue booking platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Create src/app/page.tsx** (temporary, will get real content)

```tsx
export default function HomePage() {
  return <div>BeeVelt Halls</div>;
}
```

- [ ] **Step 4: Commit**

```powershell
git add src/app/layout.tsx src/app/page.tsx src/app/globals.css
git commit -m "feat: add Next.js app layout and root page"
```

---

### Task 4: Create server lib — env, db connection, auth helpers

**Files:**
- Create: `src/lib/server/env.ts`
- Create: `src/lib/server/db.ts`
- Create: `src/lib/server/auth.ts`

- [ ] **Step 1: Create src/lib/server/env.ts**

```ts
function required(name: string): string {
  const value = process.env[name];
  if (!value && process.env.NODE_ENV === "production") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value ?? "";
}

export const env = {
  jwtSecret: required("JWT_SECRET"),
  isProduction: process.env.NODE_ENV === "production",
  databaseUrl: required("DATABASE_URL"),
};
```

- [ ] **Step 2: Create src/lib/server/db.ts**

```ts
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@db/schema";
import * as relations from "@db/relations";
import { env } from "./env";

const fullSchema = { ...schema, ...relations };

let instance: ReturnType<typeof drizzle<typeof fullSchema>>;

export function getDb() {
  if (!instance) {
    const sql = neon(env.databaseUrl);
    instance = drizzle(sql, { schema: fullSchema });
  }
  return instance;
}
```

- [ ] **Step 3: Move server-side libs from api/ to src/lib/server/**

Copy these files, fixing their imports to use relative paths:
- `api/lib/session.ts` → `src/lib/server/session.ts` (no import change needed)
- `api/lib/password.ts` → `src/lib/server/password.ts` (no import change needed)
- `api/queries/users.ts` → `src/lib/server/queries/users.ts` — change `import { getDb } from "./connection"` to `import { getDb } from "../db"`
- `api/queries/connection.ts` — **do not copy** (getDb is defined in db.ts instead)

- [ ] **Step 4: Create src/lib/server/auth.ts**

```ts
import { cookies } from "next/headers";
import { verifySessionToken, signSessionToken } from "./session";
import { findUserById } from "./queries/users";
import type { User } from "@db/schema";
import { Session } from "@contracts/constants";

export async function getAuthUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(Session.cookieName)?.value;
  if (!token) return null;

  const claim = await verifySessionToken(token);
  if (!claim) return null;

  return findUserById(claim.userId);
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(Session.cookieName, token, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: Session.maxAgeMs / 1000,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(Session.cookieName, "", {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  });
}
```

- [ ] **Step 5: Commit**

```powershell
git add src/lib/server/
git commit -m "feat: add server lib (env, db, auth, session, password)"
```

---

### Task 5: Create Server Actions — auth

**Files:**
- Create: `src/lib/server/actions/auth.ts`

- [ ] **Step 1: Create src/lib/server/actions/auth.ts**

```ts
"use server";

import { z } from "zod";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { hashPassword, verifyPassword } from "../password";
import { signSessionToken } from "../session";
import { setSessionCookie, clearSessionCookie } from "../auth";
import { findUserByEmail, createUser } from "../queries/users";
import * as schema from "@db/schema";
import { Session } from "@contracts/constants";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const signupSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function login(data: { email: string; password: string }) {
  const parsed = loginSchema.parse(data);
  const user = await findUserByEmail(parsed.email);
  if (!user) throw new Error("Invalid email or password");

  const valid = await verifyPassword(parsed.password, user.passwordHash);
  if (!valid) throw new Error("Invalid email or password");

  await getDb()
    .update(schema.users)
    .set({ lastSignInAt: new Date() })
    .where(eq(schema.users.id, user.id));

  const token = await signSessionToken({ userId: user.id, email: user.email });
  await setSessionCookie(token);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  };
}

export async function signup(data: { name: string; email: string; password: string }) {
  const parsed = signupSchema.parse(data);
  const existing = await findUserByEmail(parsed.email);
  if (existing) throw new Error("Email already registered");

  const passwordHash = await hashPassword(parsed.password);
  const user = await createUser({
    email: parsed.email,
    passwordHash,
    name: parsed.name,
  });

  const token = await signSessionToken({ userId: user.id, email: user.email });
  await setSessionCookie(token);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  };
}

export async function logout() {
  await clearSessionCookie();
  return { success: true };
}
```

- [ ] **Step 2: Commit**

```powershell
git add src/lib/server/actions/auth.ts
git commit -m "feat: add auth server actions (login, signup, logout)"
```

---

### Task 6: Create Server Actions — booking, admin, calendar, payment

**Files:**
- Create: `src/lib/server/actions/booking.ts`
- Create: `src/lib/server/actions/admin.ts`
- Create: `src/lib/server/actions/calendar.ts`
- Create: `src/lib/server/actions/payment.ts`

- [ ] **Step 1: Create src/lib/server/actions/booking.ts**

```ts
"use server";

import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { getDb } from "../db";
import { getAuthUser } from "../auth";
import { bookings, bookingAddons, packages, addons } from "@db/schema";

function generateBookingRef(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `VH-${year}-${random}`;
}

const createBookingSchema = z.object({
  eventName: z.string().min(1),
  eventType: z.enum([
    "wedding", "birthday", "conference", "church",
    "corporate", "seminar", "concert", "party", "other",
  ]),
  guestCount: z.number().min(1),
  packageId: z.number(),
  eventStart: z.string(),
  eventEnd: z.string(),
  specialRequests: z.string().optional(),
  addonIds: z.array(z.number()).optional(),
});

export async function createBooking(input: z.infer<typeof createBookingSchema>) {
  const user = await getAuthUser();
  if (!user) throw new Error("Authentication required");

  const parsed = createBookingSchema.parse(input);
  const db = getDb();

  const pkg = await db
    .select()
    .from(packages)
    .where(eq(packages.id, parsed.packageId))
    .limit(1);
  if (!pkg[0]) throw new Error("Package not found");

  let subtotal = parseFloat(pkg[0].price);
  const addonPrices: { addonId: number; price: number }[] = [];

  if (parsed.addonIds && parsed.addonIds.length > 0) {
    for (const addonId of parsed.addonIds) {
      const addon = await db
        .select()
        .from(addons)
        .where(eq(addons.id, addonId))
        .limit(1);
      if (addon[0]) {
        const price = parseFloat(addon[0].price);
        subtotal += price;
        addonPrices.push({ addonId, price: parseFloat(price.toFixed(2)) });
      }
    }
  }

  const bookingRef = generateBookingRef();
  const result = await db.insert(bookings).values({
    bookingRef,
    userId: user.id,
    eventName: parsed.eventName,
    eventType: parsed.eventType,
    guestCount: parsed.guestCount,
    packageId: parsed.packageId,
    eventStart: new Date(parsed.eventStart),
    eventEnd: new Date(parsed.eventEnd),
    setupStart: new Date(new Date(parsed.eventStart).getTime() - 2 * 60 * 60 * 1000),
    teardownEnd: new Date(new Date(parsed.eventEnd).getTime() + 2 * 60 * 60 * 1000),
    specialRequests: parsed.specialRequests,
    subtotal: subtotal.toFixed(2),
    total: subtotal.toFixed(2),
    status: "pending_payment",
  }).returning();

  const bookingId = result[0].id;
  for (const ao of addonPrices) {
    await db.insert(bookingAddons).values({
      bookingId,
      addonId: ao.addonId,
      price: ao.price.toFixed(2),
    });
  }

  return { bookingId, bookingRef, total: subtotal };
}

export async function cancelBooking(id: number) {
  const user = await getAuthUser();
  if (!user) throw new Error("Authentication required");

  const db = getDb();
  const result = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, id))
    .limit(1);

  if (!result[0] || result[0].userId !== user.id) {
    throw new Error("Booking not found");
  }

  await db
    .update(bookings)
    .set({ status: "cancelled_by_customer" })
    .where(eq(bookings.id, id));

  return { success: true };
}
```

- [ ] **Step 2: Create src/lib/server/actions/admin.ts**

```ts
"use server";

import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { getDb } from "../db";
import { getAuthUser } from "../auth";
import { bookings, users } from "@db/schema";

export async function approveBooking(id: number) {
  const user = await getAuthUser();
  if (!user || user.role !== "admin") throw new Error("Forbidden");

  const db = getDb();
  await db.update(bookings).set({ status: "confirmed" }).where(eq(bookings.id, id));
  return { success: true };
}

export async function rejectBooking(id: number, reason?: string) {
  const user = await getAuthUser();
  if (!user || user.role !== "admin") throw new Error("Forbidden");

  const db = getDb();
  await db.update(bookings).set({ status: "rejected" }).where(eq(bookings.id, id));
  return { success: true };
}

const updateRoleSchema = z.object({
  userId: z.number(),
  role: z.enum(["user", "staff", "manager", "accountant", "admin"]),
});

export async function updateStaffRole(input: z.infer<typeof updateRoleSchema>) {
  const user = await getAuthUser();
  if (!user || user.role !== "admin") throw new Error("Forbidden");

  const parsed = updateRoleSchema.parse(input);
  const db = getDb();
  await db.update(users).set({ role: parsed.role }).where(eq(users.id, parsed.userId));
  return { success: true };
}
```

- [ ] **Step 3: Create src/lib/server/actions/calendar.ts**

```ts
"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { getAuthUser } from "../auth";
import { blockedDates } from "@db/schema";

export async function blockDate(input: {
  blockStart: string;
  blockEnd: string;
  reason?: string;
  showAsUnavailable?: boolean;
}) {
  const user = await getAuthUser();
  if (!user || user.role !== "admin") throw new Error("Forbidden");

  const db = getDb();
  await db.insert(blockedDates).values({
    blockStart: input.blockStart,
    blockEnd: input.blockEnd,
    reason: input.reason,
    showAsUnavailable: input.showAsUnavailable ?? true,
    createdBy: user.id,
  });
  return { success: true };
}

export async function unblockDate(id: number) {
  const user = await getAuthUser();
  if (!user || user.role !== "admin") throw new Error("Forbidden");

  const db = getDb();
  await db.delete(blockedDates).where(eq(blockedDates.id, id));
  return { success: true };
}
```

- [ ] **Step 4: Create src/lib/server/actions/payment.ts**

```ts
"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { getAuthUser } from "../auth";
import { payments, bookings } from "@db/schema";

export async function initiatePayment(bookingId: number) {
  const user = await getAuthUser();
  if (!user) throw new Error("Authentication required");

  const db = getDb();
  const booking = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1);

  if (!booking[0] || booking[0].userId !== user.id) {
    throw new Error("Booking not found");
  }

  const providerRef = `PAY-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

  await db.insert(payments).values({
    bookingId,
    provider: "paystack",
    providerRef,
    amount: booking[0].total,
    currency: "NGN",
    status: "initiated",
  });

  return {
    providerRef,
    amount: booking[0].total,
    authorizationUrl: `/api/payments/mock-callback?ref=${providerRef}`,
  };
}

export async function mockPaymentCallback(ref: string) {
  const db = getDb();
  const result = await db
    .select()
    .from(payments)
    .where(eq(payments.providerRef, ref))
    .limit(1);

  if (result[0]) {
    await db
      .update(payments)
      .set({ status: "successful", completedAt: new Date() })
      .where(eq(payments.id, result[0].id));

    await db
      .update(bookings)
      .set({ status: "confirmed" })
      .where(eq(bookings.id, result[0].bookingId));

    return { success: true, message: "Payment verified" };
  }

  return { success: false, message: "Payment not found" };
}
```

- [ ] **Step 5: Commit**

```powershell
git add src/lib/server/actions/
git commit -m "feat: add booking, admin, calendar, payment server actions"
```

---

### Task 7: Create Route Handlers — queries

**Files:**
- Create: `src/app/api/auth/me/route.ts`
- Create: `src/app/api/venue/route.ts`
- Create: `src/app/api/venue/packages/route.ts`
- Create: `src/app/api/venue/addons/route.ts`
- Create: `src/app/api/venue/availability/route.ts`
- Create: `src/app/api/booking/my/route.ts`
- Create: `src/app/api/booking/[id]/route.ts`
- Create: `src/app/api/calendar/events/route.ts`
- Create: `src/app/api/admin/stats/route.ts`
- Create: `src/app/api/admin/bookings/route.ts`
- Create: `src/app/api/admin/staff/route.ts`
- Create: `src/app/api/payment/verify/route.ts`

- [ ] **Step 1: Create auth/me handler**

Create `src/app/api/auth/me/route.ts`:
```ts
import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/server/auth";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json(null);
  return NextResponse.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });
}
```

- [ ] **Step 2: Create venue route handlers**

Create `src/app/api/venue/route.ts`:
```ts
import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";
import { venue } from "@db/schema";

export async function GET() {
  const db = getDb();
  const result = await db.select().from(venue).limit(1);
  return NextResponse.json(result[0] ?? null);
}
```

Create `src/app/api/venue/packages/route.ts`:
```ts
import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";
import { packages } from "@db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const db = getDb();
  const result = await db.select().from(packages).where(eq(packages.isActive, true));
  return NextResponse.json(result);
}
```

Create `src/app/api/venue/addons/route.ts`:
```ts
import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";
import { addons } from "@db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const db = getDb();
  const result = await db.select().from(addons).where(eq(addons.isActive, true));
  return NextResponse.json(result);
}
```

Create `src/app/api/venue/availability/route.ts`:
```ts
import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";
import { bookings, blockedDates } from "@db/schema";
import { and, gte, lte, notInArray } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  if (!start || !end) return NextResponse.json({ error: "start and end required" }, { status: 400 });

  const db = getDb();
  const startDate = new Date(start);
  const endDate = new Date(end);

  const conflicts = await db
    .select()
    .from(bookings)
    .where(
      and(
        notInArray(bookings.status, [
          "cancelled_by_customer", "cancelled_by_staff", "rejected",
        ]),
        lte(bookings.eventStart, endDate),
        gte(bookings.eventEnd, startDate),
      )
    )
    .limit(1);

  const blocks = await db
    .select()
    .from(blockedDates)
    .where(
      and(
        lte(blockedDates.blockStart, endDate.toISOString().split("T")[0]),
        gte(blockedDates.blockEnd, startDate.toISOString().split("T")[0]),
      )
    )
    .limit(1);

  return NextResponse.json({
    available: conflicts.length === 0 && blocks.length === 0,
    conflicts: conflicts.length > 0,
    blocked: blocks.length > 0,
  });
}
```

- [ ] **Step 3: Create booking route handlers**

Create `src/app/api/booking/my/route.ts`:
```ts
import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";
import { getAuthUser } from "@/lib/server/auth";
import { bookings } from "@db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const result = await db
    .select()
    .from(bookings)
    .where(eq(bookings.userId, user.id))
    .orderBy(desc(bookings.createdAt));

  return NextResponse.json(result);
}
```

Create `src/app/api/booking/[id]/route.ts`:
```ts
import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";
import { getAuthUser } from "@/lib/server/auth";
import { bookings, bookingAddons } from "@db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const bookingId = parseInt(id);
  const result = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1);

  if (!result[0]) return NextResponse.json(null);
  if (result[0].userId !== user.id && user.role === "user") {
    return NextResponse.json(null);
  }

  const bAddons = await db
    .select()
    .from(bookingAddons)
    .where(eq(bookingAddons.bookingId, bookingId));

  return NextResponse.json({ ...result[0], addons: bAddons });
}
```

- [ ] **Step 4: Create calendar route handler**

Create `src/app/api/calendar/events/route.ts`:
```ts
import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";
import { getAuthUser } from "@/lib/server/auth";
import { bookings, blockedDates } from "@db/schema";
import { and, gte, lte, notInArray } from "drizzle-orm";

export async function GET(request: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const month = parseInt(searchParams.get("month") || "0");
  const year = parseInt(searchParams.get("year") || "0");
  if (!month || !year) return NextResponse.json({ error: "month and year required" }, { status: 400 });

  const db = getDb();
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59);

  const bookingEvents = await db
    .select()
    .from(bookings)
    .where(
      and(
        notInArray(bookings.status, [
          "cancelled_by_customer", "cancelled_by_staff", "rejected",
        ]),
        lte(bookings.eventStart, endOfMonth),
        gte(bookings.eventEnd, startOfMonth),
      )
    );

  const blocked = await db
    .select()
    .from(blockedDates)
    .where(
      and(
        lte(blockedDates.blockStart, endOfMonth.toISOString().split("T")[0]),
        gte(blockedDates.blockEnd, startOfMonth.toISOString().split("T")[0]),
      )
    );

  return NextResponse.json({ bookings: bookingEvents, blocked });
}
```

- [ ] **Step 5: Create admin route handlers**

Create `src/app/api/admin/stats/route.ts`:
```ts
import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";
import { getAuthUser } from "@/lib/server/auth";
import { bookings, payments } from "@db/schema";
import { eq, desc, sql, count, and, gte } from "drizzle-orm";

export async function GET() {
  const user = await getAuthUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const db = getDb();

  const revenueResult = await db
    .select({ total: sql<number>`COALESCE(SUM(${payments.amount}), 0)` })
    .from(payments)
    .where(eq(payments.status, "successful"));

  const bookingsCount = await db.select({ count: count() }).from(bookings);
  const pendingCount = await db
    .select({ count: count() })
    .from(bookings)
    .where(eq(bookings.status, "pending_approval"));

  const upcomingCount = await db
    .select({ count: count() })
    .from(bookings)
    .where(and(eq(bookings.status, "confirmed"), gte(bookings.eventStart, new Date())));

  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const monthlyRevenue = await db
    .select({
      month: sql<string>`to_char(${payments.initiatedAt}, 'YYYY-MM')`,
      total: sql<number>`COALESCE(SUM(${payments.amount}), 0)`,
    })
    .from(payments)
    .where(and(eq(payments.status, "successful"), gte(payments.initiatedAt, sixMonthsAgo)))
    .groupBy(sql`to_char(${payments.initiatedAt}, 'YYYY-MM')`);

  return NextResponse.json({
    totalRevenue: revenueResult[0]?.total ?? 0,
    totalBookings: bookingsCount[0]?.count ?? 0,
    pendingApprovals: pendingCount[0]?.count ?? 0,
    upcomingEvents: upcomingCount[0]?.count ?? 0,
    monthlyRevenue,
  });
}
```

Create `src/app/api/admin/bookings/route.ts`:
```ts
import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";
import { getAuthUser } from "@/lib/server/auth";
import { bookings } from "@db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  const user = await getAuthUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const db = getDb();
  const result = await db.select().from(bookings).orderBy(desc(bookings.createdAt));
  return NextResponse.json(result);
}
```

Create `src/app/api/admin/staff/route.ts`:
```ts
import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";
import { getAuthUser } from "@/lib/server/auth";
import { users } from "@db/schema";
import { sql } from "drizzle-orm";

export async function GET() {
  const user = await getAuthUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const db = getDb();
  const result = await db
    .select()
    .from(users)
    .where(sql`${users.role} IN ('staff', 'manager', 'accountant', 'admin')`);

  return NextResponse.json(result);
}
```

- [ ] **Step 6: Create payment route handler**

Create `src/app/api/payment/verify/route.ts`:
```ts
import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";
import { payments } from "@db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get("reference");
  if (!reference) return NextResponse.json({ status: "not_found" });

  const db = getDb();
  const result = await db
    .select()
    .from(payments)
    .where(eq(payments.providerRef, reference))
    .limit(1);

  if (!result[0]) return NextResponse.json({ status: "not_found" });
  return NextResponse.json({ status: result[0].status, payment: result[0] });
}
```

- [ ] **Step 7: Commit**

```powershell
git add src/app/api/
git commit -m "feat: add all route handlers (auth, venue, booking, calendar, admin, payment)"
```

---

### Task 8: Create client data layer — api-client and providers

**Files:**
- Create: `src/lib/api-client.ts`
- Create: `src/providers/providers.tsx`

- [ ] **Step 1: Create src/lib/api-client.ts**

```ts
export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(path, { credentials: "include" });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json();
}
```

- [ ] **Step 2: Create src/providers/providers.tsx**

This replaces `src/providers/trpc.tsx` with a plain QueryClient provider:

```tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

- [ ] **Step 3: Commit**

```powershell
git add src/lib/api-client.ts src/providers/providers.tsx
git commit -m "feat: add api-client and QueryClient providers"
```

---

### Task 9: Update useAuth hook for Next.js

**Files:**
- Modify: `src/hooks/useAuth.ts`

- [ ] **Step 1: Rewrite src/hooks/useAuth.ts**

Replace the tRPC-dependent hook with one using React Query + Server Actions:

```ts
"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { LOGIN_PATH } from "@/const";
import { apiGet } from "@/lib/api-client";
import { logout as logoutAction } from "@/lib/server/actions/auth";

type User = {
  id: number;
  email: string;
  name: string | null;
  role: string;
};

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = LOGIN_PATH } = options ?? {};
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: user, isLoading, error, refetch } = useQuery<User | null>({
    queryKey: ["auth", "me"],
    queryFn: () => apiGet<User | null>("/api/auth/me"),
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const logout = useCallback(async () => {
    await logoutAction();
    queryClient.invalidateQueries();
    router.push(redirectPath);
  }, [queryClient, router, redirectPath]);

  useEffect(() => {
    if (redirectOnUnauthenticated && !isLoading && !user) {
      if (window.location.pathname !== redirectPath) {
        router.push(redirectPath);
      }
    }
  }, [redirectOnUnauthenticated, isLoading, user, router, redirectPath]);

  return useMemo(
    () => ({
      user: user ?? null,
      isAuthenticated: !!user,
      isLoading,
      error,
      logout,
      refresh: refetch,
    }),
    [user, isLoading, error, logout, refetch],
  );
}
```

- [ ] **Step 2: Commit**

```powershell
git add src/hooks/useAuth.ts
git commit -m "refactor: rewrite useAuth hook for Next.js (no tRPC)"
```

---

### Task 10: Migrate app pages — Home and Booking

**Files:**
- Create: `src/app/page.tsx` (replace placeholder)
- Create: `src/app/book/page.tsx`

- [ ] **Step 1: Create src/app/page.tsx**

Copy content from `src/pages/Home.tsx`. Change the import path — the component uses `import Navbar from "@/components/layout/Navbar"` which already works with the `@/*` path alias. Mark the page as a client component if it uses any hooks or interactivity:

```tsx
"use client";

import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/sections/Hero";
import VenueSection from "@/components/sections/VenueSection";
import PackagesSection from "@/components/sections/PackagesSection";
import CalendarPreview from "@/components/sections/CalendarPreview";
import Footer from "@/components/sections/Footer";

export default function HomePage() {
  return (
    <main className="relative min-h-screen bg-[#030305]">
      <Navbar />
      <Hero />
      <VenueSection />
      <PackagesSection />
      <CalendarPreview />
      <Footer />
    </main>
  );
}
```

- [ ] **Step 2: Create src/app/book/page.tsx**

Copy content from `src/pages/Booking.tsx`. Changes needed:
- Replace `import { trpc } from "@/providers/trpc"` with `import { useQuery, useMutation } from "@tanstack/react-query"` and `import { apiGet } from "@/lib/api-client"` and `import { createBooking } from "@/lib/server/actions/booking"` and `import { initiatePayment } from "@/lib/server/actions/payment"` and `import { useRouter } from "next/navigation"` and `import Link from "next/link"`
- Replace `trpc.venue.packages.useQuery()` → `useQuery({ queryKey: ["packages"], queryFn: () => apiGet<Package[]>("/api/venue/packages") })`
- Replace `trpc.venue.addons.useQuery()` → `useQuery({ queryKey: ["addons"], queryFn: () => apiGet<Addon[]>("/api/venue/addons") })`
- Replace `trpc.booking.create.useMutation()` → wrap `createBooking` in a direct call with `useTransition`
- Replace `trpc.payment.initiate.useMutation()` → wrap `initiatePayment` in a direct call
- Replace `Link` from `react-router` → `Link` from `next/link`
- Add `"use client"` directive
- Remove `import { Link } from "react-router"` and `import { trpc } from "@/providers/trpc"`

- [ ] **Step 3: Commit**

```powershell
git add src/app/page.tsx src/app/book/page.tsx
git commit -m "feat: migrate Home and Booking pages to Next.js"
```

---

### Task 11: Migrate app pages — Login, Signup, Dashboard, NotFound

**Files:**
- Create: `src/app/login/page.tsx`
- Create: `src/app/signup/page.tsx`
- Create: `src/app/dashboard/page.tsx`
- Create: `src/app/not-found.tsx`

- [ ] **Step 1: Create src/app/login/page.tsx**

Copy from `src/pages/Login.tsx`. Changes:
- Replace `import { Link, useNavigate } from "react-router"` with `import Link from "next/link"` and `import { useRouter } from "next/navigation"`
- Replace `import { trpc } from "@/providers/trpc"` with `import { login } from "@/lib/server/actions/auth"` and `import { useTransition } from "react"`
- Replace `const navigate = useNavigate()` with `const router = useRouter()`
- Replace `const loginMutation = trpc.auth.login.useMutation({ onSuccess: () => navigate("/"), onError: ... })` with a `startTransition` wrapper calling `login()`
- Add `"use client"` directive
- Replace all `navigate(...)` calls with `router.push(...)`

- [ ] **Step 2: Create src/app/signup/page.tsx**

Copy from `src/pages/Signup.tsx`. Same pattern as Login:
- Replace `react-router` imports with `next/link` and `next/navigation`
- Replace `trpc.auth.signup.useMutation()` with direct `signup()` Server Action call
- Add `"use client"` directive

- [ ] **Step 3: Create src/app/dashboard/page.tsx**

Copy from `src/pages/Dashboard.tsx`. Changes:
- Replace `import { Link } from "react-router"` with `import Link from "next/link"`
- Replace `import { trpc } from "@/providers/trpc"` with React Query imports + Server Action imports
- Replace `trpc.booking.myBookings.useQuery()` → `useQuery({ queryKey: ["my-bookings"], queryFn: () => apiGet("/api/booking/my") })`
- Replace `trpc.admin.bookings.useQuery()` → `useQuery({ queryKey: ["admin-bookings"], queryFn: () => apiGet("/api/admin/bookings") })`
- Replace `trpc.admin.stats.useQuery()` → `useQuery({ queryKey: ["admin-stats"], queryFn: () => apiGet("/api/admin/stats") })`
- Replace mutation hooks (`trpc.admin.approveBooking.useMutation()`) with direct Server Action calls
- Add `"use client"` directive

- [ ] **Step 4: Create src/app/not-found.tsx**

Copy from `src/pages/NotFound.tsx`. Changes:
- Replace `react-router` Link with `next/link`
- Add `"use client"` directive if needed
- Import `Link from "next/link"` instead of `react-router`

- [ ] **Step 5: Commit**

```powershell
git add src/app/login/ src/app/signup/ src/app/dashboard/ src/app/not-found.tsx
git commit -m "feat: migrate Login, Signup, Dashboard, NotFound to Next.js"
```

---

### Task 12: Create auth middleware

**Files:**
- Create: `src/middleware.ts`

- [ ] **Step 1: Create src/middleware.ts**

```ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedPaths = ["/dashboard", "/book"];
const authPaths = ["/login", "/signup"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get("session")?.value;

  // Redirect authenticated users away from auth pages
  if (authPaths.some((p) => pathname.startsWith(p)) && sessionCookie) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Redirect unauthenticated users to login
  if (protectedPaths.some((p) => pathname.startsWith(p)) && !sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/book/:path*", "/login", "/signup"],
};
```

- [ ] **Step 2: Commit**

```powershell
git add src/middleware.ts
git commit -m "feat: add auth middleware for protected routes"
```

---

### Task 13: Delete old files

**Files:**
- Delete: `api/` directory
- Delete: `vite.config.ts`
- Delete: `index.html`
- Delete: `src/main.tsx`
- Delete: `src/App.tsx`
- Delete: `src/providers/trpc.tsx`
- Delete: `src/pages/` directory (files are moved to app/, the old ones should be removed)
- Delete: `tsconfig.server.json`, `tsconfig.app.json`, `tsconfig.node.json`
- Delete: `drizzle.config.ts` if not needed (check — Drizzle Kit may still need it)
- Delete: `vitest.config.ts` if tests not yet ported

- [ ] **Step 1: Delete old framework files**

```powershell
Remove-Item -Recurse -Force api
Remove-Item -Force vite.config.ts
Remove-Item -Force index.html
Remove-Item -Force src/main.tsx
Remove-Item -Force src/App.tsx
Remove-Item -Force src/providers/trpc.tsx
Remove-Item -Recurse -Force src/pages
Remove-Item -Force tsconfig.server.json
Remove-Item -Force tsconfig.app.json
Remove-Item -Force tsconfig.node.json
```

- [ ] **Step 2: Remove unused const file**

Check if `src/const.ts` is still needed. It defines `LOGIN_PATH` — the useAuth hook still uses it, so keep it.

- [ ] **Step 3: Commit**

```powershell
git add -A
git commit -m "chore: remove old Vite/Hono/tRPC files"
```

---

### Task 14: Build and fix

- [ ] **Step 1: Run next build**

```powershell
npm run build
```

Expected: Clean build with no errors. If errors appear, fix them inline (likely import path issues, missing `"use client"` directives, or type mismatches).

- [ ] **Step 2: Run TypeScript check**

```powershell
npm run check
```

Expected: No type errors.

- [ ] **Step 3: Commit any fixes**

```powershell
git add -A
git commit -m "fix: resolve build and type errors after migration"
```
