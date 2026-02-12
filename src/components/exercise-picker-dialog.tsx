"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Plus } from "lucide-react";

type Exercise = {
  id: string;
  name: string;
};

type ExerciseDefaults = {
  sets: string;
  reps: string;
  weight: string;
};

type ExercisePickerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (exercises: Exercise[], defaults: ExerciseDefaults) => void;
  fetchExercises: () => Promise<Exercise[]>;
  createExercise: (name: string) => Promise<Exercise>;
  weightUnit: string;
};

export function ExercisePickerDialog({
  open,
  onOpenChange,
  onSelect,
  fetchExercises,
  createExercise,
  weightUnit,
}: ExercisePickerDialogProps) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [search, setSearch] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [customName, setCustomName] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [defaults, setDefaults] = useState<ExerciseDefaults>({ sets: "", reps: "", weight: "" });

  const unitLabel = weightUnit === "KG" ? "kgs" : "lbs";

  useEffect(() => {
    if (open) {
      fetchExercises().then(setExercises);
      setSearch("");
      setShowCustom(false);
      setCustomName("");
      setSelectedIds(new Set());
      setDefaults({ sets: "", reps: "", weight: "" });
    }
  }, [open, fetchExercises]);

  function toggleExercise(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleCreateCustom() {
    if (!customName.trim()) return;
    setLoading(true);
    try {
      const exercise = await createExercise(customName.trim());
      setExercises((prev) => [...prev, exercise]);
      setSelectedIds((prev) => new Set(prev).add(exercise.id));
      setCustomName("");
      setShowCustom(false);
    } finally {
      setLoading(false);
    }
  }

  function handleAdd() {
    const selected = exercises.filter((e) => selectedIds.has(e.id));
    if (selected.length === 0) return;
    onSelect(selected, defaults);
    onOpenChange(false);
  }

  const hasSelection = selectedIds.size > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80dvh] p-0 flex flex-col">
        <DialogHeader className="px-4 pt-4">
          <DialogTitle>Add Exercises</DialogTitle>
        </DialogHeader>
        <Command className="flex-1">
          <CommandInput
            placeholder="Search exercises..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList className="max-h-[40dvh]">
            <CommandEmpty>No exercises found.</CommandEmpty>
            <CommandGroup>
              {exercises.map((ex) => {
                const isSelected = selectedIds.has(ex.id);
                return (
                  <CommandItem
                    key={ex.id}
                    value={ex.name}
                    onSelect={() => toggleExercise(ex.id)}
                    className="flex items-center gap-2"
                  >
                    <div
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                        isSelected
                          ? "border-green-600 bg-green-600 text-white"
                          : "border-muted-foreground/30"
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>
                    {ex.name}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
        <div className="border-t px-4 py-3 space-y-3">
          {showCustom ? (
            <div className="flex gap-2">
              <Input
                placeholder="Exercise name"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateCustom()}
              />
              <Button onClick={handleCreateCustom} disabled={loading} size="sm">
                Add
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              size="sm"
              onClick={() => setShowCustom(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Custom Exercise
            </Button>
          )}

          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-[11px] text-muted-foreground">Sets</Label>
              <Input
                inputMode="numeric"
                className="h-7 text-sm"
                placeholder="3"
                value={defaults.sets}
                onChange={(e) => setDefaults((d) => ({ ...d, sets: e.target.value }))}
              />
            </div>
            <div>
              <Label className="text-[11px] text-muted-foreground">Reps</Label>
              <Input
                inputMode="numeric"
                className="h-7 text-sm"
                placeholder="10"
                value={defaults.reps}
                onChange={(e) => setDefaults((d) => ({ ...d, reps: e.target.value }))}
              />
            </div>
            <div>
              <Label className="text-[11px] text-muted-foreground">Weight ({unitLabel})</Label>
              <Input
                inputMode="decimal"
                className="h-7 text-sm"
                placeholder="n/a"
                value={defaults.weight}
                onChange={(e) => setDefaults((d) => ({ ...d, weight: e.target.value }))}
              />
            </div>
          </div>

          <Button
            className={`w-full ${hasSelection ? "bg-green-600 hover:bg-green-700 text-white" : ""}`}
            variant={hasSelection ? "default" : "secondary"}
            size="lg"
            onClick={handleAdd}
            disabled={!hasSelection}
          >
            Add {hasSelection ? `${selectedIds.size} Exercise${selectedIds.size > 1 ? "s" : ""}` : "Exercises"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
