"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { GolfBlock, GolfStick, Side } from "@/generated/prisma/client";

type SwingValue = {
  block: GolfBlock;
  stick: GolfStick;
  side: Side;
  speedMphTenths: number;
};

export async function saveGolfSession(values: SwingValue[]) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  if (values.length === 0) {
    throw new Error("You must enter at least one speed to save the session");
  }

  const golfSession = await prisma.golfSession.create({
    data: {
      userId: session.user.id,
      values: {
        create: values.map((v) => ({
          block: v.block,
          stick: v.stick,
          side: v.side,
          speedMphTenths: v.speedMphTenths,
        })),
      },
    },
  });

  return golfSession.id;
}
