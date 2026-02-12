# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Subpar is a mobile-first fitness tracking web app for golf swing speed training (SuperSpeed Level 1 protocol) and strength training with progressive overload. Target audience is men 40+. Currently an MVP, planned to become a paid SaaS.

## Commands

```bash
npm run dev          # Start dev server (Next.js)
npm run build        # Production build
npm run lint         # ESLint
npx prisma migrate dev    # Run/create migrations
npx prisma db seed        # Seed default exercises (16 exercises)
npx prisma generate       # Regenerate Prisma client
npx shadcn@latest add <component>  # Add shadcn/ui component
```

## Tech Stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS 4, shadcn/ui (new-york style, lucide icons)
- **Database:** PostgreSQL via Prisma 7 ORM (@prisma/adapter-pg)
- **Auth:** NextAuth v5 (beta) with Google OAuth, Prisma adapter for DB sessions
- **Key libs:** @dnd-kit (drag-drop), cmdk (command palette), sonner (toasts)

## Architecture

### Routing & Auth

All authenticated routes live under `src/app/(app)/` (route group). The middleware (`src/middleware.ts`) checks for the `authjs.session-token` cookie and redirects unauthenticated users to `/sign-in`. The root layout wraps the app with NextAuth's `SessionProvider`.

**Route structure:**
- `/` — Dashboard (metrics, quick actions, recent sessions)
- `/golf/start → /golf/session → /golf/summary/[id]` — Golf training flow
- `/golf/history` — All golf sessions
- `/strength/routine` — Routine builder (drag-drop exercise reordering)
- `/strength/start → /strength/session` — Strength training flow
- `/settings` — User preferences (units, increments, timer)
- `/sign-in` — Google OAuth (unprotected)

### Data Flow Pattern

Pages are **server components** that fetch data (auth + DB queries via Prisma). Mutations use **server actions** (`actions.ts` files colocated with pages). Client components (`"use client"`) handle interactivity (rest timer, numeric keypad, drag-drop). Each route segment has a `loading.tsx` for streaming/suspense.

### Core Business Logic

`src/lib/core-logic.ts` contains **pure functions** with no dependencies — golf PR calculations, strength progression suggestions, weight unit conversions, input validation. This is the single source of truth for domain logic.

- Golf speeds stored as `speedMphTenths` (integer, value × 10) for precision
- Strength weights stored internally in kg, displayed in user's preferred unit
- Progression rule: if all 3 sets hit ≥12 reps → suggest weight + increment

### Golf Protocol

`src/lib/golf-protocol.ts` defines the SuperSpeed Level 1 sequence (14 swings across 4 blocks: Normal, Step, Max Normal, Driver). The guided session logger walks through each swing with a 60-second rest timer between entries.

### Key Files

- `src/lib/auth.ts` — NextAuth config (Google provider, Prisma adapter, callbacks)
- `src/lib/prisma.ts` — Prisma singleton (global cache in dev, fresh in prod)
- `src/lib/utils.ts` — shadcn `cn()` class merge utility
- `src/components/app-shell.tsx` — Top nav + bottom nav layout wrapper
- `prisma/schema.prisma` — Complete data model (User, GolfSession, GolfValue, Routine, RoutineDay, Exercise, StrengthSession, StrengthSet)
- `prisma/seed.ts` — Seeds 16 default exercises

### Component Conventions

Custom components live in `src/components/`. shadcn/ui primitives live in `src/components/ui/`. Path alias `@/` maps to `src/`. Components use `class-variance-authority` for variants and `tailwind-merge` via `cn()` for class composition.

## Design Constraints

- **Mobile-first:** 375px (iPhone SE) baseline, large tap targets (44×44px min), bottom nav for primary navigation, one primary action per screen
- **Minimal taps:** numeric keypad for speed input, pre-filled weights from last session
- **No scope creep:** no 1RM calculator, no auto-deload, no billing, no push notifications (per requirements.txt)

## Environment Variables

Required in `.env`: `DATABASE_URL`, `AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
