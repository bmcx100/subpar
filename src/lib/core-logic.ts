// core-logic.ts
// Core progression + PR algorithms (TypeScript, framework-agnostic)
// Assumptions:
// - Golf speeds stored as "tenths mph" integer (e.g., 102.3 mph => 1023).
// - Strength weights stored in kg (Decimal in DB); in app code use number for calculations.
// - You will fetch the needed rows from DB and pass them into these pure functions.

// -----------------------------
// Types
// -----------------------------

export type WeightUnit = "LB" | "KG";

export type GolfMetricKey =
  | "DRIVER_MAX_DOMINANT"
  | "LIGHT_NORMAL_DOMINANT";

export type GolfValue = {
  performedAt: Date;
  // mph * 10 as integer
  speedMphTenths: number;
};

export type GolfSessionMetrics = {
  sessionId: string;
  performedAt: Date;

  // mph*10; optional because skipping is allowed
  driverMaxDominant?: number;
  lightNormalDominant?: number;
};

export type GolfPRSummary = {
  metric: GolfMetricKey;

  // All-time
  allTimeBestTenths: number | null;
  allTimeBestDate: Date | null;

  // Last N sessions that contain that metric
  lastN: {
    n: number;
    includedSessions: number; // how many sessions had the metric
    bestTenths: number | null;
    bestDate: Date | null;
    spanDays: number | null; // days from oldest to newest among included sessions
  };
};

export type StrengthSet = {
  exerciseId: string;
  performedAt: Date;

  // normalized kg
  weightKg: number;
  reps: number;
  setIndex: 1 | 2 | 3;
};

export type StrengthIncrementSettings = {
  incrementLb: number; // e.g., 5
  incrementKg: number; // e.g., 2.5
};

export type StrengthSuggestion = {
  exerciseId: string;

  // suggestion displayed in user unit
  suggestedWeight: number | null;
  unit: WeightUnit;

  // reason/debug for UI
  reason:
    | "NO_HISTORY"
    | "LAST_NOT_COMPLETE_3_SETS"
    | "HIT_3x12_INCREASE"
    | "NOT_YET_3x12_KEEP";
  basedOn?: {
    lastWeightKg: number;
    lastReps: [number, number, number];
    performedAt: Date;
  };
};

// -----------------------------
// Helpers
// -----------------------------

