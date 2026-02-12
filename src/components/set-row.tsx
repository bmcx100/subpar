"use client";

import { Input } from "@/components/ui/input";
import { Check } from "lucide-react";

type SetRowProps = {
  setIndex: number;
  weight: string;
  reps: string;
  completed: boolean;
  weightUnit: string;
  onWeightChange: (value: string) => void;
  onRepsChange: (value: string) => void;
  onCompletedChange: (value: boolean) => void;
};

export function SetRow({
  setIndex,
  weight,
  reps,
  completed,
  weightUnit,
  onWeightChange,
  onRepsChange,
  onCompletedChange,
}: SetRowProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="shrink-0 whitespace-nowrap text-sm font-medium text-muted-foreground">
        Set {setIndex}
      </span>
      <div className="relative w-20 shrink-0">
        <Input
          type="number"
          step="any"
          min="0"
          value={weight}
          onChange={(e) => onWeightChange(e.target.value)}
          className="h-9 pr-8 text-right"
        />
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
          {weightUnit === "KG" ? "kgs" : "lbs"}
        </span>
      </div>
      <div className="relative w-20 shrink-0">
        <Input
          type="number"
          min="0"
          value={reps}
          onChange={(e) => onRepsChange(e.target.value)}
          className="h-9 pr-9 text-right"
        />
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
          reps
        </span>
      </div>
      <div className="flex-1" />
      <button
        type="button"
        onClick={() => onCompletedChange(!completed)}
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded border transition-colors ${
          completed
            ? "border-green-600 bg-green-600 text-white"
            : "border-muted-foreground/30"
        }`}
      >
        <Check className={`h-4 w-4 ${completed ? "" : "text-muted-foreground/20"}`} />
      </button>
    </div>
  );
}
