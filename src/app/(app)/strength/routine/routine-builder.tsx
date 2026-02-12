"use client";

import { useState, useCallback, useTransition, useEffect } from "react";
import { toast } from "sonner";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SortableList } from "@/components/sortable-list";
import { ExercisePickerDialog } from "@/components/exercise-picker-dialog";
import { Plus } from "lucide-react";
import {
  saveRoutine,
  fetchExercises,
  createExercise,
} from "./actions";

export type ExerciseEntry = {
  id: string;
  name: string;
  targetSets: number | null;
  targetReps: number | null;
  targetWeight: number | null;
  isBodyweight: boolean;
  supersetGroupId: string | null;
};

const DAY_LETTERS = ["A", "B", "C", "D", "E", "F", "G"];

function defaultDay(index: number): DayState {
  return { label: `Day ${DAY_LETTERS[index] ?? index + 1}`, exercises: [] };
}

function defaultExercise(id: string, name: string): ExerciseEntry {
  return { id, name, targetSets: null, targetReps: null, targetWeight: null, isBodyweight: false, supersetGroupId: null };
}

export type DayState = {
  label: string;
  exercises: ExerciseEntry[];
};

type Props = {
  initialName: string;
  initialSessionsPerWeek: number;
  initialDays: DayState[];
  weightUnit: string;
};

