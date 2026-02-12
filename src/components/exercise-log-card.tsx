"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SetRow } from "@/components/set-row";
import { MessageSquare } from "lucide-react";

export type SetData = {
  weight: string;
  reps: string;
  completed: boolean;
};

type ExerciseLogCardProps = {
  exerciseName: string;
  suggestedWeight: string | null;
  weightUnit: string;
  notes: string;
  sets: SetData[];
  onSetChange: (
    setIndex: number,
    field: "weight" | "reps" | "completed",
    value: string | boolean
  ) => void;
  onNotesChange: (value: string) => void;
  supersetLabel?: string | null;
};

export function ExerciseLogCard({
  exerciseName,
  suggestedWeight,
  weightUnit,
  notes,
  sets,
  onSetChange,
  onNotesChange,
  supersetLabel,
}: ExerciseLogCardProps) {
  const [showNotes, setShowNotes] = useState(!!notes);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">{exerciseName}</CardTitle>
            {supersetLabel && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                SS-{supersetLabel}
              </Badge>
            )}
            {suggestedWeight && (
              <Badge variant="secondary">Next: {suggestedWeight}</Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => setShowNotes(!showNotes)}
            type="button"
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {showNotes && (
          <Input
            placeholder="Exercise notes (optional)"
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            className="h-8 text-xs"
          />
        )}
        {sets.map((set, i) => (
          <SetRow
            key={i}
            setIndex={i + 1}
            weight={set.weight}
            reps={set.reps}
            completed={set.completed}
            weightUnit={weightUnit}
            onWeightChange={(v) => onSetChange(i, "weight", v)}
            onRepsChange={(v) => onSetChange(i, "reps", v)}
            onCompletedChange={(v) => onSetChange(i, "completed", v)}
          />
        ))}
      </CardContent>
    </Card>
  );
}
