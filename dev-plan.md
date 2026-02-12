# Subpar — Implementation Plan

> A mobile-first fitness tracking app for golf speed training (SuperSpeed) and strength training with progressive overload.

**Tech Stack:** Next.js (App Router), TypeScript, Prisma, PostgreSQL, NextAuth, shadcn/ui, Tailwind CSS, dnd-kit (drag-and-drop), Sonner (toasts)

---

## Phase 0: Project Scaffolding

### Step 1 — Initialize the Next.js project
- Run `npx create-next-app@latest` with TypeScript, Tailwind CSS, ESLint, and the App Router enabled.
- Confirm the project runs locally with `npm run dev`.

### Step 2 — Install core dependencies
- `prisma` and `@prisma/client` for the database ORM.
- `next-auth` for authentication (with the Prisma adapter: `@auth/prisma-adapter`).
- `shadcn/ui` — run the shadcn-ui init command and configure it (sets up `components.json`, `lib/utils.ts`, CSS variables).
- `@dnd-kit/core` and `@dnd-kit/sortable` for the routine builder's drag-and-drop exercise reordering.
- `sonner` for toast notifications (PR alerts, save confirmations).

### Step 3 — Set up Prisma
- Run `npx prisma init` to create the `prisma/` folder and `.env` file.
- Add your PostgreSQL connection string to `.env` as `DATABASE_URL`.
- Copy the full schema from `brainstorm.txt` (lines 445–683) into `prisma/schema.prisma`. This includes all enums (`WeightUnit`, `GolfBlock`, `GolfStick`, `Side`, `SubscriptionStatus`) and all models (`User`, `Account`, `Session`, `VerificationToken`, `GolfSession`, `GolfValue`, `Routine`, `RoutineDay`, `Exercise`, `RoutineDayExercise`, `StrengthSession`, `StrengthSet`).
- Run `npx prisma migrate dev --name init` to create and apply the initial migration.
- Run `npx prisma generate` to generate the Prisma Client.

### Step 4 — Set up NextAuth
- Create the NextAuth route handler at `app/api/auth/[...nextauth]/route.ts`.
- Configure at least one OAuth provider (Google is a good starting point).
- Use the Prisma adapter so that users, accounts, and sessions are stored in the database automatically.
- Create a shared `auth.ts` helper at the project root (or `lib/auth.ts`) that exports `getServerSession` with your auth options, so any server component or API route can check who's logged in.

### Step 5 — Create the core logic module
- Create `lib/core-logic.ts` and paste in the pure TypeScript functions from `brainstorm.txt` (lines 686–1116). This includes:
  - Type definitions (`GolfMetricKey`, `GolfSessionMetrics`, `GolfPRSummary`, `StrengthSet`, `StrengthSuggestion`, etc.)
  - Helper functions (`clampInt`, `roundTo`, `mphTenthsToNumber`, `mphNumberToTenths`, `daysBetween`, `kgToLb`, `lbToKg`, `formatWeightForUnit`)
  - Golf PR algorithm (`computeGolfPRSummaries`, `golfPRSummaryToDisplay`)
  - Strength progression algorithm (`suggestNextWeightForExercise`, `suggestNextWeightsForExercises`)
  - Validation utilities (`validateGolfInputString`, `normalizeStrengthWeightToKg`)
- Do **not** modify these functions yet — just get them in place.

### Step 6 — Create a shared Prisma client singleton
- Create `lib/prisma.ts` that exports a single `PrismaClient` instance (use the standard "global singleton" pattern to avoid creating multiple clients in development).

### Step 7 — Seed default exercises
- Create `prisma/seed.ts` that inserts common strength exercises (`Bench Press`, `Squat`, `Deadlift`, `Overhead Press`, `Barbell Row`, etc.) with `isDefault: true` and `createdByUserId: null`.
- Add a `"prisma": { "seed": "ts-node prisma/seed.ts" }` entry to `package.json`.
- Run `npx prisma db seed` to populate the exercises table.

---

## Phase 1: Shared Layout & Navigation

### Step 8 — Build the AppShell layout
- Create a layout component that wraps every page. It should render:
  - **TopNav** (mobile): a sticky top bar with a `Sheet` (hamburger menu), the current page title, and a `UserMenu` (avatar dropdown with sign-out).
  - **Container**: the main content area with horizontal padding and a max-width for larger screens.
  - **BottomNav** (mobile): a fixed bottom tab bar with four tabs — Dashboard, Golf, Strength, Settings. Use icons and labels. Highlight the active tab based on the current route.
