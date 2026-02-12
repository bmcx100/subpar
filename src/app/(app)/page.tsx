import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
  computeGolfPRSummaries,
  golfPRSummaryToDisplay,
  mphTenthsToNumber,
  type GolfSessionMetrics,
} from "@/lib/core-logic";
import { MetricCard } from "@/components/metric-card";
import { SessionRow } from "@/components/session-row";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  // Fetch golf sessions with values
  const golfSessions = await prisma.golfSession.findMany({
    where: { userId: session.user.id },
    include: { values: true },
    orderBy: { performedAt: "desc" },
  });

  // Build metrics for PR computation
  const golfMetrics: GolfSessionMetrics[] = golfSessions.map((gs) => {
    const driverMax = gs.values.find(
      (v) => v.block === "DRIVER" && v.stick === "DRIVER" && v.side === "DOMINANT"
    );
    const lightNormal = gs.values.find(
      (v) => v.block === "NORMAL" && v.stick === "LIGHT" && v.side === "DOMINANT"
    );
    return {
      sessionId: gs.id,
      performedAt: gs.performedAt,
      driverMaxDominant: driverMax?.speedMphTenths,
      lightNormalDominant: lightNormal?.speedMphTenths,
    };
  });

  const prSummaries = computeGolfPRSummaries(golfMetrics);
  const driverPR = golfPRSummaryToDisplay(
    prSummaries.find((s) => s.metric === "DRIVER_MAX_DOMINANT")!
  );
  const lightPR = golfPRSummaryToDisplay(
    prSummaries.find((s) => s.metric === "LIGHT_NORMAL_DOMINANT")!
  );

  // Recent golf sessions (last 3)
  const recentGolf = golfSessions.slice(0, 3);

  // Recent strength sessions (last 3)
  const recentStrength = await prisma.strengthSession.findMany({
    where: { userId: session.user.id },
    include: { routineDay: true },
    orderBy: { performedAt: "desc" },
    take: 3,
  });

  return (
    <div className="space-y-6">
      {/* PR Metrics */}
      <div className="grid gap-4">
        <MetricCard
          value={driverPR.allTimeBestMph}
          unit="mph"
          label="Driver Max"
          variant="primary"
          subtexts={[
            driverPR.lastNBestMph !== null
              ? `Last 7 best: ${driverPR.lastNBestMph.toFixed(1)}`
              : "No recent data",
            driverPR.spanDays !== null
              ? `Last 7 = ${driverPR.spanDays} days`
              : "",
          ].filter(Boolean)}
        />
        <MetricCard
          value={lightPR.allTimeBestMph}
          unit="mph"
          label="Light Normal (Dominant)"
          subtexts={[
            lightPR.lastNBestMph !== null
              ? `Last 7 best: ${lightPR.lastNBestMph.toFixed(1)}`
              : "No recent data",
            lightPR.spanDays !== null
              ? `Last 7 = ${lightPR.spanDays} days`
              : "",
          ].filter(Boolean)}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button asChild size="lg" className="h-14 text-base">
          <Link href="/golf/start">Start Golf Session</Link>
        </Button>
        <Button asChild size="lg" variant="secondary" className="h-14 text-base">
          <Link href="/strength/start">Start Strength Session</Link>
        </Button>
      </div>

      {/* Recent Sessions */}
      <Tabs defaultValue="golf">
        <TabsList className="w-full">
          <TabsTrigger value="golf" className="flex-1">
            Recent Golf
          </TabsTrigger>
          <TabsTrigger value="strength" className="flex-1">
            Recent Strength
          </TabsTrigger>
        </TabsList>
        <TabsContent value="golf" className="space-y-2">
          {recentGolf.length === 0 ? (
            <EmptyState
              message="No golf sessions yet"
              actionLabel="Start your first session"
              actionHref="/golf/start"
            />
          ) : (
            recentGolf.map((gs) => {
              const driverVal = gs.values.find(
                (v) =>
                  v.block === "DRIVER" &&
                  v.stick === "DRIVER" &&
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
                  ]}
                />
              );
            })
          )}
        </TabsContent>
        <TabsContent value="strength" className="space-y-2">
          {recentStrength.length === 0 ? (
            <EmptyState
              message="No strength sessions yet"
              actionLabel="Build a routine"
              actionHref="/strength/routine"
            />
          ) : (
            recentStrength.map((ss) => (
              <SessionRow
                key={ss.id}
                href="/"
                date={ss.performedAt}
                metrics={[
                  {
                    label: "Day",
                    value: ss.routineDay?.label ?? "Unknown",
                  },
                ]}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
