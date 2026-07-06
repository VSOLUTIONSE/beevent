# BeeVent Halls — Event Centre Booking Platform

A full-stack event venue booking platform for managing reservations, packages, add-on services, payments, and staff operations.

## Features

- **Venue showcase** — Home page with hero, venue details, packages, and availability calendar
- **Multi-step booking** — Select a date, choose a package, add extras, and pay — all in one flow
- **User authentication** — JWT-based email/password signup and login with Sonner toast notifications
- **User dashboard** — View your bookings, check status, and manage profile settings
- **Admin dashboard** — Oversee all bookings, approve or reject requests, view revenue analytics and monthly trends
- **Staff management** — Assign roles (staff, manager, accountant, admin) and track activity
- **Payment integration** — Paystack-powered payments with secure SSL encryption
- **Calendar management** — View availability, manage blocked dates
- **Add-on services** — Optional extras (decor, AV, power backup) per booking
- **File uploads** — S3 presigned URL support for event briefs and media

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Tailwind CSS v3, Next.js 16 (App Router) |
| Animation | GSAP, Framer Motion, Lenis |
| Backend | Next.js Server Actions + API Routes |
| Database | Neon (Serverless Postgres) via Drizzle ORM |
| Auth | JWT (email + password, jose) with logout confirmation dialog |
| Payments | Paystack |
| File storage | AWS S3 (presigned URLs) |
| Validation | Zod |
| Charts | Recharts |
| UI | Custom glassmorphism design system (Radix Primitives) |
| Build | Next.js (Turbopack) |

## Getting started

```
npm install
cp .env.example .env   # fill in DATABASE_URL and JWT_SECRET
npm run db:generate
npm run db:migrate
npm run dev
```

## Project structure

```
src/         — Next.js App Router pages, components, design system
db/          — Drizzle schema, relations, migrations, seed data
contracts/   — Shared types, constants, and error definitions
public/      — Static assets
```
