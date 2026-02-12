"use client";

import { useState, useTransition, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ExerciseLogCard, type SetData } from "@/components/exercise-log-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { normalizeStrengthWeightToKg } from "@/lib/core-logic";
import { saveStrengthSession } from "./actions";

const DEFAULT_WEIGHT = "30";
const DEFAULT_REPS = "10";
const DEFAULT_SETS = 3;

type ExerciseInfo = {
  id: string;
  name: string;
  suggestedWeight: string | null;
  autoFill: { weight: string; reps: string }[] | null;
  targetSets: number | null;
  targetReps: number | null;
  targetWeight: number | null;
  isBodyweight: boolean;
  supersetGroupId: string | null;
};

type Props = {
  dayId: string;
  dayLabel: string;
  exercises: ExerciseInfo[];
  weightUnit: string;
};

// A flow step represents one set of one exercise
type FlowStep = {
  exerciseId: string;
  exerciseIndex: number;
  setIndex: number; // 0-based index into that exercise's sets array
};

function buildFlowSteps(exercises: ExerciseInfo[], setCountMap: Record<string, number>): FlowStep[] {
  const steps: FlowStep[] = [];
  const processed = new Set<number>();

  for (let i = 0; i < exercises.length; i++) {
    if (processed.has(i)) continue;
    processed.add(i);

    const ex = exercises[i];
    const groupId = ex.supersetGroupId;

    if (groupId) {
      // Find all exercises in this superset group
      const groupIndices: number[] = [];
      for (let j = i; j < exercises.length; j++) {
        if (exercises[j].supersetGroupId === groupId) {
          groupIndices.push(j);
          processed.add(j);
        }
      }

      // Alternate sets: A set 1, B set 1, A set 2, B set 2...
      const maxSets = Math.max(...groupIndices.map((gi) => setCountMap[exercises[gi].id]));
      for (let s = 0; s < maxSets; s++) {
        for (const gi of groupIndices) {
          if (s < setCountMap[exercises[gi].id]) {
            steps.push({ exerciseId: exercises[gi].id, exerciseIndex: gi, setIndex: s });
          }
        }
      }
    } else {
      // Regular exercise: all sets sequential
      const count = setCountMap[ex.id];
      for (let s = 0; s < count; s++) {
        steps.push({ exerciseId: ex.id, exerciseIndex: i, setIndex: s });
      }
    }
  }

  return steps;
}

// Get superset group labels for display
function getSupersetLabels(exercises: ExerciseInfo[]): Record<string, string> {
  const groupIds = [...new Set(exercises.map((e) => e.supersetGroupId).filter(Boolean))] as string[];
  const labels: Record<string, string> = {};
  groupIds.forEach((gid, i) => {
    labels[gid] = String.fromCharCode(65 + i);
  });
  return labels;
}