- shadcn components used: `Sheet`, `Button`, `DropdownMenu`, `Separator`.
- The bottom nav should map to these route groups:
  - `/` — Dashboard
  - `/golf` — Golf section
  - `/strength` — Strength section
  - `/settings` — Settings

### Step 9 — Protect routes
- Create a middleware (`middleware.ts` at the project root) or use a layout-level server check that redirects unauthenticated users to a sign-in page.
- Create a simple sign-in page at `app/sign-in/page.tsx` with OAuth buttons.

---

## Phase 2: Settings Screen (Build First — Other Screens Depend on It)

### Step 10 — Build the Settings page (`app/settings/page.tsx`)
This is a server component that fetches the current user's settings and passes them to a client form.

- **Units toggle**: `RadioGroup` or `Tabs` to switch between LB and KG. This updates `user.weightUnit`.
- **Progression increments**: Two `Input` fields — one for LB increment, one for KG increment. These update `user.incrementLb` and `user.incrementKg`.
- **Timer toggles**: Two `Switch` components — "Sound" (`user.timerSound`) and "Vibration" (`user.timerVibrate`).
- On change, submit via a Server Action (or API route) that updates the `User` record in the database.
- Show a toast ("Settings saved") on success using Sonner.
- shadcn components: `Card`, `RadioGroup`, `Switch`, `Input`, `Label`, `Toast`.

---

## Phase 3: Dashboard

### Step 11 — Create the MetricCard component
- Reusable card that takes: a big number (e.g., `108.4 mph`), a label (e.g., `"All-Time PR"`), and optional subtext lines (e.g., `"Last 7 best: 105.9"`, `"Last 7 = 18 days"`).
- Uses shadcn `Card`, `CardHeader`, `CardContent`, `Badge`.
- The Driver Max card should have more visual weight (larger font, bolder colors) than the Light Normal Dominant card.

### Step 12 — Build the Dashboard page (`app/page.tsx`)
- **Top Section**: Fetch the user's golf sessions from the database. Pass them through `computeGolfPRSummaries()` and `golfPRSummaryToDisplay()` from `lib/core-logic.ts`. Render two `MetricCard` components — one for Driver Max Dominant, one for Light Normal Dominant. Show "No data yet" states if the user has no sessions.
- **Middle Section**: Two primary `Button` components — "Start Golf Session" (links to `/golf/start`) and "Start Strength Session" (links to `/strength/start`).
- **Bottom Section**: Use `Tabs` to switch between "Recent Golf" and "Recent Strength". Under each tab, show the last 3 sessions as a list. Each item is a `SessionRow` component showing the date and key metrics. Tapping a row navigates to the session detail. Show an empty state if there are no sessions.

### Step 13 — Create the SessionRow component
- Reusable list item showing: date (formatted nicely), one or two key metrics, and a chevron icon indicating it's tappable.
- Used on the Dashboard and on history screens.

---

## Phase 4: Golf — Session Flow

### Step 14 — Define the SuperSpeed Level 1 protocol as data
- Create `lib/golf-protocol.ts` that exports the sequence of swings for a SuperSpeed Level 1 session. Each entry should specify: `block` (NORMAL, STEP, MAX_NORMAL, DRIVER), `stick` (LIGHT, MEDIUM, HEAVY, DRIVER), `side` (DOMINANT, NON_DOMINANT), and a human-readable label (e.g., "Light — Dominant").
- This is the ordered list of 15 swings the guided logger will step through.
- Example structure:
  ```
  { block: "NORMAL", stick: "LIGHT", side: "DOMINANT", label: "Light — Dominant" }
  ```
- **⚠️ Swing count discrepancy**: The requirements list Block 1 NORMAL (6 swings) + Block 2 STEP (6) + Block 3 MAX NORMAL (1) + Block 4 DRIVER (1) = 14, but the spec says "Total possible entries per session: 15." The `golf-protocol.ts` array **must total exactly 15 entries**. Before implementing, confirm with the product owner which block contains the missing swing (most likely MAX NORMAL includes a second entry such as Medium — Dominant). Do not guess — get this confirmed so the protocol matches the real SuperSpeed Level 1 program.

### Step 15 — Build the Golf Start page (`app/golf/start/page.tsx`)
- Simple screen showing:
  - A `Card` displaying the protocol name: "SuperSpeed Level 1".
  - A `Button`: "Begin Guided Session" that navigates to `/golf/session`.
