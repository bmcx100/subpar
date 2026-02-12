# 1st Improvements — Changes from Base Next.js Scaffold

## Technical Changes

### Database & ORM
- Added **Prisma 7** with PostgreSQL via `@prisma/adapter-pg` and `pg.Pool` for TCP connections
- Prisma local dev server (`npx prisma dev`) on ports 51213-51215
- **11 database models**: User, Account, Session, VerificationToken, GolfSession, GolfValue, Routine, RoutineDay, Exercise, RoutineDayExercise, StrengthSession, StrengthSet
- **2 migrations**: `init` (full schema) and `add_exercise_targets_and_supersets` (routine detail fields)
- **Seed script** (`prisma/seed.ts`): 16 default exercises (Bench Press, Squat, Deadlift, Overhead Press, Barbell Row, Pull-Up, Chin-Up, Dumbbell Curl, Tricep Pushdown, Lateral Raise, Face Pull, Leg Press, Romanian Deadlift, Lunges, Calf Raise, Plank)
- Generated Prisma client output to `src/generated/prisma`
- Global singleton pattern in `src/lib/prisma.ts` to prevent multiple clients in dev

### Authentication
- **NextAuth v5** (beta) with `PrismaAdapter`
- Credentials provider with auto-create dev user (`dev@subpar.local`) for local development — replaces Google OAuth
- JWT session strategy (required for Credentials provider)
- Custom callbacks injecting `user.id` into JWT token and session object
- Middleware (`src/middleware.ts`) protecting all routes except `/api`, `/_next`, static files, `/sign-in`

