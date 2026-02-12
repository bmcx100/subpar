import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type MetricCardProps = {
  value: number | null;
  unit: string;
  label: string;
  subtexts?: string[];
  variant?: "primary" | "secondary";
};

export function MetricCard({
  value,
  unit,
  label,
  subtexts,
  variant = "secondary",
}: MetricCardProps) {
  const isPrimary = variant === "primary";

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {label}
          </CardTitle>
          <Badge variant="secondary">All-Time PR</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div
          className={`font-bold tabular-nums ${
            isPrimary ? "text-4xl" : "text-3xl"
          }`}
        >
          {value !== null ? value.toFixed(1) : "—"}
          <span className="ml-1 text-lg font-normal text-muted-foreground">
            {unit}
          </span>
        </div>
        {subtexts && subtexts.length > 0 && (
          <div className="mt-1 space-y-0.5">
            {subtexts.map((text, i) => (
              <p key={i} className="text-sm text-muted-foreground">
                {text}
              </p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