- shadcn components: `Card`, `Button`.

### Step 16 — Build the NumericKeypad component
- A grid of buttons laid out as:
  ```
  1  2  3
  4  5  6
  7  8  9
  .  0  ⌫
  ```
- Takes an `onChange` callback that emits the full string value as the user taps keys.
- The backspace (⌫) button removes the last character.
- The decimal (.) button should only work once per value.
- Use large touch-friendly buttons (minimum 48px tap targets).

### Step 17 — Build the SpeedDisplay component
- Shows the current speed value in large text (e.g., `103.2`).
- Below or beside it, show `mph` as a unit label.
- If the value is empty, show a placeholder like `0.0`.

### Step 18 — Build the RestTimerPanel component
- Three states:
  1. **Idle**: Shows a `Button` labeled "Start 60s Rest".
  2. **Running**: Shows a countdown (60, 59, 58...) replacing the button. Optionally show a `Progress` bar filling up.
  3. **Complete**: Plays a sound (if `timerSound` is enabled in settings) and triggers vibration (if `timerVibrate` is enabled and the device supports it). Then auto-advances to the next swing.
- Use `setInterval` or `requestAnimationFrame` for the countdown.
- Fetch the user's timer preferences from the database (or pass them in as props).

### Step 19 — Build the Golf Guided Logger page (`app/golf/session/page.tsx`)
This is the most complex screen. It's a **client component** that manages the session state.

- **State to track**: current swing index (0–14), array of entered speed values (one per swing, some may be skipped), rest timer state.
- **Header**: Show the current block label (NORMAL, STEP, MAX NORMAL, DRIVER) and the progress indicator (e.g., "5 / 15").
- **Main area**:
  - Show the current swing's label (e.g., "Light — Dominant") using `NextItemCard`.
  - Show `SpeedDisplay` with the currently entered value.
  - Show `NumericKeypad` for input.
  - Show two buttons: "Save" (stores the value and moves to rest timer) and "Skip" (records null and moves to rest timer or next swing).
- **After Save**: Show the `RestTimerPanel`. When the rest timer completes, auto-advance to the next swing.
- **After all 15 swings**: Navigate to the session summary page.
- **On Save (API call)**: When the session is complete, POST all entered values to a Server Action or API route that:
  1. **Validates at least one value exists.** Before creating anything, check that the entered values array contains at least one non-null (non-skipped) entry. If all swings were skipped, show an error toast ("You must enter at least one speed to save the session") and do **not** navigate away or create any records.
  2. Creates a `GolfSession` record.
  3. Creates a `GolfValue` record for each non-skipped swing.
  4. Returns the session ID for the summary page.
- **PR Toast**: After saving, check if the Driver Max or Light Normal Dominant value is a new all-time PR by comparing against existing data using `computeGolfPRSummaries()`. If it is, show a celebratory toast using Sonner.

### Step 20 — Build the Golf Session Summary page (`app/golf/summary/[id]/page.tsx`)
- Fetch the session by ID from the database (verify it belongs to the current user).
- **Highlighted Metrics**: Two `MetricCard` components at the top — Driver Max and Light Normal Dominant from this session.
- **All Entries**: Group the session's `GolfValue` records by block (Normal, Step, Max Normal, Driver). Use `Accordion` to show each block, with `EntryRow` components inside showing label + speed value.
- **Buttons**: "Done" (navigates to Dashboard) and "View History" (navigates to `/golf/history`).
- shadcn components: `Card`, `Accordion`, `Badge`, `Button`.

### Step 21 — Build the Golf History page (`app/golf/history/page.tsx`)
- Fetch all golf sessions for the current user, ordered by `performedAt` descending.
- Render as a list of `SessionRow` components. Each row shows: date, Driver Max speed, Light Normal Dominant speed.
- Tapping a row navigates to `/golf/summary/[id]`.
- Show an `EmptyState` component if there are no sessions yet.
- shadcn components: `Card`, `Button`.

---

## Phase 5: Strength — Routine Builder

### Step 22 — Build the ExercisePickerDialog component
- A `Dialog` containing:
  - A search `Input` at the top.
  - A filterable list of exercises using `Command` and `CommandItem` from shadcn. This searches both default exercises and the user's custom exercises.
  - An "Add Custom" button at the bottom that lets the user type a new exercise name and creates it in the database (with `isDefault: false` and `createdByUserId` set to the current user).
