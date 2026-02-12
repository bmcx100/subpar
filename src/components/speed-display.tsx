type SpeedDisplayProps = {
  value: string;
};

export function SpeedDisplay({ value }: SpeedDisplayProps) {
  return (
    <div className="flex items-baseline justify-center py-4">
      <span className="text-5xl font-bold tabular-nums">
        {value || "0.0"}
      </span>
      <span className="ml-2 text-xl text-muted-foreground">mph</span>
    </div>
  );
}
