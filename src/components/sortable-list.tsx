"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X, SlidersHorizontal, Link2, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import type { ExerciseEntry } from "@/app/(app)/strength/routine/routine-builder";

type SortableListProps = {
  items: ExerciseEntry[];
  onReorder: (items: ExerciseEntry[]) => void;
  onRemove: (id: string) => void;
  onExerciseUpdate: (exerciseId: string, updates: Partial<ExerciseEntry>) => void;
  onSupersetGroup: (exerciseIds: string[]) => void;
  onSupersetUngroup: (groupId: string) => void;
  weightUnit: string;
};

function getSupersetLabels(items: ExerciseEntry[]): Record<string, string> {
  const groupIds = [...new Set(items.map((e) => e.supersetGroupId).filter(Boolean))] as string[];
  const labels: Record<string, string> = {};
  groupIds.forEach((gid, i) => {
    labels[gid] = String.fromCharCode(65 + i);
  });
  return labels;
}

const SUPERSET_COLORS: Record<string, string> = {
  A: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  B: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  C: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  D: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
};

function formatSummary(item: ExerciseEntry, unitLabel: string): string {
  const sets = item.targetSets ?? 3;
  const reps = item.targetReps ?? 10;
  if (item.targetWeight === null || item.targetWeight === 0) return `${sets}×${reps}`;
  return `${sets}×${reps} @ ${item.targetWeight}${unitLabel}`;
}

function SortableRow({
  item,
  onRemove,
  onExerciseUpdate,
  onSupersetUngroup,
  weightUnit,
  supersetLabel,
  expanded,
  onToggleExpand,
  selected,
  onToggleSelect,
  selectingMode,
}: {
  item: ExerciseEntry;
  onRemove: (id: string) => void;
  onExerciseUpdate: (exerciseId: string, updates: Partial<ExerciseEntry>) => void;
  onSupersetUngroup: (groupId: string) => void;
  weightUnit: string;
  supersetLabel: string | null;
  expanded: boolean;
  onToggleExpand: () => void;
  selected: boolean;
  onToggleSelect: () => void;
  selectingMode: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const unitLabel = weightUnit === "KG" ? "kgs" : "lbs";

  function handleWeightChange(v: string) {
    const parsed = parseFloat(v);
    onExerciseUpdate(item.id, {
      targetWeight: v === "" || isNaN(parsed) ? null : parsed,
    });
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-md border bg-background ${
        supersetLabel ? `border-l-2 ${SUPERSET_COLORS[supersetLabel]?.split(" ")[2] ?? "border-l-blue-500/30"}` : ""
      }`}
    >
      {/* Main row */}
      <div className="flex items-center gap-1.5 px-2 py-1.5">
        {/* Show checkbox on all rows when any exercise has superset selected */}
        {selectingMode && (
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggleSelect}
            className="h-3.5 w-3.5 shrink-0 accent-primary"
          />
        )}
        <button
          className="cursor-grab touch-none text-muted-foreground"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <span className="flex-1 text-sm truncate">{item.name}</span>
        {supersetLabel && (
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 ${SUPERSET_COLORS[supersetLabel] ?? ""}`}
          >
            SS-{supersetLabel}
          </Badge>
        )}
        {!expanded && (
          <span className="text-[11px] text-muted-foreground whitespace-nowrap tabular-nums">
            {formatSummary(item, unitLabel)}
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={onToggleExpand}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={() => onRemove(item.id)}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Expanded detail panel */}
      {expanded && (
        <div className="border-t px-3 py-2 space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-[11px] text-muted-foreground">Sets</Label>
              <Input
                inputMode="numeric"
                className="h-7 text-sm"
                value={item.targetSets ?? ""}
                placeholder="3"
                onChange={(e) => {
                  const v = e.target.value;
                  onExerciseUpdate(item.id, {
                    targetSets: v === "" ? null : parseInt(v) || null,
                  });
                }}
              />
            </div>
            <div>
              <Label className="text-[11px] text-muted-foreground">Reps</Label>
              <Input
                inputMode="numeric"
                className="h-7 text-sm"
                value={item.targetReps ?? ""}
                placeholder="10"
                onChange={(e) => {
                  const v = e.target.value;
                  onExerciseUpdate(item.id, {
                    targetReps: v === "" ? null : parseInt(v) || null,
                  });
                }}
              />
            </div>
            <div>
              <Label className="text-[11px] text-muted-foreground">
                Weight ({unitLabel})
              </Label>
              <Input
                inputMode="decimal"
                className="h-7 text-sm"
                value={item.targetWeight ?? ""}
                placeholder="n/a"
                onChange={(e) => handleWeightChange(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={selected}
                onChange={onToggleSelect}
                className="accent-primary"
              />
              Superset
            </label>
            {item.supersetGroupId && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs px-2"
                onClick={() => onSupersetUngroup(item.supersetGroupId!)}
              >
                <Unlink className="h-3 w-3 mr-1" />
                Ungroup
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function SortableList({
  items,
  onReorder,
  onRemove,
  onExerciseUpdate,
  onSupersetGroup,
  onSupersetUngroup,
  weightUnit,
}: SortableListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const supersetLabels = getSupersetLabels(items);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      onReorder(arrayMove(items, oldIndex, newIndex));
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleGroupSelected() {
    const ids = [...selectedIds];
    if (ids.length >= 2) {
      onSupersetGroup(ids);
      setSelectedIds(new Set());
    }
  }

  const canGroup = selectedIds.size >= 2;

  return (
    <div className="space-y-2">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          <div className="space-y-1.5">
            {items.map((item) => (
              <SortableRow
                key={item.id}
                item={item}
                onRemove={onRemove}
                onExerciseUpdate={onExerciseUpdate}
                onSupersetUngroup={onSupersetUngroup}
                weightUnit={weightUnit}
                supersetLabel={item.supersetGroupId ? supersetLabels[item.supersetGroupId] ?? null : null}
                expanded={expandedId === item.id}
                onToggleExpand={() =>
                  setExpandedId((prev) => (prev === item.id ? null : item.id))
                }
                selected={selectedIds.has(item.id)}
                onToggleSelect={() => toggleSelect(item.id)}
                selectingMode={selectedIds.size > 0}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {canGroup && (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={handleGroupSelected}
        >
          <Link2 className="h-3.5 w-3.5 mr-1.5" />
          Group as Superset ({selectedIds.size} exercises)
        </Button>
      )}
    </div>
  );
}