- Returns the selected exercise ID and name to the parent.

### Step 23 — Build the SortableList component
- Uses `@dnd-kit/core` and `@dnd-kit/sortable` to create a drag-and-drop reorderable list.
- Each item shows the exercise name, a drag handle, and a remove button.
- Emits the new order when items are rearranged.

### Step 24 — Build the Routine Builder page (`app/strength/routine/page.tsx`)
- **Top**: An `Input` for the routine name (defaults to "My Routine") and a number `Input` for sessions per week.
- **Days**: Render a `DayCard` for each day (default 3 days: Day A, Day B, Day C). Each card has:
  - An editable `Input` for the day label.
  - A `SortableList` of exercises assigned to that day.
  - An "Add Exercise" `Button` that opens the `ExercisePickerDialog`.
- When the user adds, removes, or reorders exercises, update the local state.
- A "Save Routine" button at the bottom that persists everything to the database:
  1. Creates or updates the `Routine` record.
  2. Creates or updates `RoutineDay` records (with `orderIndex`).
  3. Creates or updates `RoutineDayExercise` records (with `orderIndex`).
- shadcn components: `Card`, `Input`, `Label`, `Button`, `Dialog`, `Command`, `Separator`.

---

## Phase 6: Strength — Session Flow

### Step 25 — Build the Strength Start page (`app/strength/start/page.tsx`)
- Fetch the user's active routine and determine which day is "next" (based on the last completed `StrengthSession`'s `routineDayId` — cycle through the days in order).
- Show a `NextDayCard` displaying "Next: Day B" (or whichever day is next).
- Show a "Change Day" `Button` that opens a `SelectDayDialog` — a `Dialog` with a `RadioGroup` listing all days in the routine.
- Show a "Begin Session" `Button` that navigates to `/strength/session?dayId=[routineDayId]`.
- If the user has no routine yet, show a message and a button linking to the Routine Builder (`/strength/routine`).
- shadcn components: `Card`, `Dialog`, `RadioGroup`, `Button`.

### Step 26 — Build the ExerciseLogCard and SetRow components
- **ExerciseLogCard**: A card for one exercise showing:
  - Exercise name as the title.
  - A `Badge` showing the suggested next weight (from `suggestNextWeightForExercise()`).
  - Three `SetRow` components (one per set).
- **SetRow**: A single row with:
  - A set label ("Set 1", "Set 2", "Set 3").
  - A weight `Input` (pre-filled with the last session's weight, converted to the user's preferred unit).
  - A reps `Input`.
  - An optional notes toggle (small icon button) that expands a text `Input` below the row. This maps to the `notes` field on `StrengthSet` in the schema. Keep it collapsed by default to avoid clutter.
- Auto-fill: When the page loads, fetch the user's most recent `StrengthSet` records for each exercise and pre-fill the weight inputs.

### Step 27 — Build the Strength Logger page (`app/strength/session/page.tsx`)
- Read the `dayId` from the query string. Fetch the `RoutineDay` with its exercises (via `RoutineDayExercise`, ordered by `orderIndex`).
- **Header**: Show the day label and today's date.
- **Exercise list**: Render an `ExerciseLogCard` for each exercise.
- **Session notes**: An optional `Input` (or `Textarea`) above the finish bar for general session-level notes. This maps to the `notes` field on `StrengthSession` in the schema. Keep it minimal — a single line with a placeholder like "Session notes (optional)".
- **Sticky bottom bar** (`FinishSessionBar`): A "Finish Session" `Button` fixed to the bottom of the screen.
- **On Finish**: POST all the data to a Server Action or API route that:
  1. Creates a `StrengthSession` record (with `userId`, `routineDayId`, and `performedAt`).
  2. Creates `StrengthSet` records for each set of each exercise. Convert user-entered weights to kg using `normalizeStrengthWeightToKg()` before storing.
  3. Navigate to the Dashboard (or a strength summary page if you want to add one later).
- shadcn components: `Card`, `Input`, `Badge`, `Button`, `Separator`.

---

## Phase 7: Polish & UX

### Step 28 — Implement empty states
- For every list/screen that could be empty (Dashboard metrics, Golf History, Strength Start with no routine), create a friendly `EmptyState` component with:
  - An icon or illustration.
  - A short message explaining what goes here.
  - A call-to-action button (e.g., "Start your first golf session").

