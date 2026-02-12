import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function GolfStartPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Golf Session</h2>
      <Card>
        <CardHeader>
          <CardTitle>SuperSpeed Level 1</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            Guided protocol with rest timers. You&apos;ll be walked through each swing.
          </p>
          <Button asChild className="w-full" size="lg">
            <Link href="/golf/session">Begin Guided Session</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