export function clampInt(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

export function roundTo(n: number, decimals: number): number {
  const p = Math.pow(10, decimals);
  return Math.round(n * p) / p;
}

export function mphTenthsToNumber(tenths: number): number {
  return roundTo(tenths / 10, 1);
}

export function mphNumberToTenths(mph: number): number {
  // Enforce one decimal place max
  const v = roundTo(mph, 1);
  return clampInt(Math.round(v * 10), 0, 9999); // 0.0–999.9
}

export function daysBetween(a: Date, b: Date): number {
  const ms = b.getTime() - a.getTime();
  // floor to whole days; you can swap to Math.round if preferred
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

// Weight conversions
export const LB_PER_KG = 2.2046226218;

export function kgToLb(kg: number): number {
  return kg * LB_PER_KG;
}

export function lbToKg(lb: number): number {
  return lb / LB_PER_KG;
}

// Display rounding: for strength weights, allow decimals.
export function formatWeightForUnit(weight: number, unit: WeightUnit): number {
  // Common plate increments: LB often 0.5 or 1, KG often 0.25 or 0.5.
  // Keep flexible; round to 0.5 for LB and 0.25 for KG by default.
  const step = unit === "LB" ? 0.5 : 0.25;
  return roundTo(Math.round(weight / step) * step, 3);
}

// -----------------------------
// Golf PR algorithms
// -----------------------------

/**
 * Compute PR summary for Driver Max Dominant and/or Light Normal Dominant.
 * Input is a list of sessions (already filtered to a user) ordered or unordered.
 * Skips allowed: metric may be undefined for a session.
 */
export function computeGolfPRSummaries(
  sessions: GolfSessionMetrics[],
  n = 7
): GolfPRSummary[] {
  const metrics: Array<{
    key: GolfMetricKey;
    pick: (s: GolfSessionMetrics) => number | undefined;
  }> = [
    { key: "DRIVER_MAX_DOMINANT", pick: (s) => s.driverMaxDominant },
    { key: "LIGHT_NORMAL_DOMINANT", pick: (s) => s.lightNormalDominant },
  ];

  // Sort sessions newest -> oldest for last-N selection
  const sorted = [...sessions].sort(
    (a, b) => b.performedAt.getTime() - a.performedAt.getTime()
  );

  return metrics.map(({ key, pick }) => {
    // All-time: max across all sessions that contain a value
    let allTimeBest: number | null = null;
    let allTimeBestDate: Date | null = null;

    for (const s of sorted) {
      const v = pick(s);
      if (typeof v !== "number") continue;
      if (allTimeBest === null || v > allTimeBest) {
        allTimeBest = v;
        allTimeBestDate = s.performedAt;
      }
    }

    // Last N sessions that actually include the metric
    const included: Array<{ date: Date; value: number }> = [];
    for (const s of sorted) {
      const v = pick(s);
      if (typeof v !== "number") continue;
      included.push({ date: s.performedAt, value: v });
      if (included.length >= n) break;
    }

    let lastNBest: number | null = null;
    let lastNBestDate: Date | null = null;

    for (const x of included) {
      if (lastNBest === null || x.value > lastNBest) {
        lastNBest = x.value;
        lastNBestDate = x.date;
      }
    }

    // Span days across included sessions (oldest to newest)
    let spanDays: number | null = null;
    if (included.length >= 2) {
      const newest = included[0].date; // because sorted newest->oldest
      const oldest = included[included.length - 1].date;
      spanDays = Math.max(0, daysBetween(oldest, newest));
    } else if (included.length === 1) {
      spanDays = 0;
    }

    return {
      metric: key,
      allTimeBestTenths: allTimeBest,
      allTimeBestDate,
      lastN: {
        n,
        includedSessions: included.length,
        bestTenths: lastNBest,
        bestDate: lastNBestDate,
        spanDays,
      },
    };
  });
}

/**
 * Convenience: produces display-friendly values (mph numbers) for UI.
 */
export function golfPRSummaryToDisplay(summary: GolfPRSummary): {
  metric: GolfMetricKey;
  allTimeBestMph: number | null;
  lastNBestMph: number | null;
  spanDays: number | null;
  includedSessions: number;
} {
  return {
    metric: summary.metric,
    allTimeBestMph:
      summary.allTimeBestTenths === null
        ? null
        : mphTenthsToNumber(summary.allTimeBestTenths),
    lastNBestMph:
      summary.lastN.bestTenths === null
        ? null
        : mphTenthsToNumber(summary.lastN.bestTenths),
    spanDays: summary.lastN.spanDays,
    includedSessions: summary.lastN.includedSessions,
  };
}

// -----------------------------
// Strength progression algorithms (3x8–12 double progression)
// -----------------------------

/**
 * Groups sets by exercise and by session date to find the most recent "complete" 3-set performance.
 * You should pass only sets for a single user.
 */
export function suggestNextWeightForExercise(params: {
  exerciseId: string;
  sets: StrengthSet[]; // all sets for this user+exercise (or all user sets; we filter)
  userUnit: WeightUnit;
  increments: StrengthIncrementSettings;
}): StrengthSuggestion {
  const { exerciseId, sets, userUnit, increments } = params;

  // Filter for the exercise
  const exSets = sets
    .filter((s) => s.exerciseId === exerciseId)
    .sort((a, b) => b.performedAt.getTime() - a.performedAt.getTime());

  if (exSets.length === 0) {
    return {
      exerciseId,
      suggestedWeight: null,
      unit: userUnit,
      reason: "NO_HISTORY",
    };
  }

  // Find the most recent date where we have setIndex 1,2,3.
  // If you store strengthSessionId, grouping by that is even better.
  // Here we approximate by performedAt day+time equality (caller can pre-group).
  // Recommended: pass in sets that include strengthSessionId and group by it instead.
  type Bucket = {
    performedAt: Date;
    weightKgBySet: Map<number, number>;
    repsBySet: Map<number, number>;
  };

  const buckets: Bucket[] = [];
  const byTimestamp = new Map<number, Bucket>();

  for (const s of exSets) {
    const t = s.performedAt.getTime();
    let b = byTimestamp.get(t);
    if (!b) {
      b = {
        performedAt: s.performedAt,
        weightKgBySet: new Map(),
        repsBySet: new Map(),
      };
      byTimestamp.set(t, b);
      buckets.push(b);
    }
    b.weightKgBySet.set(s.setIndex, s.weightKg);
    b.repsBySet.set(s.setIndex, s.reps);
  }

  // Sort buckets newest->oldest
  buckets.sort((a, b) => b.performedAt.getTime() - a.performedAt.getTime());

  const last = buckets.find(
    (b) =>
      b.repsBySet.has(1) &&
      b.repsBySet.has(2) &&
      b.repsBySet.has(3) &&
      b.weightKgBySet.has(1) &&
      b.weightKgBySet.has(2) &&
      b.weightKgBySet.has(3)
  );

  if (!last) {
    return {
      exerciseId,
      suggestedWeight: null,
      unit: userUnit,
      reason: "LAST_NOT_COMPLETE_3_SETS",
    };
  }

  // Use the (common) weight; if user varied by set, use set 1 as baseline.
  const lastWeightKg = last.weightKgBySet.get(1)!;
  const reps1 = last.repsBySet.get(1)!;
  const reps2 = last.repsBySet.get(2)!;
  const reps3 = last.repsBySet.get(3)!;

  const hit3x12 = reps1 >= 12 && reps2 >= 12 && reps3 >= 12;

  const inc =
    userUnit === "LB" ? increments.incrementLb : increments.incrementKg;

  // Compute suggested weight in user unit, then normalize to display rounding.
  let suggestedInUnit: number;

  if (hit3x12) {
    const lastInUnit = userUnit === "LB" ? kgToLb(lastWeightKg) : lastWeightKg;
    suggestedInUnit = lastInUnit + inc;

    suggestedInUnit = formatWeightForUnit(suggestedInUnit, userUnit);

    return {
      exerciseId,
      suggestedWeight: suggestedInUnit,
      unit: userUnit,
      reason: "HIT_3x12_INCREASE",
      basedOn: {
        lastWeightKg,
        lastReps: [reps1, reps2, reps3],
        performedAt: last.performedAt,
      },
    };
  }

  // Not 3x12: keep same
  const keepInUnit = userUnit === "LB" ? kgToLb(lastWeightKg) : lastWeightKg;
  suggestedInUnit = formatWeightForUnit(keepInUnit, userUnit);

  return {
    exerciseId,
    suggestedWeight: suggestedInUnit,
    unit: userUnit,
    reason: "NOT_YET_3x12_KEEP",
    basedOn: {
      lastWeightKg,
      lastReps: [reps1, reps2, reps3],
      performedAt: last.performedAt,
    },
  };
}

/**
 * Suggest next weights for all exercises in a session/day.
 * Provide the list of exerciseIds for that day and the user's historical sets.
 */
export function suggestNextWeightsForExercises(params: {
  exerciseIds: string[];
  allSets: StrengthSet[];
  userUnit: WeightUnit;
  increments: StrengthIncrementSettings;
}): StrengthSuggestion[] {
  const { exerciseIds, allSets, userUnit, increments } = params;

  return exerciseIds.map((exerciseId) =>
    suggestNextWeightForExercise({
      exerciseId,
      sets: allSets,
      userUnit,
      increments,
    })
  );
}

// -----------------------------
// Optional: validation utilities
// -----------------------------

export function validateGolfInputString(
  raw: string
): { ok: true; tenths: number } | { ok: false; error: string } {
  const trimmed = raw.trim();

  // Allow "" as not-entered
  if (trimmed.length === 0) return { ok: false, error: "Empty input" };

  // Accept forms like "102", "102.", "102.3"
  if (!/^\d{1,3}(\.\d)?$/.test(trimmed)) {
    return { ok: false, error: "Use 0–999 with up to 1 decimal (e.g., 102.3)" };
  }

  const mph = Number(trimmed);
  if (!Number.isFinite(mph)) return { ok: false, error: "Invalid number" };
  if (mph < 0 || mph > 999.9)
    return { ok: false, error: "Out of range (0.0–999.9)" };

  return { ok: true, tenths: mphNumberToTenths(mph) };
}

/**
 * Convert a user-entered strength weight in their preferred unit into normalized kg.
 */
export function normalizeStrengthWeightToKg(
  weightInput: number,
  unit: WeightUnit
): number {
  if (!Number.isFinite(weightInput) || weightInput < 0) return 0;
  return unit === "LB" ? lbToKg(weightInput) : weightInput;
}
