"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateSettings(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const weightUnit = formData.get("weightUnit") as string;
  const incrementLb = parseFloat(formData.get("incrementLb") as string);
  const incrementKg = parseFloat(formData.get("incrementKg") as string);
  const timerSound = formData.get("timerSound") === "on";
  const timerVibrate = formData.get("timerVibrate") === "on";

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      weightUnit: weightUnit === "KG" ? "KG" : "LB",
      incrementLb: isNaN(incrementLb) ? 5 : incrementLb,
      incrementKg: isNaN(incrementKg) ? 2.5 : incrementKg,
      timerSound,
      timerVibrate,
    },
  });

  revalidatePath("/settings");
}
