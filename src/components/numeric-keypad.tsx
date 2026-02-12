"use client";

import { Button } from "@/components/ui/button";
import { Delete } from "lucide-react";

type NumericKeypadProps = {
  value: string;
  onChange: (value: string) => void;
};

const keys = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  [".", "0", "⌫"],
];

export function NumericKeypad({ value, onChange }: NumericKeypadProps) {
  function handleKey(key: string) {
    if (key === "⌫") {
      onChange(value.slice(0, -1));
      return;
    }
    if (key === "." && value.includes(".")) return;
    // Limit to 1 decimal place
    const dotIndex = value.indexOf(".");
    if (dotIndex !== -1 && value.length - dotIndex > 1) return;
    // Limit total length
    if (value.replace(".", "").length >= 4) return;
    onChange(value + key);
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {keys.flat().map((key) => (
        <Button
          key={key}
          variant="outline"
          className="h-14 text-xl font-medium"
          onClick={() => handleKey(key)}
          type="button"
        >
          {key === "⌫" ? <Delete className="h-5 w-5" /> : key}
        </Button>
      ))}
    </div>
  );
}
