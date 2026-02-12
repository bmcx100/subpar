import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      weightUnit: true,
      incrementLb: true,
      incrementKg: true,
      timerSound: true,
      timerVibrate: true,
    },
  });

  if (!user) redirect("/sign-in");

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Settings</h2>
      <SettingsForm
        weightUnit={user.weightUnit}
        incrementLb={Number(user.incrementLb)}
        incrementKg={Number(user.incrementKg)}
        timerSound={user.timerSound}
        timerVibrate={user.timerVibrate}
      />
    </div>
  );
}
