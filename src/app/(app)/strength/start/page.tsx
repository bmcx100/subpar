import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { StrengthStartClient } from "./start-client";

export default async function StrengthStartPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const routine = await prisma.routine.findFirst({
    where: { userId: session.user.id },
    include: {
      days: {
        orderBy: { orderIndex: "asc" },
        select: { id: true, label: true, orderIndex: true },
      },
    },
  });

  if (!routine || routine.days.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Strength Session</h2>
        <p className="text-muted-foreground">
          You don&apos;t have a routine set up yet.
        </p>
        <a
          href="/strength/routine"
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Build a Routine
        </a>
      </div>
    );
  }

  // Determine next day based on last completed session
  const lastSession = await prisma.strengthSession.findFirst({
    where: { userId: session.user.id, routineDayId: { not: null } },
    orderBy: { performedAt: "desc" },
    select: { routineDayId: true },
  });

  let nextDayIndex = 0;
  if (lastSession?.routineDayId) {
    const lastDay = routine.days.find((d) => d.id === lastSession.routineDayId);
    if (lastDay) {
      nextDayIndex = (lastDay.orderIndex + 1) % routine.days.length;
    }
  }

  return (
    <StrengthStartClient
      days={routine.days}
      defaultDayIndex={nextDayIndex}
    />
  );
}
