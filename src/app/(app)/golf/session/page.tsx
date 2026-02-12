"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SUPERSPEED_LEVEL_1, TOTAL_SWINGS } from "@/lib/golf-protocol";
import { validateGolfInputString } from "@/lib/core-logic";
import { NumericKeypad } from "@/components/numeric-keypad";
import { SpeedDisplay } from "@/components/speed-display";
import { RestTimerPanel } from "@/components/rest-timer-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { saveGolfSession } from "./actions";

type EnteredValue = {
  block: string;
  stick: string;
  side: string;
  speedMphTenths: number;
} | null;

export default function GolfSessionPage() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [entries, setEntries] = useState<EnteredValue[]>(
    new Array(TOTAL_SWINGS).fill(null)
  );
  const [phase, setPhase] = useState<"input" | "rest">("input");
  const [saving, setSaving] = useState(false);

  const currentSwing = SUPERSPEED_LEVEL_1[currentIndex];
  const isLastSwing = currentIndex >= TOTAL_SWINGS - 1;

  const advanceToNext = useCallback(() => {
    if (isLastSwing) {
      finishSession();
    } else {
      setCurrentIndex((prev) => prev + 1);
      setInputValue("");
      setPhase("input");
    }
  }, [isLastSwing]);

  function handleSave() {
    const result = validateGolfInputString(inputValue);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    const swing = SUPERSPEED_LEVEL_1[currentIndex];
    const newEntries = [...entries];
    newEntries[currentIndex] = {
      block: swing.block,
      stick: swing.stick,
      side: swing.side,
      speedMphTenths: result.tenths,
    };
    setEntries(newEntries);

    if (isLastSwing) {
      finishSession(newEntries);
    } else {
      setPhase("rest");
    }
  }

  function handleSkip() {
    if (isLastSwing) {
      finishSession();
    } else {
      setPhase("rest");
    }
  }

  async function finishSession(overrideEntries?: EnteredValue[]) {
    const finalEntries = overrideEntries ?? entries;
    const nonNull = finalEntries.filter(
      (e): e is NonNullable<EnteredValue> => e !== null
    );

    if (nonNull.length === 0) {
      toast.error("You must enter at least one speed to save the session");
      return;
    }

    setSaving(true);
    try {
      const sessionId = await saveGolfSession(
        nonNull.map((e) => ({
          block: e.block as "NORMAL" | "STEP" | "MAX_NORMAL" | "DRIVER",
          stick: e.stick as "LIGHT" | "MEDIUM" | "HEAVY" | "DRIVER",
          side: e.side as "DOMINANT" | "NON_DOMINANT",
          speedMphTenths: e.speedMphTenths,
        }))
      );
      toast.success("Session saved!");
      router.push(`/golf/summary/${sessionId}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save session"
      );
      setSaving(false);
    }
  }

  if (!currentSwing) return null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="text-sm">
          {currentSwing.block.replace("_", " ")}
        </Badge>
        <span className="text-sm font-medium text-muted-foreground">
          {currentIndex + 1} / {TOTAL_SWINGS}
        </span>
      </div>

      {/* Current Swing */}
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-lg font-semibold">
            {currentSwing.label}
          </p>
        </CardContent>
      </Card>

      {phase === "input" ? (
        <>
          <SpeedDisplay value={inputValue} />
          <NumericKeypad value={inputValue} onChange={setInputValue} />
          <div className="grid grid-cols-2 gap-3">
            <Button
              size="lg"
              onClick={handleSave}
              disabled={!inputValue || saving}
            >
              {saving ? "Saving..." : "Save"}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={handleSkip}
              disabled={saving}
            >
              Skip
            </Button>
          </div>
        </>
      ) : (
        <RestTimerPanel
          onComplete={advanceToNext}
          timerSound={true}
          timerVibrate={true}
        />
      )}
    </div>
  );
}
