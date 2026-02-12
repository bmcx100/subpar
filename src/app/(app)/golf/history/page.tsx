import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { mphTenthsToNumber } from "@/lib/core-logic";
import { SessionRow } from "@/components/session-row";
import { EmptyState } from "@/components/empty-state";

export default async function GolfHistoryPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const golfSessions = await prisma.golfSession.findMany({
    where: { userId: session.user.id },
    include: { values: true },
    orderBy: { performedAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Golf History</h2>
      {golfSessions.length === 0 ? (
        <EmptyState
          message="No golf sessions yet"
          actionLabel="Start your first session"
          actionHref="/golf/start"
        />
      ) : (
        <div className="space-y-2">
          {golfSessions.map((gs) => {
            const driverVal = gs.values.find(
              (v) =>
                v.block === "DRIVER" &&
                v.stick === "DRIVER" &&
                v.side === "DOMINANT"
            );
            const lightVal = gs.values.find(
              (v) =>
                v.block === "NORMAL" &&
                v.stick === "LIGHT" &&
                v.side === "DOMINANT"
            );
            return (
              <SessionRow
                key={gs.id}
                href={`/golf/summary/${gs.id}`}
                date={gs.performedAt}
                metrics={[
                  {
                    label: "Driver",
                    value: driverVal
                      ? `${mphTenthsToNumber(driverVal.speedMphTenths)} mph`
                      : "—",
                  },
                  {
                    label: "Light",
                    value: lightVal
                      ? `${mphTenthsToNumber(lightVal.speedMphTenths)} mph`
                      : "—",
                  },
                ]}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
