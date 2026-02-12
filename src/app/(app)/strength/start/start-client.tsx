"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

type Day = {
  id: string;
  label: string;
  orderIndex: number;
  exercises: string[];
};

type Props = {
  days: Day[];
  defaultDayIndex: number;
};

export function StrengthStartClient({ days, defaultDayIndex }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(defaultDayIndex);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const selectedDay = days[selectedIndex];

  return (
    <div className="space-y-4 pb-48">
      <h2 className="text-2xl font-bold">Strength Session</h2>

      {/* Next workout — always expanded */}
      <Card className="border-green-600/30">
        <CardContent className="space-y-3">
          <div className="flex items-center gap-4">
            <div className="shrink-0">
              <p className="text-3xl font-bold">{selectedDay.label}</p>
              <p className="mt-1 text-xs text-muted-foreground text-center">Next Workout</p>
            </div>
            {selectedDay.exercises.length > 0 && (
              <ul className="space-y-0.5 border-l pl-4">
                {selectedDay.exercises.map((name, i) => (
                  <li key={i} className="text-sm text-muted-foreground">
                    {name}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Button asChild className="w-full bg-green-600 hover:bg-green-700 text-white" size="lg">
            <Link href={`/strength/session?dayId=${selectedDay.id}`}>
              Start Workout
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Other days — cycled order, tap to peek */}
      {days.length > 1 && (
        <div className="space-y-1.5">
          {Array.from({ length: days.length - 1 }, (_, j) => {
            const i = (selectedIndex + 1 + j) % days.length;
            const day = days[i];
            const isExpanded = expandedIndex === i;
            return (
              <Card
                key={day.id}
                className="cursor-pointer opacity-60 hover:opacity-80 transition-opacity"
                onClick={() => setExpandedIndex(isExpanded ? null : i)}
              >
                <CardContent className="px-3 py-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{day.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {day.exercises.length} exercise{day.exercises.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  {isExpanded && (
                    <>
                      {day.exercises.length > 0 && (
                        <ul className="mt-1.5 space-y-0.5 border-t pt-1.5">
                          {day.exercises.map((name, k) => (
                            <li key={k} className="text-xs text-muted-foreground">
                              {name}
                            </li>
                          ))}
                        </ul>
                      )}
                      <Button
                        variant="secondary"
                        size="sm"
                        className="mt-2 w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedIndex(i);
                          setExpandedIndex(null);
                        }}
                      >
                        Skip {selectedDay.label} - Do This!!!
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Fixed bottom buttons */}
      <div className="fixed bottom-16 left-0 right-0 z-40 border-t bg-background px-4 pt-2 pb-2">
        <div className="mx-auto max-w-lg space-y-2">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary" className="w-full" size="lg">
                Change Next Workout
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Select Next Workout</DialogTitle>
              </DialogHeader>
              <RadioGroup
                value={String(selectedIndex)}
                onValueChange={(val) => {
                  setSelectedIndex(parseInt(val));
                  setExpandedIndex(null);
                  setDialogOpen(false);
                }}
              >
                {days.map((day, i) => (
                  <div key={day.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={String(i)} id={`day-${i}`} />
                    <Label htmlFor={`day-${i}`}>{day.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </DialogContent>
          </Dialog>
          <Button asChild variant="secondary" className="w-full" size="lg">
            <Link href="/strength/routine">Edit Routine</Link>
          </Button>
          <Button asChild className="w-full bg-green-600 hover:bg-green-700 text-white" size="lg">
            <Link href={`/strength/session?dayId=${selectedDay.id}`}>
              Let&apos;s Go!!!
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
