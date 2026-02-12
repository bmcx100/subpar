"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { normalizeStrengthWeightToKg, type WeightUnit } from "@/lib/core-logic";

export async function fetchExercises() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const exercises = await prisma.exercise.findMany({
    where: {
      OR: [
        { isDefault: true },
        { createdByUserId: session.user.id },
      ],
    },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return exercises;
}

export async function createExercise(name: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const exercise = await prisma.exercise.create({
    data: {
      name,
      isDefault: false,
      createdByUserId: session.user.id,
    },
    select: { id: true, name: true },
  });

  return exercise;
}

type ExerciseData = {
  id: string;
  name: string;
  targetSets: number | null;
  targetReps: number | null;
  targetWeight: number | null;
  isBodyweight: boolean;
  supersetGroupId: string | null;
};

type DayData = {
  label: string;
  exercises: ExerciseData[];
};

export async function saveRoutine(data: {
  name: string;
  sessionsPerWeek: number;
  days: DayData[];
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { weightUnit: true },
  });
  const unit = (user?.weightUnit ?? "LB") as WeightUnit;

  function buildEntries(exercises: ExerciseData[]) {
    return exercises.map((ex, j) => ({
      exerciseId: ex.id,
      orderIndex: j,
      targetSets: ex.targetSets,
      targetReps: ex.targetReps,
      targetWeightKg: ex.isBodyweight || ex.targetWeight === null
        ? null
        : normalizeStrengthWeightToKg(ex.targetWeight, unit),
      isBodyweight: ex.isBodyweight,
      supersetGroupId: ex.supersetGroupId,
    }));
  }

  const existing = await prisma.routine.findFirst({
    where: { userId: session.user.id },
    include: { days: { include: { entries: true } } },
  });

  if (existing) {
    await prisma.routineDay.deleteMany({
      where: { routineId: existing.id },
    });

    await prisma.routine.update({
      where: { id: existing.id },
      data: {
        name: data.name,
        sessionsPerWeek: data.sessionsPerWeek,
        days: {
          create: data.days.map((day, i) => ({
            orderIndex: i,
            label: day.label,
            entries: { create: buildEntries(day.exercises) },
          })),
        },
      },
    });
  } else {
    await prisma.routine.create({
      data: {
        userId: session.user.id,
        name: data.name,
        sessionsPerWeek: data.sessionsPerWeek,
        days: {
          create: data.days.map((day, i) => ({
            orderIndex: i,
            label: day.label,
            entries: { create: buildEntries(day.exercises) },
          })),
        },
      },
    });
  }

  revalidatePath("/strength");
}

export async function getRoutine() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const routine = await prisma.routine.findFirst({
    where: { userId: session.user.id },
    include: {
      days: {
        orderBy: { orderIndex: "asc" },
        include: {
          entries: {
            orderBy: { orderIndex: "asc" },
            include: { exercise: { select: { id: true, name: true } } },
          },
        },
      },
    },
  });

  return routine;
}