### Core Logic Library (`src/lib/core-logic.ts`)
- ~430 lines of pure, framework-agnostic business logic
- **Golf PR calculations**: `computeGolfPRSummaries()` — all-time and last-N-session bests for Driver Max Dominant and Light Normal Dominant metrics
- **Strength weight progression**: `suggestNextWeightForExercise()` — 3x8-12 double progression algorithm (hit 3×12 → increase weight by user's increment)
- **Weight conversions**: `kgToLb()`, `lbToKg()`, `formatWeightForUnit()`, `normalizeStrengthWeightToKg()`
- **Golf speed validation**: `validateGolfInputString()` — 0-999.9 mph with max 1 decimal
- **Golf protocol data** (`src/lib/golf-protocol.ts`): SuperSpeed Level 1 — 14 swings across NORMAL, STEP, MAX_NORMAL, DRIVER blocks

### Schema: Exercise Targets & Supersets
Added 5 fields to `RoutineDayExercise`:
- `targetSets Int?` — defaults to 3 when null
- `targetReps Int?` — defaults to 10 when null
- `targetWeightKg Decimal? @db.Decimal(8,3)` — null = no target weight
- `isBodyweight Boolean @default(false)` — marks exercise as bodyweight
- `supersetGroupId String?` — exercises sharing the same non-null UUID form a superset group

### Server Actions
- **Golf**: `saveGolfSession()` — creates GolfSession + GolfValue records
- **Strength session**: `saveStrengthSession()` — creates StrengthSession + StrengthSet records
- **Routine CRUD**: `saveRoutine()`, `getRoutine()` — full create/update with day and exercise relationships, weight conversion to kg on save
- **Exercise CRUD**: `fetchExercises()` (default + user-created), `createExercise()` (custom)
- **Settings**: `updateSettings()` — weight unit, increments, timer preferences

### Dependencies Added
- `@dnd-kit/core`, `@dnd-kit/sortable` — drag-and-drop for exercise reordering
- `cmdk` — command palette for exercise search
- `lucide-react` — icon library
- `radix-ui` — headless UI primitives
- `sonner` — toast notifications
- `next-auth`, `@auth/prisma-adapter` — authentication
- `@prisma/client`, `@prisma/adapter-pg`, `pg` — database
- `class-variance-authority`, `clsx`, `tailwind-merge` — styling utilities
- 13 shadcn/ui components: Button, Card, Input, Label, Badge, Accordion, Tabs, Dialog, Sheet, DropdownMenu, Avatar, Command, RadioGroup, Switch, Separator

---

## Style & UI Changes

### Global CSS (`src/app/globals.css`)
- Replaced default Next.js styles with Tailwind CSS v4 + shadcn theme
- **OkLch color system** for perceptually uniform light/dark themes
- **Hidden scrollbars** globally (`scrollbar-width: none` + `::-webkit-scrollbar { display: none }`)

### Card Component (`src/components/ui/card.tsx`)
- Tightened padding from `py-6 gap-6 px-6` → `py-3 gap-3 px-4` for compact mobile feel

### Fixed Bottom Button Bar Pattern
Consistent pattern used on 3 pages:
```
fixed bottom-16 left-0 right-0 z-40 border-t bg-background px-4 pt-2 pb-2
```
- Sits above bottom nav (h-16 = 64px)
- Content areas use `pb-24` or `pb-48` to avoid occlusion
- Used on: strength start, session logger, routine builder

### Green CTA Button Pattern
Primary actions: `bg-green-600 hover:bg-green-700 text-white`
- "Let's Go!!!" on start page
- "Set Complete" in session logger
- "Save Routine" when dirty
- "Add N Exercises" when exercises selected

### Collapsed / Expanded Exercise Cards
- **Collapsed**: Single row — exercise name, superset badge, mini set-completion checkboxes (4×4px green squares), `opacity-50`
- **Expanded**: Full `ExerciseLogCard` with editable weight/reps per set, notes toggle, suggested weight badge

### Superset Color Coding
- Groups get colored left borders and `SS-A/B/C/D` badges
- Colors: A=blue, B=purple, C=amber, D=emerald (each with `/20` bg, `/30` border)

### Dirty State Save Button
- Secondary variant when no changes
- Green variant when unsaved changes detected
- Resets to secondary on successful save
- `beforeunload` warning prevents accidental navigation

### App Shell (`src/components/app-shell.tsx`)
- **Top header**: Sticky, hamburger menu (Sheet drawer), dynamic page title, avatar dropdown with sign-out
- **Bottom tab bar**: Fixed, 4 tabs (Home, Golf, Strength, Settings), active state highlight
- Main content padded with `pb-20` for bottom nav clearance

---

## User Experience Flow Changes

### Sign-In
- **Before**: Google OAuth required
- **After**: Single "Enter" button auto-creates/finds dev user, instant access

### Dashboard (`/`)
- Two PR metric cards (Driver Max, Light Normal Dominant) with all-time and last-7 bests
- Quick-start buttons for Golf and Strength sessions
- Tabbed recent sessions (Golf / Strength) showing last 3 with key metrics

### Golf Training Flow
1. **Start** (`/golf/start`): Protocol description + "Begin Session" button
2. **Session** (`/golf/session`): Guided 14-swing flow with numeric keypad input, speed display, save/skip per swing
3. **Rest Timer**: 60-second countdown between swings with audio tone (880Hz) and vibration pattern on completion
4. **Summary** (`/golf/summary/[id]`): Session metrics with PR badges, all entries grouped by block in accordion
5. **History** (`/golf/history`): Chronological session list with driver and light normal speeds

### Strength Training Flow
1. **Start** (`/strength/start`): Shows next workout day (auto-cycles based on last completed session)
   - "Change Day" opens radio dialog to override
   - "Edit Routine" links to builder
   - "Let's Go!!!" begins session
2. **Routine Builder** (`/strength/routine`):
   - Routine name + sessions count on one line
   - Accordion day cards (A, B, C...) auto-created based on session count
   - Drag-and-drop exercise reordering within each day
   - Settings icon (SlidersHorizontal) per exercise expands inline panel: sets, reps, weight inputs
   - Weight input accepts empty/0 for no-weight exercises (summary shows `3×10` vs `3×10 @ 30lbs`)
   - Superset checkbox in settings panel — checking it reveals checkboxes on all exercises in that day
   - Select 2+ → "Group as Superset" button appears
   - Multi-select exercise picker: search, checkboxes, custom exercise creation, bulk sets/reps/weight defaults
   - Fixed "Save Routine" button (green when dirty, secondary when clean)
   - `beforeunload` warning on unsaved changes
3. **Session Logger** (`/strength/session?dayId=...`):
   - Header: day label, date, "Exercise X of Y — Set Z of W"
   - One exercise expanded at a time, rest shown as collapsed cards with set-completion indicators
   - Collapsed cards clickable to jump, "Up next" label on next exercise
   - **Superset flow**: exercises in a group alternate sets (A set 1 → B set 1 → A set 2 → B set 2...)
   - Dynamic set count: history length > routine `targetSets` > default 3
   - Auto-fill priority: last session values > routine targets > app defaults (30lbs / 10 reps)
   - Per-set completion checkboxes (green on complete)
   - "Set Complete" button auto-checks next unchecked set, advances flow
   - "Next Exercise" skips to next different exercise
   - "Finish Session" saves all sets to DB, navigates to dashboard
   - Per-exercise notes (toggle via message icon), session notes on finish

### Exercise Picker
- **Before**: Click exercise → immediately added, dialog closes
- **After**: Checkbox multi-select, search filtering, create custom exercises inline, set shared defaults (sets/reps/weight) for all selected, green "Add N Exercises" button

### Settings (`/settings`)
- Weight unit toggle: LB / KG (RadioGroup)
- Progression increments: separate LB and KG increment inputs
- Timer sound and vibration switches
