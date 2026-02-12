"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
};

type Props = {
  days: Day[];
  defaultDayIndex: number;
};

export function StrengthStartClient({ days, defaultDayIndex }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(defaultDayIndex);
  const [dialogOpen, setDialogOpen] = useState(false);
  const selectedDay = days[selectedIndex];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Strength Session</h2>

      <Card>
        <CardHeader>
          <CardTitle className="text-base text-muted-foreground">
            Next Workout
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{selectedDay.label}</p>
        </CardContent>
      </Card>

      <div className="fixed bottom-16 left-0 right-0 z-40 border-t bg-background px-4 pt-2 pb-2">
        <div className="mx-auto max-w-lg space-y-2">
          <Button asChild variant="secondary" className="w-full" size="lg">
            <Link href="/strength/routine">Edit Routine</Link>
          </Button>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary" className="w-full" size="lg">
                Change Day
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Select Day</DialogTitle>
              </DialogHeader>
              <RadioGroup
                value={String(selectedIndex)}
                onValueChange={(val) => {
                  setSelectedIndex(parseInt(val));
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
