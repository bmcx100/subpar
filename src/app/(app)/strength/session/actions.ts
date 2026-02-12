"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
type SetInput = {
  exerciseId: string;
  setIndex: number;
  weightKg: number;
  reps: number;
  notes: string;
};

export async function saveStrengthSession(data: {
  routineDayId: string;
  notes: string;
  sets: SetInput[];
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const strengthSession = await prisma.strengthSession.create({
    data: {
      userId: session.user.id,
      routineDayId: data.routineDayId,
      notes: data.notes || null,
      sets: {
        create: data.sets.map((s) => ({
          exerciseId: s.exerciseId,
          setIndex: s.setIndex,
          weightKg: s.weightKg,
          reps: s.reps,
          notes: s.notes || null,
        })),
      },
    },
  });

  return strengthSession.id;
}