### Step 29 — Add loading states
- Use Next.js `loading.tsx` files in each route segment to show skeleton loaders while data fetches.
- For client components, use `Suspense` boundaries with skeleton fallbacks.
- The NumericKeypad and RestTimer should feel instant — no loading spinners for those.

### Step 30 — Mobile UX pass
- Audit every screen on a 375px-wide viewport (iPhone SE size).
- Ensure all tap targets are at least 44x44px.
- Ensure the NumericKeypad buttons are large and easy to hit.
- Ensure the bottom nav doesn't overlap content — add bottom padding to the main content area.
- Test the rest timer countdown is visible and the sound/vibration fires correctly on mobile browsers.

### Step 31 — Typography and visual hierarchy
- Use large, bold numbers for all metric displays (speeds, weights, reps).
- Keep labels smaller and lighter in color.
- Follow the "1 primary action per screen" principle — make sure the main button on each screen is visually dominant.
- Use consistent spacing (Tailwind's spacing scale).

### Step 32 — Add error handling
- Wrap all database mutations in try/catch blocks.
- Show user-friendly error toasts (using Sonner) when something fails.
- Validate all form inputs before submitting:
  - Golf speed: use `validateGolfInputString()` from `lib/core-logic.ts`.
  - Strength weight/reps: ensure they're positive numbers.
  - Routine builder: ensure each day has at least one exercise before saving.

---

## Phase 8: Testing & Deployment Prep

### Step 33 — Manual testing checklist
Walk through each of these flows end-to-end:
1. Sign up / sign in with OAuth.
2. Go to Settings, change units to KG, change increments, toggle timer settings.
3. Start a golf session, enter all 15 speeds, observe rest timer, see summary, check history.
4. Start a golf session, skip a few swings, confirm they're recorded as skipped.
5. Check the Dashboard — verify PR metrics update after a new session.
6. Build a strength routine with 3 days and 3–4 exercises each. Reorder exercises, remove one, add a custom exercise.
7. Start a strength session, verify auto-filled weights match the previous session, log all sets, finish.
8. Start another strength session — verify the suggested weight increased if you hit 3x12 last time.
9. Check the Dashboard recent sessions list for both golf and strength.

### Step 34 — Set up deployment
- Set up a PostgreSQL database (e.g., Neon, Supabase, Railway, or Vercel Postgres).
- Configure environment variables: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, and OAuth provider credentials.
- Deploy to Vercel (or your preferred platform).
- Run `npx prisma migrate deploy` against the production database.
- Run the seed script if needed for default exercises.

---

## File Structure Reference

```
app/
  layout.tsx              ← AppShell (TopNav + BottomNav + Container)
  page.tsx                ← Dashboard
  sign-in/page.tsx        ← Sign-in page
  golf/
    start/page.tsx        ← Golf Start
    session/page.tsx      ← Golf Guided Logger
    summary/[id]/page.tsx ← Golf Session Summary
    history/page.tsx      ← Golf History
  strength/
    routine/page.tsx      ← Routine Builder
    start/page.tsx        ← Strength Start
    session/page.tsx      ← Strength Logger
  settings/page.tsx       ← Settings
  api/
    auth/[...nextauth]/route.ts

components/
  app-shell.tsx           ← TopNav + BottomNav + Container
  metric-card.tsx
  session-row.tsx
  numeric-keypad.tsx
  speed-display.tsx
  rest-timer-panel.tsx
  entry-row.tsx
  exercise-picker-dialog.tsx
  sortable-list.tsx
  exercise-log-card.tsx
  set-row.tsx
  empty-state.tsx
  ui/                     ← shadcn/ui generated components

lib/
  core-logic.ts           ← Pure functions (PR calc, progression, validation)
  golf-protocol.ts        ← SuperSpeed Level 1 swing sequence
  prisma.ts               ← Prisma client singleton
  auth.ts                 ← NextAuth config + helpers

prisma/
  schema.prisma
  seed.ts
```

---

## Key Principles to Follow Throughout

1. **Mobile-first**: Design for 375px first, then let it scale up.
2. **Large typography**: Numbers should be big and scannable at a glance.
3. **Minimal taps**: Every extra tap is friction. Reduce steps wherever possible.
4. **Data-first**: Show the user their numbers prominently. Chrome and decoration are secondary.
5. **1 primary action per screen**: Don't overwhelm with choices. Guide the user.
6. **No clutter**: If it's not essential for the current task, don't show it.