export function RoutineBuilder({
  initialName,
  initialSessionsPerWeek,
  initialDays,
  weightUnit,
}: Props) {
  const [name, setName] = useState(initialName);
  const [sessions, setSessions] = useState(String(initialSessionsPerWeek));
  const [days, setDays] = useState<DayState[]>(initialDays);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const handleFetchExercises = useCallback(() => fetchExercises(), []);
  const handleCreateExercise = useCallback(
    (exName: string) => createExercise(exName),
    []
  );

  function openPicker(dayIndex: number) {
    setActiveDayIndex(dayIndex);
    setPickerOpen(true);
  }

  function handleSelectExercises(
    exercises: { id: string; name: string }[],
    defaults: { sets: string; reps: string; weight: string }
  ) {
    setDirty(true);
    setDays((prev) => {
      const updated = [...prev];
      const day = { ...updated[activeDayIndex] };
      const newExercises = exercises.filter(
        (ex) => !day.exercises.some((e) => e.id === ex.id)
      );
      const sets = defaults.sets ? parseInt(defaults.sets) || null : null;
      const reps = defaults.reps ? parseInt(defaults.reps) || null : null;
      const weight = defaults.weight ? parseFloat(defaults.weight) || null : null;
      day.exercises = [
        ...day.exercises,
        ...newExercises.map((ex) => ({
          ...defaultExercise(ex.id, ex.name),
          targetSets: sets,
          targetReps: reps,
          targetWeight: weight,
        })),
      ];
      updated[activeDayIndex] = day;
      return updated;
    });
  }

  function handleReorder(dayIndex: number, items: ExerciseEntry[]) {
    setDirty(true);
    setDays((prev) => {
      const updated = [...prev];
      updated[dayIndex] = { ...updated[dayIndex], exercises: items };
      return updated;
    });
  }

  function handleRemove(dayIndex: number, exerciseId: string) {
    setDirty(true);
    setDays((prev) => {
      const updated = [...prev];
      const day = { ...updated[dayIndex] };
      day.exercises = day.exercises.filter((e) => e.id !== exerciseId);
      updated[dayIndex] = day;
      return updated;
    });
  }

  function handleExerciseUpdate(dayIndex: number, exerciseId: string, updates: Partial<ExerciseEntry>) {
    setDirty(true);
    setDays((prev) => {
      const updated = [...prev];
      const day = { ...updated[dayIndex] };
      day.exercises = day.exercises.map((ex) =>
        ex.id === exerciseId ? { ...ex, ...updates } : ex
      );
      updated[dayIndex] = day;
      return updated;
    });
  }

  function handleSupersetGroup(dayIndex: number, exerciseIds: string[]) {
    setDirty(true);
    setDays((prev) => {
      const updated = [...prev];
      const day = { ...updated[dayIndex] };
      const groupId = crypto.randomUUID();
      day.exercises = day.exercises.map((ex) =>
        exerciseIds.includes(ex.id) ? { ...ex, supersetGroupId: groupId } : ex
      );
      updated[dayIndex] = day;
      return updated;
    });
  }

  function handleSupersetUngroup(dayIndex: number, groupId: string) {
    setDirty(true);
    setDays((prev) => {
      const updated = [...prev];
      const day = { ...updated[dayIndex] };
      day.exercises = day.exercises.map((ex) =>
        ex.supersetGroupId === groupId ? { ...ex, supersetGroupId: null } : ex
      );
      updated[dayIndex] = day;
      return updated;
    });
  }

  function handleDayLabelChange(dayIndex: number, label: string) {
    setDirty(true);
    setDays((prev) => {
      const updated = [...prev];
      updated[dayIndex] = { ...updated[dayIndex], label };
      return updated;
    });
  }

  function handleSave() {
    startTransition(async () => {
      try {
        await saveRoutine({ name, sessionsPerWeek: parseInt(sessions) || 3, days });
        setDirty(false);
        toast.success("Routine saved");
      } catch {
        toast.error("Failed to save routine");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end gap-3">
        <div className="flex-1 space-y-2">
          <Label htmlFor="routineName">Routine Name</Label>
          <Input
            id="routineName"
            value={name}
            onChange={(e) => { setName(e.target.value); setDirty(true); }}
          />
        </div>
        <div className="w-20 space-y-2">
          <Label htmlFor="sessions">Sessions</Label>
          <Input
            id="sessions"
            inputMode="numeric"
            pattern="[1-7]"
            value={sessions}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "" || /^[1-7]$/.test(v)) {
                setSessions(v);
                setDirty(true);
                const count = parseInt(v);
                if (count >= 1 && count <= 7) {
                  setDays((prev) => {
                    if (count === prev.length) return prev;
                    if (count < prev.length) return prev.slice(0, count);
                    return [
                      ...prev,
                      ...Array.from({ length: count - prev.length }, (_, j) =>
                        defaultDay(prev.length + j)
                      ),
                    ];
                  });
                }
              }
            }}
          />
        </div>
      </div>

      <Accordion type="multiple" className="space-y-2 pb-24">
        {days.map((day, i) => (
          <AccordionItem key={i} value={`day-${i}`} className="rounded-lg border px-4">
            <AccordionTrigger className="py-3">
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <Input
                  value={day.label}
                  onChange={(e) => handleDayLabelChange(i, e.target.value)}
                  className="h-8 w-40 text-base font-semibold"
                />
                <span className="text-xs text-muted-foreground">
                  {day.exercises.length} exercise{day.exercises.length !== 1 ? "s" : ""}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3">
              {day.exercises.length > 0 && (
                <SortableList
                  items={day.exercises}
                  onReorder={(items) => handleReorder(i, items)}
                  onRemove={(id) => handleRemove(i, id)}
                  onExerciseUpdate={(exerciseId, updates) => handleExerciseUpdate(i, exerciseId, updates)}
                  onSupersetGroup={(ids) => handleSupersetGroup(i, ids)}
                  onSupersetUngroup={(groupId) => handleSupersetUngroup(i, groupId)}
                  weightUnit={weightUnit}
                />
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => openPicker(i)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Exercise
              </Button>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="fixed bottom-16 left-0 right-0 z-40 border-t bg-background px-4 pt-2 pb-2">
        <div className="mx-auto max-w-lg">
          <Button
            variant={dirty ? "default" : "secondary"}
            className={`w-full ${dirty ? "bg-green-600 hover:bg-green-700 text-white" : ""}`}
            size="lg"
            onClick={handleSave}
            disabled={isPending}
          >
            {isPending ? "Saving..." : "Save Routine"}
          </Button>
        </div>
      </div>

      <ExercisePickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={handleSelectExercises}
        fetchExercises={handleFetchExercises}
        createExercise={handleCreateExercise}
        weightUnit={weightUnit}
      />
    </div>
  );
}
