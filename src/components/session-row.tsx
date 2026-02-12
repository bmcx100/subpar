import Link from "next/link";
import { ChevronRight } from "lucide-react";

type SessionRowProps = {
  href: string;
  date: Date;
  metrics: { label: string; value: string }[];
};

export function SessionRow({ href, date, metrics }: SessionRowProps) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent"
    >
      <div className="space-y-1">
        <p className="text-sm font-medium">
          {date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </p>
        <div className="flex gap-3">
          {metrics.map((m, i) => (
            <span key={i} className="text-xs text-muted-foreground">
              {m.label}: <span className="font-medium text-foreground">{m.value}</span>
            </span>
          ))}
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}
