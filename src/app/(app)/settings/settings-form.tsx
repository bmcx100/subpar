"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { updateSettings } from "./actions";

type Props = {
  weightUnit: string;
  incrementLb: number;
  incrementKg: number;
  timerSound: boolean;
  timerVibrate: boolean;
};

export function SettingsForm({
  weightUnit,
  incrementLb,
  incrementKg,
  timerSound,
  timerVibrate,
}: Props) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await updateSettings(formData);
        toast.success("Settings saved");
      } catch {
        toast.error("Failed to save settings");
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Units</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup name="weightUnit" defaultValue={weightUnit}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="LB" id="unit-lb" />
              <Label htmlFor="unit-lb">Pounds (lb)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="KG" id="unit-kg" />
              <Label htmlFor="unit-kg">Kilograms (kg)</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Progression Increments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="incrementLb">Increment (lb)</Label>
            <Input
              id="incrementLb"
              name="incrementLb"
              type="number"
              step="0.5"
              min="0"
              defaultValue={incrementLb}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="incrementKg">Increment (kg)</Label>
            <Input
              id="incrementKg"
              name="incrementKg"
              type="number"
              step="0.25"
              min="0"
              defaultValue={incrementKg}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Timer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="timerSound">Sound</Label>
            <Switch
              id="timerSound"
              name="timerSound"
              defaultChecked={timerSound}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="timerVibrate">Vibration</Label>
            <Switch
              id="timerVibrate"
              name="timerVibrate"
              defaultChecked={timerVibrate}
            />
          </div>
        </CardContent>
      </Card>

      <Button type="submit" className="w-full" size="lg" disabled={isPending}>
        {isPending ? "Saving..." : "Save Settings"}
      </Button>
    </form>
  );
}
