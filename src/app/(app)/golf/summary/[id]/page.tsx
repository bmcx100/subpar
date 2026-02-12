import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { mphTenthsToNumber } from "@/lib/core-logic";
import { MetricCard } from "@/components/metric-card";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Link from "next/link";

const blockLabels: Record<string, string> = {
  NORMAL: "Normal",
  STEP: "Step",
  MAX_NORMAL: "Max Normal",
  DRIVER: "Driver",
};

const blockOrder = ["NORMAL", "STEP", "MAX_NORMAL", "DRIVER"];

export default async function GolfSummaryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const golfSession = await prisma.golfSession.findUnique({
    where: { id },
    include: { values: true },
  });

  if (!golfSession || golfSession.userId !== session.user.id) notFound();

  // Find Driver Max and Light Normal Dominant
  const driverMax = golfSession.values.find(
    (v) => v.block === "DRIVER" && v.stick === "DRIVER" && v.side === "DOMINANT"
  );
  const lightNormal = golfSession.values.find(
    (v) => v.block === "NORMAL" && v.stick === "LIGHT" && v.side === "DOMINANT"
  );

  // Group values by block
  const grouped = blockOrder
    .map((block) => ({
      block,
      label: blockLabels[block],
      values: golfSession.values.filter((v) => v.block === block),
    }))
    .filter((g) => g.values.length > 0);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Session Complete</h2>
      <p className="text-sm text-muted-foreground">
        {golfSession.performedAt.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        })}
      </p>

      {/* Highlighted Metrics */}
      <div className="grid gap-4">
        <MetricCard
          value={driverMax ? mphTenthsToNumber(driverMax.speedMphTenths) : null}
          unit="mph"
          label="Driver Max"
          variant="primary"
        />
        <MetricCard
          value={
            lightNormal
              ? mphTenthsToNumber(lightNormal.speedMphTenths)
              : null
          }
          unit="mph"
          label="Light Normal (Dominant)"
        />
      </div>

      {/* All Entries */}
      <Accordion type="multiple" defaultValue={blockOrder}>
        {grouped.map((group) => (
          <AccordionItem key={group.block} value={group.block}>
            <AccordionTrigger>{group.label}</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {group.values.map((v) => {
                  const stickLabel =
                    v.stick === "DRIVER"
                      ? "Driver"
                      : v.stick.charAt(0) + v.stick.slice(1).toLowerCase();
                  const sideLabel =
                    v.side === "DOMINANT" ? "D" : "ND";
                  return (
                    <div
                      key={v.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-muted-foreground">
                        {stickLabel} — {sideLabel}
                      </span>
                      <span className="font-medium tabular-nums">
                        {mphTenthsToNumber(v.speedMphTenths)} mph
                      </span>
                    </div>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button asChild size="lg">
          <Link href="/">Done</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/golf/history">View History</Link>
        </Button>
      </div>
    </div>
  );
}
