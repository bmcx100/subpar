import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { kgToLb, formatWeightForUnit, type WeightUnit } from "@/lib/core-logic";
import { getRoutine } from "./actions";
import { RoutineBuilder } from "./routine-builder";

export default async function RoutineBuilderPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { weightUnit: true },
  });
  const weightUnit = (user?.weightUnit ?? "LB") as WeightUnit;

  const routine = await getRoutine();

  type ExerciseState = {
    id: string;
    name: string;
    targetSets: number | null;
    targetReps: number | null;
    targetWeight: number | null;
    isBodyweight: boolean;
    supersetGroupId: string | null;
  };

  const defaultDays = [
    { label: "Day A", exercises: [] as ExerciseState[] },
    { label: "Day B", exercises: [] as ExerciseState[] },
    { label: "Day C", exercises: [] as ExerciseState[] },
  ];

  const DAY_LETTERS = ["A", "B", "C", "D", "E", "F", "G"];

  let initialDays: typeof defaultDays;
  if (routine && routine.days.length > 0) {
    initialDays = routine.days.map((d) => ({
      label: d.label,
      exercises: d.entries.map((e) => {
        const weightKg = e.targetWeightKg ? Number(e.targetWeightKg) : null;
        const displayWeight =
          weightKg !== null
            ? formatWeightForUnit(
                weightUnit === "LB" ? kgToLb(weightKg) : weightKg,
                weightUnit
              )
            : null;
        return {
          id: e.exercise.id,
          name: e.exercise.name,
          targetSets: e.targetSets,
          targetReps: e.targetReps,
          targetWeight: displayWeight,
          isBodyweight: e.isBodyweight,
          supersetGroupId: e.supersetGroupId,
        };
      }),
    }));
  } else {
    const count = routine?.sessionsPerWeek ?? 3;
    initialDays = Array.from({ length: count }, (_, i) => ({
      label: `Day ${DAY_LETTERS[i] ?? i + 1}`,
      exercises: [] as ExerciseState[],
    }));
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Routine Builder</h2>
      <RoutineBuilder
        initialName={routine?.name ?? "My Routine"}
        initialSessionsPerWeek={routine?.sessionsPerWeek ?? 3}
        initialDays={initialDays}
        weightUnit={weightUnit}
      />
    </div>
  );
}
