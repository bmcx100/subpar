import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
  suggestNextWeightsForExercises,
  kgToLb,
  formatWeightForUnit,
  type StrengthSet as CoreStrengthSet,
} from "@/lib/core-logic";
import { StrengthLoggerClient } from "./logger-client";

export default async function StrengthSessionPage({
  searchParams,
}: {
  searchParams: Promise<{ dayId?: string }>;
}) {
  const { dayId } = await searchParams;
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  if (!dayId) redirect("/strength/start");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { weightUnit: true, incrementLb: true, incrementKg: true },
  });

  if (!user) redirect("/sign-in");

  const routineDay = await prisma.routineDay.findUnique({
    where: { id: dayId },
    include: {
      entries: {
        orderBy: { orderIndex: "asc" },
        include: { exercise: { select: { id: true, name: true } } },
      },
    },
  });

  if (!routineDay) redirect("/strength/start");

  const exerciseIds = routineDay.entries.map((e) => e.exercise.id);

  // Fetch all historical sets for suggestions
  const historicalSets = await prisma.strengthSet.findMany({
    where: {
      exercise: { id: { in: exerciseIds } },
      strengthSession: { userId: session.user.id },
    },
    include: { strengthSession: { select: { performedAt: true } } },
  });

  const coreSets: CoreStrengthSet[] = historicalSets.map((s) => ({
    exerciseId: s.exerciseId,
    performedAt: s.strengthSession.performedAt,
    weightKg: Number(s.weightKg),
    reps: s.reps,
    setIndex: s.setIndex as 1 | 2 | 3,
  }));

  const suggestions = suggestNextWeightsForExercises({
    exerciseIds,
    allSets: coreSets,
    userUnit: user.weightUnit,
    increments: {
      incrementLb: Number(user.incrementLb),
      incrementKg: Number(user.incrementKg),
    },
  });

  // Build auto-fill weights from last session
  const autoFill: Record<string, { weight: string; reps: string }[]> = {};
  for (const exerciseId of exerciseIds) {
    const lastSets = coreSets
      .filter((s) => s.exerciseId === exerciseId)
      .sort((a, b) => b.performedAt.getTime() - a.performedAt.getTime());

    // Get the most recent timestamp
    if (lastSets.length > 0) {
      const latestTime = lastSets[0].performedAt.getTime();
      const latestGroup = lastSets.filter(
        (s) => s.performedAt.getTime() === latestTime
      );
      const maxSetIdx = Math.max(...latestGroup.map((s) => s.setIndex));
      autoFill[exerciseId] = Array.from({ length: maxSetIdx }, (_, i) => {
        const set = latestGroup.find((s) => s.setIndex === i + 1);
        if (!set) return { weight: "", reps: "" };
        const displayWeight =
          user.weightUnit === "LB"
            ? formatWeightForUnit(kgToLb(set.weightKg), "LB")
            : formatWeightForUnit(set.weightKg, "KG");
        return {
          weight: String(displayWeight),
          reps: String(set.reps),
        };
      });
    }
  }

  const exercises = routineDay.entries.map((e) => {
    const suggestion = suggestions.find((s) => s.exerciseId === e.exercise.id);
    // Convert routine target weight from kg to user's display unit
    const targetWeightKg = e.targetWeightKg ? Number(e.targetWeightKg) : null;
    const targetWeightDisplay =
      targetWeightKg !== null
        ? formatWeightForUnit(
            user.weightUnit === "LB" ? kgToLb(targetWeightKg) : targetWeightKg,
            user.weightUnit
          )
        : null;

    return {
      id: e.exercise.id,
      name: e.exercise.name,
      suggestedWeight:
        suggestion?.suggestedWeight !== null && suggestion?.suggestedWeight !== undefined
          ? `${suggestion.suggestedWeight} ${user.weightUnit.toLowerCase()}`
          : null,
      autoFill: autoFill[e.exercise.id] || null,
      targetSets: e.targetSets,
      targetReps: e.targetReps,
      targetWeight: targetWeightDisplay,
      isBodyweight: e.isBodyweight,
      supersetGroupId: e.supersetGroupId,
    };
  });

  return (
    <StrengthLoggerClient
      dayId={dayId}
      dayLabel={routineDay.label}
      exercises={exercises}
      weightUnit={user.weightUnit}
    />
  );
}