function CollapsedCard({
  name,
  sets,
  isCurrent,
  onClick,
  label,
  supersetLabel,
}: {
  name: string;
  sets: SetData[];
  isCurrent: boolean;
  onClick: () => void;
  label?: string;
  supersetLabel?: string | null;
}) {
  return (
    <Card
      className={`cursor-pointer ${isCurrent ? "" : "opacity-50"}`}
      onClick={onClick}
    >
      <CardContent className="flex items-center justify-between px-3 py-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium">{name}</span>
          {supersetLabel && (
            <Badge variant="outline" className="text-[10px] px-1 py-0">
              SS-{supersetLabel}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {label && (
            <span className="text-xs text-muted-foreground">{label}</span>
          )}
          <div className="flex items-center gap-1">
            {sets.map((s, i) => (
              <div
                key={i}
                className={`flex h-4 w-4 items-center justify-center rounded border ${
                  s.completed
                    ? "border-green-600 bg-green-600 text-white"
                    : "border-muted-foreground/30"
                }`}
              >
                {s.completed && <Check className="h-2.5 w-2.5" />}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function StrengthLoggerClient({
  dayId,
  dayLabel,
  exercises,
  weightUnit,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [sessionNotes, setSessionNotes] = useState("");
  const [currentFlowIndex, setCurrentFlowIndex] = useState(0);
  const [showSessionNotes, setShowSessionNotes] = useState(false);
  const activeCardRef = useRef<HTMLDivElement>(null);

  // Compute set counts per exercise: history > routine target > default
  const setCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const ex of exercises) {
      if (ex.autoFill && ex.autoFill.length > 0) {
        map[ex.id] = ex.autoFill.length;
      } else {
        map[ex.id] = ex.targetSets ?? DEFAULT_SETS;
      }
    }
    return map;
  }, [exercises]);

  const supersetLabels = useMemo(() => getSupersetLabels(exercises), [exercises]);

  const flowSteps = useMemo(
    () => buildFlowSteps(exercises, setCountMap),
    [exercises, setCountMap]
  );

  const [exerciseSets, setExerciseSets] = useState<Record<string, SetData[]>>(
    () => {
      const initial: Record<string, SetData[]> = {};
      for (const ex of exercises) {
        const count = setCountMap[ex.id];
        const fill = ex.autoFill;
        const defaultWeight = ex.targetWeight !== null ? String(ex.targetWeight) : DEFAULT_WEIGHT;
        const defaultReps = ex.targetReps !== null ? String(ex.targetReps) : DEFAULT_REPS;

        initial[ex.id] = Array.from({ length: count }, (_, i) => ({
          weight: ex.isBodyweight ? "0" : (fill?.[i]?.weight || defaultWeight),
          reps: fill?.[i]?.reps || defaultReps,
          completed: false,
        }));
      }
      return initial;
    }
  );

  const [exerciseNotes, setExerciseNotes] = useState<Record<string, string>>(
    () => Object.fromEntries(exercises.map((ex) => [ex.id, ""]))
  );

  const currentStep = flowSteps[currentFlowIndex];
  const currentExercise = currentStep ? exercises[currentStep.exerciseIndex] : null;
  // Track which exercise index is "active" for the UI card expansion
  const currentExerciseIndex = currentStep?.exerciseIndex ?? 0;
  const isLastStep = currentFlowIndex === flowSteps.length - 1;

  useEffect(() => {
    activeCardRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [currentExerciseIndex]);

  function handleSetChange(
    exerciseId: string,
    setIndex: number,
    field: "weight" | "reps" | "completed",
    value: string | boolean
  ) {
    setExerciseSets((prev) => {
      const updated = { ...prev };
      const sets = [...updated[exerciseId]];
      sets[setIndex] = { ...sets[setIndex], [field]: value };
      updated[exerciseId] = sets;
      return updated;
    });
  }

  function handleSetComplete() {
    if (!currentStep) return;

    // Mark the current flow step's set as completed
    handleSetChange(currentStep.exerciseId, currentStep.setIndex, "completed", true);

    // Advance to next flow step
    if (!isLastStep) {
      setCurrentFlowIndex((i) => i + 1);
    } else {
      setShowSessionNotes(true);
    }
  }

  function handleNextExercise() {
    if (!currentStep) return;
    // Skip to the next exercise that's different from current
    const currentExId = currentStep.exerciseId;
    for (let i = currentFlowIndex + 1; i < flowSteps.length; i++) {
      if (flowSteps[i].exerciseId !== currentExId) {
        setCurrentFlowIndex(i);
        return;
      }
    }
  }

  function handleFinish() {
    startTransition(async () => {
      try {
        const allSets = exercises.flatMap((ex) =>
          exerciseSets[ex.id].map((set, i) => ({
            exerciseId: ex.id,
            setIndex: i + 1,
            weightKg: normalizeStrengthWeightToKg(
              parseFloat(set.weight) || 0,
              weightUnit as "LB" | "KG"
            ),
            reps: parseInt(set.reps) || 0,
            notes: exerciseNotes[ex.id] || "",
          }))
        );

        await saveStrengthSession({
          routineDayId: dayId,
          notes: sessionNotes,
          sets: allSets,
        });

        toast.success("Session saved!");
        router.push("/");
      } catch {
        toast.error("Failed to save session");
      }
    });
  }

  // Determine which exercise is "next" in the flow for labeling
  const nextExerciseIndex = (() => {
    for (let i = currentFlowIndex + 1; i < flowSteps.length; i++) {
      if (flowSteps[i].exerciseIndex !== currentExerciseIndex) {
        return flowSteps[i].exerciseIndex;
      }
    }
    return null;
  })();

  // Check if next exercise button should be disabled
  const isLastExercise = nextExerciseIndex === null;

  return (
    <div>
      {/* Header */}
      <div className="pb-3">
        <h2 className="text-2xl font-bold">{dayLabel}</h2>
        <p className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Exercise {currentExerciseIndex + 1} of {exercises.length}
          {currentStep && ` — Set ${currentStep.setIndex + 1} of ${setCountMap[currentStep.exerciseId]}`}
        </p>
      </div>

      {/* Exercise List */}
      <div className="space-y-2 pb-48">
        {exercises.map((ex, i) => {
          const ssLabel = ex.supersetGroupId ? supersetLabels[ex.supersetGroupId] ?? null : null;

          if (i === currentExerciseIndex) {
            return (
              <div key={ex.id} ref={activeCardRef}>
                <ExerciseLogCard
                  exerciseName={ex.name}
                  suggestedWeight={ex.suggestedWeight}
                  weightUnit={weightUnit}
                  notes={exerciseNotes[ex.id]}
                  sets={exerciseSets[ex.id]}
                  onSetChange={(setIndex, field, value) =>
                    handleSetChange(ex.id, setIndex, field, value)
                  }
                  onNotesChange={(v) =>
                    setExerciseNotes((prev) => ({ ...prev, [ex.id]: v }))
                  }
                  supersetLabel={ssLabel}
                />
              </div>
            );
          }
          return (
            <CollapsedCard
              key={ex.id}
              name={ex.name}
              sets={exerciseSets[ex.id]}
              isCurrent={false}
              onClick={() => {
                // Find first flow step for this exercise
                const stepIdx = flowSteps.findIndex((s) => s.exerciseIndex === i);
                if (stepIdx !== -1) setCurrentFlowIndex(stepIdx);
              }}
              label={i === nextExerciseIndex ? "Up next" : undefined}
              supersetLabel={ssLabel}
            />
          );
        })}

        {showSessionNotes && (
          <Input
            placeholder="Session notes (optional)"
            value={sessionNotes}
            onChange={(e) => setSessionNotes(e.target.value)}
          />
        )}
      </div>

      {/* Fixed Bottom Buttons */}
      <div className="fixed bottom-16 left-0 right-0 z-40 border-t bg-background px-4 pt-2 pb-2">
        <div className="mx-auto max-w-lg space-y-2">
          <Button
            variant="secondary"
            className="w-full"
            size="lg"
            onClick={handleNextExercise}
            disabled={isLastExercise}
          >
            Next Exercise
          </Button>
          <Button
            variant="secondary"
            className="w-full"
            size="lg"
            onClick={() => {
              setShowSessionNotes(true);
              handleFinish();
            }}
            disabled={isPending}
          >
            {isPending ? "Saving..." : "Finish Session"}
          </Button>
          <Button
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            size="lg"
            onClick={handleSetComplete}
          >
            Set Complete
          </Button>
        </div>
      </div>
    </div>
  );
}
