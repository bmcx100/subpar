"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";

type RestTimerPanelProps = {
  onComplete: () => void;
  timerSound: boolean;
  timerVibrate: boolean;
};

export function RestTimerPanel({
  onComplete,
  timerSound,
  timerVibrate,
}: RestTimerPanelProps) {
  const [state, setState] = useState<"idle" | "running" | "complete">("idle");
  const [secondsLeft, setSecondsLeft] = useState(60);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const finish = useCallback(() => {
    setState("complete");
    if (timerSound) {
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        osc.frequency.value = 880;
        osc.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } catch {
        // Audio not available
      }
    }
    if (timerVibrate && navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
    setTimeout(onComplete, 500);
  }, [onComplete, timerSound, timerVibrate]);

  useEffect(() => {
    if (state === "running") {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            finish();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state, finish]);

  function startTimer() {
    setSecondsLeft(60);
    setState("running");
  }

  if (state === "idle") {
    return (
      <Button onClick={startTimer} className="w-full" size="lg">
        Start 60s Rest
      </Button>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="text-4xl font-bold tabular-nums">{secondsLeft}s</div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-primary transition-all duration-1000"
          style={{ width: `${((60 - secondsLeft) / 60) * 100}%` }}
        />
      </div>
      <p className="text-sm text-muted-foreground">
        {state === "complete" ? "Rest complete!" : "Resting..."}
      </p>
    </div>
  );
}
